//! Greedy decoders for the two GigaAM heads.
//!
//! Head weights are dequantized to `f32` at load time, so decoding is plain
//! host arithmetic: the matrices are small and this keeps the autoregressive
//! RNN-T loop free of per-symbol graph setup.

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Token {
    pub id: u32,
    pub frame: usize,
}

pub(crate) struct RnntHead {
    pub embed: Vec<f32>,
    pub hidden: usize,
    /// LSTM gates in PyTorch order `(i, f, g, o)`, each row `[out][in]`.
    pub wx: Vec<f32>,
    pub wh: Vec<f32>,
    pub bias: Vec<f32>,
    pub enc_w: Vec<f32>,
    pub enc_b: Vec<f32>,
    pub pred_w: Vec<f32>,
    pub pred_b: Vec<f32>,
    pub out_w: Vec<f32>,
    pub out_b: Vec<f32>,
    pub joint_hidden: usize,
    pub classes: usize,
    pub blank: u32,
    pub max_symbols: usize,
}

pub(crate) struct CtcHead {
    /// `[classes][dim]`
    pub weight: Vec<f32>,
    pub bias: Vec<f32>,
    pub classes: usize,
    pub blank: u32,
}

pub(crate) enum HeadWeights {
    /// Boxed because an Rnnt head dwarfs a Ctc one; `clippy::large_enum_variant`.
    Rnnt(Box<RnntHead>),
    Ctc(CtcHead),
}

fn dot(row: &[f32], input: &[f32]) -> f32 {
    row.iter().zip(input).map(|(a, b)| a * b).sum()
}

fn sigmoid(value: f32) -> f32 {
    1.0 / (1.0 + (-value).exp())
}

fn argmax(values: &[f32]) -> usize {
    let mut best = 0;
    for (index, value) in values.iter().enumerate() {
        if *value > values[best] {
            best = index;
        }
    }
    best
}

impl RnntHead {
    fn project_encoder(&self, encoded: &[f32], dim: usize, time: usize) -> Vec<f32> {
        let hidden = self.joint_hidden;
        let mut projected = vec![0.0f32; hidden * time];
        for t in 0..time {
            let frame = &encoded[t * dim..(t + 1) * dim];
            for index in 0..hidden {
                let row = &self.enc_w[index * dim..(index + 1) * dim];
                projected[t * hidden + index] = dot(row, frame) + self.enc_b[index];
            }
        }
        projected
    }

    fn lstm_step(&self, input: &[f32], h: &[f32], c: &[f32]) -> (Vec<f32>, Vec<f32>) {
        let hidden = self.hidden;
        let gates = 4 * hidden;
        let mut pre = vec![0.0f32; gates];
        for (((gate, wx), wh), bias) in pre
            .iter_mut()
            .zip(self.wx.chunks(hidden))
            .zip(self.wh.chunks(hidden))
            .zip(&self.bias)
        {
            *gate = dot(wx, input) + dot(wh, h) + bias;
        }
        let mut next_c = vec![0.0f32; hidden];
        let mut next_h = vec![0.0f32; hidden];
        for index in 0..hidden {
            let input_gate = sigmoid(pre[index]);
            let forget_gate = sigmoid(pre[hidden + index]);
            let cell_gate = pre[2 * hidden + index].tanh();
            let output_gate = sigmoid(pre[3 * hidden + index]);
            next_c[index] = forget_gate * c[index] + input_gate * cell_gate;
            next_h[index] = output_gate * next_c[index].tanh();
        }
        (next_h, next_c)
    }

    fn joint(&self, encoder: &[f32], prediction: &[f32], logits: &mut [f32]) -> usize {
        let mut combined = vec![0.0f32; self.joint_hidden];
        for ((gate, encoder), prediction) in combined.iter_mut().zip(encoder).zip(prediction) {
            *gate = (encoder + prediction).max(0.0);
        }
        for ((logit, row), bias) in logits.iter_mut().zip(self.out_w.chunks(self.joint_hidden)).zip(&self.out_b) {
            *logit = dot(row, &combined) + *bias;
        }
        argmax(logits)
    }

    pub(crate) fn decode(&self, encoded: &[f32], dim: usize, time: usize) -> Vec<Token> {
        let projected = self.project_encoder(encoded, dim, time);
        let hidden = self.hidden;
        let mut state_h = vec![0.0f32; hidden];
        let mut state_c = vec![0.0f32; hidden];
        let mut last_label: Option<u32> = None;
        let mut logits = vec![0.0f32; self.classes];
        let mut tokens = Vec::new();
        let zeros = vec![0.0f32; hidden];

        for t in 0..time {
            let encoder = &projected[t * self.joint_hidden..(t + 1) * self.joint_hidden];
            let mut emitted = 0;
            loop {
                let input = match last_label {
                    Some(label) => &self.embed[label as usize * hidden..(label as usize + 1) * hidden],
                    None => zeros.as_slice(),
                };
                let (next_h, next_c) = self.lstm_step(input, &state_h, &state_c);
                let mut prediction = vec![0.0f32; self.joint_hidden];
                for ((projection, row), bias) in prediction.iter_mut().zip(self.pred_w.chunks(hidden)).zip(&self.pred_b) {
                    *projection = dot(row, &next_h) + bias;
                }
                let class = self.joint(encoder, &prediction, &mut logits);
                if class as u32 == self.blank {
                    break;
                }
                tokens.push(Token {
                    id: class as u32,
                    frame: t,
                });
                state_h = next_h;
                state_c = next_c;
                last_label = Some(class as u32);
                emitted += 1;
                if emitted >= self.max_symbols {
                    break;
                }
            }
        }
        tokens
    }
}

impl CtcHead {
    pub(crate) fn decode(&self, encoded: &[f32], dim: usize, time: usize) -> Vec<Token> {
        let mut tokens = Vec::new();
        let mut previous = self.blank;
        for t in 0..time {
            let frame = &encoded[t * dim..(t + 1) * dim];
            let mut best = 0usize;
            let mut best_value = f32::NEG_INFINITY;
            for class in 0..self.classes {
                let row = &self.weight[class * dim..(class + 1) * dim];
                let value = dot(row, frame) + self.bias[class];
                if value > best_value {
                    best_value = value;
                    best = class;
                }
            }
            let class = best as u32;
            if class != self.blank && class != previous {
                tokens.push(Token { id: class, frame: t });
            }
            previous = class;
        }
        tokens
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ctc_collapses_repeats_and_blanks() {
        let head = CtcHead {
            weight: vec![1.0, 0.0, 0.0, 1.0, 0.0, 0.0],
            bias: vec![0.0, 0.0, 0.0],
            classes: 3,
            blank: 2,
        };
        // Frames: class 0, class 0, blank, class 1, class 0.
        let encoded = vec![1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0];
        let tokens = head.decode(&encoded, 2, 5);
        assert_eq!(
            tokens,
            vec![
                Token { id: 0, frame: 0 },
                Token { id: 1, frame: 3 },
                Token { id: 0, frame: 4 },
            ]
        );
    }

    #[test]
    fn rnnt_emits_until_blank() {
        let head = RnntHead {
            // vocab 2, hidden 2
            embed: vec![0.0, 0.0, 1.0, 0.0],
            hidden: 2,
            wx: vec![0.0; 2 * 8],
            wh: vec![0.0; 2 * 8],
            bias: vec![0.0; 8],
            enc_w: vec![1.0, 0.0, 0.0, 1.0],
            enc_b: vec![0.0; 2],
            pred_w: vec![0.0; 4],
            pred_b: vec![0.0; 2],
            // class 1 wins for symbol 1 while the label embedding differs
            out_w: vec![0.0, 1.0, 1.0, 0.0, 0.0, 0.0],
            out_b: vec![0.0, 0.0, 0.0],
            joint_hidden: 2,
            classes: 3,
            blank: 2,
            max_symbols: 2,
        };
        let tokens = head.decode(&[1.0, 0.0], 2, 1);
        assert_eq!(tokens.iter().map(|token| token.id).collect::<Vec<_>>(), vec![1, 1]);
        assert!(tokens.iter().all(|token| token.frame == 0));
    }
}
