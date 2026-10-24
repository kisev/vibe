//! Unsafe graph-building primitives for the GigaAM Conformer port.
//!
//! Activations use the layout `[d_model, time]`: the feature dimension is
//! `ne[0]`, so a linear layer is `ggml_mul_mat(weight[in, out], x)`.

use crate::sys;

pub(crate) type Tensor = *mut sys::ggml_tensor;
pub(crate) type Context = *mut sys::ggml_context;

pub(crate) const LAYER_NORM_EPS: f32 = 1.0e-5;

pub(crate) unsafe fn layer_norm(ctx: Context, x: Tensor, gamma: Tensor, beta: Tensor) -> Tensor {
    let mut y = sys::ggml_norm(ctx, x, LAYER_NORM_EPS);
    y = sys::ggml_mul(ctx, y, gamma);
    sys::ggml_add(ctx, y, beta)
}

pub(crate) unsafe fn linear(ctx: Context, x: Tensor, weight: Tensor, bias: Tensor) -> Tensor {
    let y = sys::ggml_mul_mat(ctx, weight, x);
    add_bias(ctx, y, bias)
}

pub(crate) unsafe fn add_bias(ctx: Context, y: Tensor, bias: Tensor) -> Tensor {
    if bias.is_null() {
        return y;
    }
    let bias = sys::ggml_reshape_2d(ctx, bias, (*bias).ne[0], 1);
    sys::ggml_add(ctx, y, bias)
}

/// A linear layer's weight and bias, always fetched from the model together.
pub(crate) struct Linear {
    pub(crate) weight: Tensor,
    pub(crate) bias: Tensor,
}

pub(crate) unsafe fn feed_forward(
    ctx: Context,
    x: Tensor,
    norm_w: Tensor,
    norm_b: Tensor,
    first: Linear,
    second: Linear,
) -> Tensor {
    let y = layer_norm(ctx, x, norm_w, norm_b);
    let y = linear(ctx, y, first.weight, first.bias);
    let y = sys::ggml_silu(ctx, y);
    linear(ctx, y, second.weight, second.bias)
}

/// `sigmoid(x)` expressed with primitives that every backend keeps.
pub(crate) unsafe fn sigmoid(ctx: Context, x: Tensor) -> Tensor {
    let exp = sys::ggml_exp(ctx, sys::ggml_scale(ctx, x, -1.0));
    let ones = sys::ggml_fill(ctx, sys::ggml_dup_tensor(ctx, exp), 1.0);
    sys::ggml_div(ctx, ones, sys::ggml_add(ctx, ones, exp))
}

/// Rotary embeddings rotate the attention *input* before the linear
/// projections, matching `modeling_gigaam.py`. `cos` and `sin` are
/// `[head_dim, 1, time, 1]` tensors.
pub(crate) unsafe fn rotary(ctx: Context, x: Tensor, cos: Tensor, sin: Tensor, heads: i64, head_dim: i64) -> Tensor {
    let time = (*x).ne[1];
    let x4 = sys::ggml_reshape_4d(ctx, x, head_dim, heads, time, 1);
    let half = head_dim / 2;
    let nb1 = (*x4).nb[1];
    let nb2 = (*x4).nb[2];
    let nb3 = (*x4).nb[3];
    let first = sys::ggml_cont(ctx, sys::ggml_view_4d(ctx, x4, half, heads, time, 1, nb1, nb2, nb3, 0));
    let second = sys::ggml_cont(
        ctx,
        sys::ggml_view_4d(ctx, x4, half, heads, time, 1, nb1, nb2, nb3, half as usize * 4),
    );
    let rotated = sys::ggml_concat(ctx, sys::ggml_scale(ctx, second, -1.0), first, 0);
    let y = sys::ggml_add(ctx, sys::ggml_mul(ctx, x4, cos), sys::ggml_mul(ctx, rotated, sin));
    sys::ggml_cont(ctx, sys::ggml_reshape_2d(ctx, y, head_dim * heads, time))
}

#[allow(clippy::too_many_arguments)]
pub(crate) unsafe fn attention(
    ctx: Context,
    x: Tensor,
    cos: Tensor,
    sin: Tensor,
    q_w: Tensor,
    q_b: Tensor,
    k_w: Tensor,
    k_b: Tensor,
    v_w: Tensor,
    v_b: Tensor,
    out_w: Tensor,
    out_b: Tensor,
    d_model: i64,
    heads: i64,
) -> Tensor {
    let head_dim = d_model / heads;
    let time = (*x).ne[1];
    let rotated = rotary(ctx, x, cos, sin, heads, head_dim);
    let q = linear(ctx, rotated, q_w, q_b);
    let k = linear(ctx, rotated, k_w, k_b);
    let v = linear(ctx, x, v_w, v_b);

    // [d_model, time] -> [head_dim, time, heads, 1], materialized: the
    // following matmuls need contiguous operands.
    let head_shape = |t: Tensor| {
        let split = sys::ggml_reshape_4d(ctx, t, head_dim, heads, time, 1);
        sys::ggml_cont(ctx, sys::ggml_permute(ctx, split, 0, 2, 1, 3))
    };
    let q = head_shape(q);
    let k = head_shape(k);
    let v = head_shape(v);

    let scale = 1.0 / (head_dim as f32).sqrt();
    let scores = sys::ggml_scale(ctx, sys::ggml_mul_mat(ctx, k, q), scale);
    let scores = sys::ggml_soft_max(ctx, scores);
    let v_transposed = sys::ggml_cont(ctx, sys::ggml_permute(ctx, v, 1, 0, 2, 3));
    let output = sys::ggml_mul_mat(ctx, v_transposed, scores);
    // [head_dim, time, head] -> [head_dim, head, time] so folding the head
    // axis into d_model leaves time as the slow axis of [d_model, time].
    let output = sys::ggml_cont(ctx, sys::ggml_permute(ctx, output, 0, 2, 1, 3));
    let output = sys::ggml_reshape_2d(ctx, output, d_model, time);
    linear(ctx, output, out_w, out_b)
}

/// Depthwise 1-D convolution along time. `kernel` has GGUF shape
/// `[k, 1, channels]`; input and output are `[channels, time]`.
pub(crate) unsafe fn depthwise_conv(ctx: Context, x: Tensor, kernel: Tensor, bias: Tensor) -> Tensor {
    let channels = (*x).ne[0];
    let kernel_size = (*kernel).ne[0];
    let padding = (kernel_size - 1) / 2;
    let y = sys::ggml_cont(ctx, sys::ggml_permute(ctx, x, 1, 0, 2, 3));
    let y = sys::ggml_reshape_3d(ctx, y, (*y).ne[0], channels, 1);
    let y = sys::ggml_conv_1d_dw(ctx, kernel, y, 1, padding as i32, 1);
    let y = sys::ggml_cont(ctx, sys::ggml_permute(ctx, y, 1, 0, 2, 3));
    add_bias(ctx, y, bias)
}

#[allow(clippy::too_many_arguments)]
pub(crate) unsafe fn conv_module(
    ctx: Context,
    x: Tensor,
    pw1_w: Tensor,
    pw1_b: Tensor,
    dw_w: Tensor,
    dw_b: Tensor,
    ln_w: Tensor,
    ln_b: Tensor,
    pw2_w: Tensor,
    pw2_b: Tensor,
    d_model: i64,
) -> Tensor {
    let time = (*x).ne[1];
    let pw1 = sys::ggml_reshape_2d(ctx, pw1_w, d_model, 2 * d_model);
    let y = add_bias(ctx, sys::ggml_mul_mat(ctx, pw1, x), pw1_b);
    let gate = sys::ggml_view_2d(ctx, y, d_model, time, (*y).nb[1], 0);
    let value = sys::ggml_view_2d(
        ctx,
        y,
        d_model,
        time,
        (*y).nb[1],
        d_model as usize * sys::ggml_element_size(y),
    );
    let y = sys::ggml_mul(ctx, gate, sigmoid(ctx, sys::ggml_cont(ctx, value)));
    let y = depthwise_conv(ctx, y, dw_w, dw_b);
    let y = layer_norm(ctx, y, ln_w, ln_b);
    let y = sys::ggml_silu(ctx, y);
    let pw2 = sys::ggml_reshape_2d(ctx, pw2_w, d_model, d_model);
    add_bias(ctx, sys::ggml_mul_mat(ctx, pw2, y), pw2_b)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::runtime::{CpuRuntime, Graph};

    type InputSpec = (Vec<f32>, [i64; 4]);

    fn run(build: impl FnOnce(Context, &[Tensor]) -> Tensor, specs: Vec<InputSpec>, expected: &[f32], expected_shape: &[i64]) {
        unsafe {
            let runtime = CpuRuntime::new().unwrap();
            let mut graph = Graph::new().unwrap();
            let inputs = specs
                .into_iter()
                .map(|(data, shape)| {
                    (
                        sys::ggml_new_tensor_4d(
                            graph.ctx,
                            sys::ggml_type_GGML_TYPE_F32,
                            shape[0],
                            shape[1],
                            shape[2],
                            shape[3],
                        ),
                        data,
                    )
                })
                .collect::<Vec<_>>();
            let pointers = inputs.iter().map(|(tensor, _)| *tensor).collect::<Vec<_>>();
            let output = build(graph.ctx, &pointers);
            graph.output(output);
            let refs = inputs
                .iter()
                .map(|(tensor, data)| (*tensor, data.as_slice()))
                .collect::<Vec<_>>();
            runtime.execute(&mut graph, &refs).unwrap();
            let mut values = vec![0.0f32; expected.len()];
            sys::ggml_backend_tensor_get(output, values.as_mut_ptr().cast(), 0, expected.len() * 4);
            for (actual, expected) in values.iter().zip(expected) {
                assert!(
                    (actual - expected).abs() < 1e-2,
                    "{actual} != {expected} (ggml_conv_1d rounds the im2col operand to F16)"
                );
            }
            let shape = &(&(*output).ne)[..expected_shape.len()];
            assert_eq!(shape, expected_shape);
        }
    }

    #[test]
    fn rotary_rotates_halves_in_place_of_positions() {
        run(
            |ctx, inputs| unsafe { rotary(ctx, inputs[0], inputs[1], inputs[2], 1, 4) },
            vec![
                (vec![1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0], [4, 2, 1, 1]),
                (vec![1.0; 8], [4, 1, 2, 1]),
                (vec![0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0], [4, 1, 2, 1]),
            ],
            &[1.0, 2.0, 3.0, 4.0, -2.0, -2.0, 12.0, 14.0],
            &[4, 2],
        );
    }

    #[test]
    fn rotary_matches_numpy_reference() {
        const X: [f32; 12] = [
            0.47942554,
            0.99923163,
            0.40921417,
            -0.635_308,
            0.76432894,
            0.917_438,
            0.05156977,
            -0.871_575_8,
            0.945_784,
            0.71147335,
            -0.31305436,
            -0.989_879_8,
        ];
        const COS: [f32; 6] = [1.0, 1.0, 0.54030231, 0.54030231, -0.41614684, -0.41614684];
        const SIN: [f32; 6] = [0.0, 0.0, 0.84147098, 0.84147098, 0.909_297_4, 0.909_297_4];
        const EXPECTED: [f32; 12] = [
            0.47942554,
            0.99923163,
            0.40921417,
            -0.635_308,
            -0.35902873,
            1.138_854_5,
            0.761_269,
            -0.42751993,
            -1.040_525_9,
            0.563_921_6,
            1.030_371_8,
            0.12727583,
        ];
        run(
            |ctx, inputs| unsafe { rotary(ctx, inputs[0], inputs[1], inputs[2], 2, 2) },
            vec![
                (X.to_vec(), [4, 3, 1, 1]),
                (COS.to_vec(), [2, 1, 3, 1]),
                (SIN.to_vec(), [2, 1, 3, 1]),
            ],
            &EXPECTED,
            &[4, 3],
        );
    }

    #[test]
    fn attention_matches_numpy_reference() {
        const X: [f32; 12] = [
            0.47942554,
            0.99923163,
            0.40921417,
            -0.635_308,
            0.76432894,
            0.917_438,
            0.05156977,
            -0.871_575_8,
            0.945_784,
            0.71147335,
            -0.31305436,
            -0.989_879_8,
        ];
        const Q: [f32; 16] = [
            0.64421769,
            0.744_643_1,
            0.830_497_4,
            0.90010044,
            0.952_090_3,
            0.98544973,
            0.99952583,
            0.994_043_2,
            0.969_109_1,
            0.92521152,
            0.86320937,
            0.78431593,
            0.690_075,
            0.58233065,
            0.46319126,
            0.33498815,
        ];
        const QB: [f32; 4] = [0.09983342, 0.32404303, 0.531_186_2, 0.71035327];
        const K: [f32; 16] = [
            0.64421769,
            0.813_415_5,
            0.932_039_1,
            0.992_713,
            0.991_664_8,
            0.928_959_7,
            0.808_496_4,
            0.637_764_7,
            0.42737988,
            0.19042265,
            -0.05837414,
            -0.303_541_5,
            -0.529_836_1,
            -0.723_188_1,
            -0.871_575_8,
            -0.96577306,
        ];
        const KB: [f32; 4] = [0.09983342, 0.531_186_2, 0.852_108, 0.99588084];
        const V: [f32; 16] = [
            0.64421769,
            0.87235548,
            0.98865176,
            0.978_196_6,
            0.84233043,
            0.598_472_1,
            0.27788593,
            -0.07832703,
            -0.42449797,
            -0.716_245_6,
            -0.91616594,
            -0.998_628,
            -0.953_059_6,
            -0.78530295,
            -0.51686544,
            -0.182_162_5,
        ];
        const VB: [f32; 4] = [0.09983342, 0.71035327, 0.99588084, 0.825_785];
        const OW: [f32; 16] = [
            0.64421769,
            0.920_750_6,
            0.997_606_4,
            0.858_117_8,
            0.532_534_9,
            0.09146464,
            -0.36944096,
            -0.75022833,
            -0.968_318_6,
            -0.976_416,
            -0.772_764_5,
            -0.401_528_6,
            0.05678413,
            0.50278248,
            0.839_745_7,
            0.994_598_8,
        ];
        const OB: [f32; 4] = [0.09983342, 0.852_108, 0.932_615, 0.27788593];
        const COS: [f32; 6] = [1.0, 1.0, 0.54030231, 0.54030231, -0.41614684, -0.41614684];
        const SIN: [f32; 6] = [0.0, 0.0, 0.84147098, 0.84147098, 0.909_297_4, 0.909_297_4];
        const EXPECTED: [f32; 12] = [
            2.544_824_6,
            1.538_659,
            -1.930_211_3,
            1.333_652,
            2.568_493,
            1.521_454_7,
            -1.943_409_1,
            1.358_888_5,
            2.620_562,
            1.470_884_9,
            -1.964_701_7,
            1.422_416_9,
        ];
        run(
            |ctx, inputs| unsafe {
                attention(
                    ctx, inputs[0], inputs[9], inputs[10], inputs[1], inputs[2], inputs[3], inputs[4], inputs[5], inputs[6],
                    inputs[7], inputs[8], 4, 2,
                )
            },
            vec![
                (X.to_vec(), [4, 3, 1, 1]),
                (Q.to_vec(), [4, 4, 1, 1]),
                (QB.to_vec(), [4, 1, 1, 1]),
                (K.to_vec(), [4, 4, 1, 1]),
                (KB.to_vec(), [4, 1, 1, 1]),
                (V.to_vec(), [4, 4, 1, 1]),
                (VB.to_vec(), [4, 1, 1, 1]),
                (OW.to_vec(), [4, 4, 1, 1]),
                (OB.to_vec(), [4, 1, 1, 1]),
                (COS.to_vec(), [2, 1, 3, 1]),
                (SIN.to_vec(), [2, 1, 3, 1]),
            ],
            &EXPECTED,
            &[4, 3],
        );
    }
    #[test]
    fn strided_conv_matches_direct_convolution() {
        let (time, channels, outputs, kernel, stride, padding) = (9usize, 3usize, 4usize, 3usize, 2i32, 1i32);
        let input = (0..time * channels)
            .map(|index| (index as f32 * 0.37).sin())
            .collect::<Vec<_>>();
        let weights = (0..kernel * channels * outputs)
            .map(|index| (index as f32 * 0.11).cos())
            .collect::<Vec<_>>();
        let out_time = (time as i32 + 2 * padding - kernel as i32) / stride + 1;
        let mut expected = vec![0.0f32; out_time as usize * outputs];
        for t in 0..out_time as usize {
            for o in 0..outputs {
                let mut sum = 0.0f32;
                for c in 0..channels {
                    for k in 0..kernel {
                        let position = t as i32 * stride + k as i32 - padding;
                        if position >= 0 && (position as usize) < time {
                            sum += input[position as usize + time * c] * weights[k + kernel * (c + channels * o)];
                        }
                    }
                }
                // ggml memory order: time is ne[0], so time varies fastest.
                expected[o * out_time as usize + t] = sum;
            }
        }
        run(
            |ctx, inputs| unsafe { sys::ggml_conv_1d(ctx, inputs[0], inputs[1], stride, padding, 1) },
            vec![
                (weights, [kernel as i64, channels as i64, outputs as i64, 1]),
                (input, [time as i64, channels as i64, 1, 1]),
            ],
            &expected,
            &[out_time as i64, outputs as i64, 1],
        );
    }

    #[test]
    fn depthwise_conv_sums_neighbours() {
        run(
            |ctx, inputs| unsafe { depthwise_conv(ctx, inputs[0], inputs[1], inputs[2]) },
            vec![
                (vec![1.0, 2.0, 3.0, 4.0], [1, 4, 1, 1]),
                (vec![1.0, 1.0, 1.0], [3, 1, 1, 1]),
                (vec![0.0], [1, 1, 1, 1]),
            ],
            &[3.0, 6.0, 9.0, 7.0],
            &[1, 4],
        );
    }
}
