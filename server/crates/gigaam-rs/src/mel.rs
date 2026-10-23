use rayon::prelude::*;
use rustfft::num_complex::Complex64;
use rustfft::{Fft, FftPlanner};
use std::sync::Arc;

use crate::{Error, Result};

/// Log-mel frontend parameters. The filterbank and window themselves are
/// baked into the GGUF, so only geometry and clamping live here.
#[derive(Debug, Clone, PartialEq)]
pub struct MelConfig {
    pub sample_rate: usize,
    pub num_mels: usize,
    pub n_fft: usize,
    pub win_length: usize,
    pub hop_length: usize,
    pub center: bool,
    pub log_clamp_min: f32,
    pub log_clamp_max: f32,
}

impl Default for MelConfig {
    fn default() -> Self {
        Self {
            sample_rate: 16_000,
            num_mels: 64,
            n_fft: 320,
            win_length: 320,
            hop_length: 160,
            center: false,
            log_clamp_min: 1e-9,
            log_clamp_max: 1e9,
        }
    }
}

#[derive(Debug, Clone)]
pub struct MelFeatures {
    /// Row-major `[num_mels, num_frames]` natural-log mel power.
    pub data: Vec<f32>,
    pub num_mels: usize,
    pub num_frames: usize,
}

/// Log-mel frontend with the model's own Hann window and HTK filterbank.
/// Frames are not centered, matching `torchaudio` with `center=False`.
pub struct MelFrontend {
    config: MelConfig,
    window: Vec<f32>,
    filterbank: Vec<f32>,
    fft: Arc<dyn Fft<f64>>,
}

impl MelFrontend {
    pub fn new(config: MelConfig, window: Vec<f32>, filterbank: Vec<f32>) -> Result<Self> {
        if config.n_fft == 0
            || config.win_length == 0
            || config.win_length > config.n_fft
            || config.hop_length == 0
            || config.num_mels == 0
        {
            return Err(Error::InvalidMetadata {
                key: "stt.frontend",
                message: "invalid FFT/mel dimensions".into(),
            });
        }
        let bins = config.n_fft / 2 + 1;
        if window.len() != config.win_length {
            return Err(Error::InvalidMetadata {
                key: "frontend.window",
                message: format!("window has {} values, expected {}", window.len(), config.win_length),
            });
        }
        if filterbank.len() != config.num_mels * bins {
            return Err(Error::InvalidMetadata {
                key: "frontend.mel_filterbank",
                message: format!(
                    "filterbank has {} values, expected {}",
                    filterbank.len(),
                    config.num_mels * bins
                ),
            });
        }
        let fft = FftPlanner::<f64>::new().plan_fft_forward(config.n_fft);
        Ok(Self {
            config,
            window,
            filterbank,
            fft,
        })
    }

    pub fn config(&self) -> &MelConfig {
        &self.config
    }

    pub fn compute(&self, pcm: &[f32]) -> Result<MelFeatures> {
        let cfg = &self.config;
        if pcm.len() < cfg.win_length {
            return Err(Error::Load(format!(
                "audio is too short for GigaAM's frontend: {} samples, need at least {}",
                pcm.len(),
                cfg.win_length
            )));
        }
        let num_frames = (pcm.len() - cfg.win_length) / cfg.hop_length + 1;
        let num_freq = cfg.n_fft / 2 + 1;
        let frames = (0..num_frames)
            .into_par_iter()
            .map_init(
                || (vec![Complex64::default(); cfg.n_fft], vec![0.0f64; num_freq]),
                |(frame, power), t| {
                    let start = t * cfg.hop_length;
                    for k in 0..cfg.n_fft {
                        let sample = if k < cfg.win_length {
                            pcm[start + k] as f64 * self.window[k] as f64
                        } else {
                            0.0
                        };
                        frame[k] = Complex64::new(sample, 0.0);
                    }
                    self.fft.process(frame);
                    for k in 0..num_freq {
                        power[k] = frame[k].norm_sqr();
                    }
                    (0..cfg.num_mels)
                        .map(|m| {
                            let row = &self.filterbank[m * num_freq..(m + 1) * num_freq];
                            let sum = row.iter().zip(power.iter()).map(|(&a, &b)| a as f64 * b).sum::<f64>();
                            let clamped = sum.clamp(cfg.log_clamp_min as f64, cfg.log_clamp_max as f64);
                            clamped.ln() as f32
                        })
                        .collect::<Vec<_>>()
                },
            )
            .collect::<Vec<_>>();

        let mut output = vec![0.0f32; cfg.num_mels * num_frames];
        for (t, frame) in frames.iter().enumerate() {
            for m in 0..cfg.num_mels {
                output[m * num_frames + t] = frame[m];
            }
        }
        Ok(MelFeatures {
            data: output,
            num_mels: cfg.num_mels,
            num_frames,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn frontend() -> MelFrontend {
        let window = (0..320)
            .map(|k| (0.5 - 0.5 * (2.0 * std::f64::consts::PI * k as f64 / 320.0).cos()) as f32)
            .collect::<Vec<_>>();
        let filterbank = vec![0.0f32; 64 * 161];
        MelFrontend::new(MelConfig::default(), window, filterbank).unwrap()
    }

    #[test]
    fn gigaam_frame_geometry() {
        let frontend = frontend();
        let features = frontend.compute(&vec![0.0; 16_000]).unwrap();
        assert_eq!((features.num_mels, features.num_frames), (64, 99));
        assert!(features.data.iter().all(|value| value.is_finite()));
        assert!(features.data.iter().all(|value| *value == 1e-9f32.ln()));
    }

    #[test]
    fn rejects_short_audio() {
        assert!(frontend().compute(&[0.0; 100]).is_err());
    }
}
