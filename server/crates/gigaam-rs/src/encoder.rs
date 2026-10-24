use crate::model::Model;
use crate::ops::{attention, conv_module, feed_forward, layer_norm, Context, Linear, Tensor};
use crate::sys;

unsafe fn weight(model: &Model, name: &str) -> Tensor {
    model.tensor(name).expect("validated tensor catalog")
}

fn conv_bias(ctx: Context, bias: Tensor) -> Tensor {
    unsafe { sys::ggml_reshape_3d(ctx, bias, 1, (*bias).ne[0], 1) }
}

pub(crate) unsafe fn build_pre_encode(ctx: Context, model: &Model, mel: Tensor) -> Tensor {
    let mut x = sys::ggml_conv_1d(ctx, weight(model, "enc.pre_encode.conv.0.weight"), mel, 2, 2, 1);
    x = sys::ggml_relu(
        ctx,
        sys::ggml_add(ctx, x, conv_bias(ctx, weight(model, "enc.pre_encode.conv.0.bias"))),
    );
    x = sys::ggml_conv_1d(ctx, weight(model, "enc.pre_encode.conv.2.weight"), x, 2, 2, 1);
    x = sys::ggml_relu(
        ctx,
        sys::ggml_add(ctx, x, conv_bias(ctx, weight(model, "enc.pre_encode.conv.2.bias"))),
    );
    let y = sys::ggml_cont(ctx, sys::ggml_permute(ctx, x, 1, 0, 2, 3));
    sys::ggml_cont(ctx, sys::ggml_reshape_2d(ctx, y, (*y).ne[0], (*y).ne[1]))
}

/// Output length after the two stride-2 convolutions.
#[cfg(test)]
pub(crate) fn subsampled_frames(frames: usize) -> usize {
    let first = frames.div_ceil(2);
    first.div_ceil(2)
}

unsafe fn block(ctx: Context, model: &Model, x: Tensor, cos: Tensor, sin: Tensor, layer: i32) -> Tensor {
    let n = |suffix: &str| format!("enc.blocks.{layer}.{suffix}");
    let w = |suffix: &str| weight(model, &n(suffix));
    let dimension = model.info().encoder_dimension as i64;

    let ffn = feed_forward(
        ctx,
        x,
        w("norm_ff1.weight"),
        w("norm_ff1.bias"),
        Linear {
            weight: w("ff1.linear1.weight"),
            bias: w("ff1.linear1.bias"),
        },
        Linear {
            weight: w("ff1.linear2.weight"),
            bias: w("ff1.linear2.bias"),
        },
    );
    let mut residual = sys::ggml_add(ctx, x, sys::ggml_scale(ctx, ffn, 0.5));

    let norm = layer_norm(ctx, residual, w("norm_attn.weight"), w("norm_attn.bias"));
    let attn = attention(
        ctx,
        norm,
        cos,
        sin,
        w("attn.linear_q.weight"),
        w("attn.linear_q.bias"),
        w("attn.linear_k.weight"),
        w("attn.linear_k.bias"),
        w("attn.linear_v.weight"),
        w("attn.linear_v.bias"),
        w("attn.linear_out.weight"),
        w("attn.linear_out.bias"),
        dimension,
        model.info().encoder_heads as i64,
    );
    residual = sys::ggml_add(ctx, residual, attn);

    let norm = layer_norm(ctx, residual, w("norm_conv.weight"), w("norm_conv.bias"));
    let conv = conv_module(
        ctx,
        norm,
        w("conv.pointwise1.weight"),
        w("conv.pointwise1.bias"),
        w("conv.depthwise.weight"),
        w("conv.depthwise.bias"),
        w("conv.ln.weight"),
        w("conv.ln.bias"),
        w("conv.pointwise2.weight"),
        w("conv.pointwise2.bias"),
        dimension,
    );
    residual = sys::ggml_add(ctx, residual, conv);

    let ffn = feed_forward(
        ctx,
        residual,
        w("norm_ff2.weight"),
        w("norm_ff2.bias"),
        Linear {
            weight: w("ff2.linear1.weight"),
            bias: w("ff2.linear1.bias"),
        },
        Linear {
            weight: w("ff2.linear2.weight"),
            bias: w("ff2.linear2.bias"),
        },
    );
    residual = sys::ggml_add(ctx, residual, sys::ggml_scale(ctx, ffn, 0.5));
    layer_norm(ctx, residual, w("norm_out.weight"), w("norm_out.bias"))
}

pub(crate) struct EncoderBuild {
    pub output: Tensor,
    pub cos: Tensor,
    pub sin: Tensor,
}

pub(crate) unsafe fn build_encoder(ctx: Context, model: &Model, mel: Tensor) -> EncoderBuild {
    let mut x = build_pre_encode(ctx, model, mel);
    let time = (*x).ne[1];
    let head_dim = model.info().encoder_dimension as i64 / model.info().encoder_heads as i64;
    let cos = sys::ggml_new_tensor_4d(ctx, sys::ggml_type_GGML_TYPE_F32, head_dim, 1, time, 1);
    let sin = sys::ggml_new_tensor_4d(ctx, sys::ggml_type_GGML_TYPE_F32, head_dim, 1, time, 1);
    for layer in 0..model.info().encoder_layers {
        x = block(ctx, model, x, cos, sin, layer);
    }
    EncoderBuild { output: x, cos, sin }
}

/// Rotary cos/sin tables for `time` positions, laid out `[head_dim, 1, time, 1]`.
///
/// `base` comes from the metadata: GigaAM passes `pos_emb_max_len` as the
/// positional-encoding base, so the usual 10000 is not what the model was
/// trained with.
pub(crate) fn rotary_tables(head_dim: usize, time: usize, base: f64) -> (Vec<f32>, Vec<f32>) {
    let half = head_dim / 2;
    let mut cos = vec![0.0f32; head_dim * time];
    let mut sin = vec![0.0f32; head_dim * time];
    for position in 0..time {
        for index in 0..half {
            let frequency = 1.0 / base.powf(2.0 * index as f64 / head_dim as f64);
            let angle = position as f64 * frequency;
            let (sine, cosine) = angle.sin_cos();
            cos[position * head_dim + index] = cosine as f32;
            cos[position * head_dim + half + index] = cosine as f32;
            sin[position * head_dim + index] = sine as f32;
            sin[position * head_dim + half + index] = sine as f32;
        }
    }
    (cos, sin)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn subsampling_halves_twice() {
        assert_eq!(subsampled_frames(100), 25);
        assert_eq!(subsampled_frames(99), 25);
        assert_eq!(subsampled_frames(101), 26);
    }

    #[test]
    fn rotary_tables_duplicate_halves() {
        let (cos, sin) = rotary_tables(4, 2, 10_000.0);
        assert_eq!(cos.len(), 8);
        assert!((cos[1] - (1.0f32)).abs() < 1e-6);
        assert!((sin[0]).abs() < 1e-6);
        assert!((sin[4] - 1.0f32.sin()).abs() < 1e-6);
    }
}
