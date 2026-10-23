//! The loaded model and what it can do: run the encoder, decode a chunk, and
//! walk a long recording segment by segment.
//!
//! Loading a GGUF into one of these — metadata, tensor catalog, head
//! dequantization, GPU upload — lives in [`crate::load`].

use std::time::Instant;

use crate::decoder::HeadWeights;
use crate::encoder::{build_encoder, rotary_tables};
use crate::load::lookup_tensor;
use crate::mel::{MelConfig, MelFeatures, MelFrontend};
use crate::runtime::Graph;
use crate::{sys, Error, Result, Token, Tokenizer, FRAME_SAMPLES};

/// GigaAM is trained on utterances up to about 25 seconds.
pub const MAX_INPUT_SECONDS: f64 = 25.0;

#[derive(Debug, Clone, PartialEq)]
pub struct ModelInfo {
    pub architecture: String,
    pub variant: String,
    pub head_kind: String,
    pub languages: Vec<String>,
    pub language_detection: bool,
    pub tensor_count: usize,
    pub encoder_layers: i32,
    pub encoder_dimension: i32,
    pub encoder_heads: i32,
    pub encoder_d_ff: i32,
    pub encoder_conv_kernel: i32,
    pub subsampling_factor: i32,
    pub subs_kernel_size: i32,
    pub pos_emb_base: i32,
    pub frontend: MelConfig,
    pub predictor_hidden: i32,
    pub predictor_layers: i32,
    pub joint_hidden: i32,
    pub classes: i32,
    pub max_input_seconds: f64,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Transcription {
    pub text: String,
    pub tokens: Vec<Token>,
}

#[derive(Debug, Clone, PartialEq, Default)]
pub struct LongFormTranscription {
    pub segments: Vec<Transcription>,
}

impl LongFormTranscription {
    pub fn text(&self) -> String {
        self.segments
            .iter()
            .map(|segment| segment.text.trim())
            .filter(|text| !text.is_empty())
            .collect::<Vec<_>>()
            .join(" ")
    }
}

/// Loaded GGUF metadata and tensor storage.
///
/// The GGML context owns the mapped tensor data. It must outlive every tensor
/// pointer used by the inference graph, so it is kept beside the GGUF context.
pub struct Model {
    pub(crate) gguf: *mut sys::gguf_context,
    pub(crate) weights: *mut sys::ggml_context,
    pub(crate) info: ModelInfo,
    pub(crate) tokenizer: Tokenizer,
    pub(crate) head: HeadWeights,
    pub(crate) mel: MelFrontend,
    pub(crate) device: Option<DeviceWeights>,
}

pub(crate) struct DeviceWeights {
    pub(crate) ctx: *mut sys::ggml_context,
    pub(crate) buffer: sys::ggml_backend_buffer_t,
    pub(crate) backend: sys::ggml_backend_t,
}

impl Drop for DeviceWeights {
    fn drop(&mut self) {
        unsafe {
            sys::ggml_backend_buffer_free(self.buffer);
            sys::ggml_free(self.ctx);
            sys::ggml_backend_free(self.backend);
        }
    }
}

impl Drop for Model {
    fn drop(&mut self) {
        unsafe {
            sys::ggml_free(self.weights);
            sys::gguf_free(self.gguf);
        }
    }
}

unsafe impl Send for Model {}

impl Model {
    pub fn info(&self) -> &ModelInfo {
        &self.info
    }

    pub fn tokenizer(&self) -> &Tokenizer {
        &self.tokenizer
    }

    pub fn mel(&self) -> &MelFrontend {
        &self.mel
    }

    fn validate_language(&self, language: &str) -> Result<&'static str> {
        match language {
            "" | "auto" | "ru" => Ok("ru"),
            other => Err(Error::UnsupportedLanguage(other.to_owned())),
        }
    }

    /// Transcribes a single utterance that already fits the model window.
    pub fn transcribe_chunk(&self, samples: &[f32], language: &str) -> Result<Transcription> {
        self.validate_language(language)?;
        let started = Instant::now();
        let features = self.transcribe_features(samples)?;
        let mel_ms = started.elapsed().as_millis();
        let encoder_started = Instant::now();
        let (encoded, shape) = self.encode(&features)?;
        let encoder_ms = encoder_started.elapsed().as_millis();
        let time = shape[1] as usize;
        let decoder_started = Instant::now();
        let dimension = self.info.encoder_dimension as usize;
        let tokens = match &self.head {
            HeadWeights::Rnnt(head) => head.decode(&encoded, dimension, time),
            HeadWeights::Ctc(head) => head.decode(&encoded, dimension, time),
        };
        let ids = tokens.iter().map(|token| token.id).collect::<Vec<_>>();
        let text = self.tokenizer.decode_clean(&ids);
        eprintln!(
            "[gigaam][chunk] samples={} mel_ms={mel_ms} encoder_ms={encoder_ms} decoder_ms={} frames={time} tokens={} total_ms={}",
            samples.len(),
            decoder_started.elapsed().as_millis(),
            tokens.len(),
            started.elapsed().as_millis()
        );
        Ok(Transcription { text, tokens })
    }

    fn transcribe_features(&self, samples: &[f32]) -> Result<MelFeatures> {
        self.mel.compute(samples)
    }

    /// Runs the encoder for already computed mel features.
    pub fn encode(&self, features: &MelFeatures) -> Result<(Vec<f32>, [i64; 3])> {
        unsafe {
            let runtime = crate::runtime::accelerated_runtime(self.device.as_ref().map(|device| device.backend))?;
            let mut graph = Graph::new()?;
            let input = sys::ggml_new_tensor_4d(
                graph.ctx,
                sys::ggml_type_GGML_TYPE_F32,
                features.num_frames as i64,
                features.num_mels as i64,
                1,
                1,
            );
            let built = build_encoder(graph.ctx, self, input);
            graph.output(built.output);
            let time = (*built.output).ne[1] as usize;
            let head_dim = self.info.encoder_dimension as usize / self.info.encoder_heads as usize;
            let (cos, sin) = rotary_tables(head_dim, time, self.info.pos_emb_base as f64);
            runtime.execute(&mut graph, &[(input, &features.data), (built.cos, &cos), (built.sin, &sin)])?;
            let shape = [(*built.output).ne[0], (*built.output).ne[1], (*built.output).ne[2]];
            let count = shape.iter().product::<i64>() as usize;
            let mut data = vec![0.0f32; count];
            sys::ggml_backend_tensor_get(built.output, data.as_mut_ptr().cast(), 0, count * 4);
            Ok((data, shape))
        }
    }

    pub fn transcribe(&self, vad: &mut vad_rs::Vad, samples: &[f32], language: &str) -> Result<LongFormTranscription> {
        self.transcribe_with(vad, samples, language, || false, |_| {}, |_| {})
    }

    pub fn transcribe_with(
        &self,
        vad: &mut vad_rs::Vad,
        samples: &[f32],
        language: &str,
        mut should_abort: impl FnMut() -> bool,
        mut on_segment: impl FnMut(&Transcription),
        mut on_progress: impl FnMut(i32),
    ) -> Result<LongFormTranscription> {
        self.validate_language(language)?;
        let all_started = Instant::now();
        let ranges = vad.segments(samples).map_err(|error| Error::Vad(error.to_string()))?;
        let total_samples = ranges
            .iter()
            .map(|range| range.end_sample.saturating_sub(range.start_sample))
            .sum::<usize>()
            .max(1);
        let mut processed_samples = 0;
        on_progress(0);
        let mut result = LongFormTranscription {
            segments: Vec::with_capacity(ranges.len()),
        };
        let mut last_frame = None;
        for range in ranges {
            if should_abort() {
                return Err(Error::Aborted);
            }
            let chunk = &samples[range.start_sample..range.end_sample];
            let mut transcription = self.transcribe_chunk(chunk, language)?;
            let frame_offset = range.start_sample / FRAME_SAMPLES;
            for token in &mut transcription.tokens {
                token.frame += frame_offset;
            }
            if let Some(frame) = last_frame {
                transcription.tokens.retain(|token| token.frame > frame);
            }
            last_frame = transcription.tokens.last().map(|token| token.frame).or(last_frame);
            for segment in crate::segment::split_sentences(transcription.tokens, &self.tokenizer) {
                on_segment(&segment);
                result.segments.push(segment);
            }
            processed_samples += range.end_sample.saturating_sub(range.start_sample);
            on_progress(((processed_samples * 100) / total_samples).min(100) as i32);
        }
        eprintln!(
            "[gigaam][long-form] total_ms={} segments={} audio_s={:.3}",
            all_started.elapsed().as_millis(),
            result.segments.len(),
            samples.len() as f64 / 16_000.0
        );
        Ok(result)
    }

    pub(crate) fn tensor(&self, name: &str) -> Option<*mut sys::ggml_tensor> {
        if let Some(device) = &self.device {
            return lookup_tensor(device.ctx, name);
        }
        self.cpu_tensor(name)
    }

    pub(crate) fn cpu_tensor(&self, name: &str) -> Option<*mut sys::ggml_tensor> {
        lookup_tensor(self.weights, name)
    }
}
