//! GGUF loading: hyperparameters, weights (uploaded to a GPU backend when there is one), tensor catalog.

use std::ffi::{CStr, CString};
use std::path::Path;
use std::ptr;
use std::time::Instant;

use crate::runtime::{backend_name, load_backends_once, Tensor};
use crate::{sys, Error, Result};

pub const ARCHITECTURE: &str = "nemotron3_diar";

#[derive(Debug, Clone)]
pub struct HParams {
    pub hidden_size: usize,
    pub intermediate_size: usize,
    pub num_layers: usize,
    pub num_heads: usize,
    pub num_mels: usize,
    pub subsampling_factor: usize,
    pub rope_theta: f32,
    pub head_hidden_size: usize,
    pub num_speakers: usize,
    pub chunk_length: usize,
    pub chunk_right_context: usize,
    pub fifo_length: usize,
    pub speaker_cache_update_period: usize,
    pub cache_length: usize,
    pub cache_silence_frames: usize,
    pub prediction_score_threshold: f32,
    pub latest_frames_score_boost: f32,
    pub strong_boost_rate: f32,
    pub weak_boost_rate: f32,
    pub min_positive_scores_rate: f32,
    pub sample_rate: usize,
    pub n_fft: usize,
    pub win_length: usize,
    pub hop_length: usize,
    pub preemphasis: f32,
}

pub(crate) struct LayerWeights {
    pub ln1_w: Tensor,
    pub ln1_b: Tensor,
    pub q: Tensor,
    pub k: Tensor,
    pub v: Tensor,
    pub o_w: Tensor,
    pub o_b: Tensor,
    pub ln2_w: Tensor,
    pub ln2_b: Tensor,
    pub fc1_w: Tensor,
    pub fc1_b: Tensor,
    pub fc2_w: Tensor,
    pub fc2_b: Tensor,
}

/// Resolved tensor pointers, on the device the graphs run on.
pub(crate) struct Weights {
    pub embed: Tensor,
    pub in_ln_w: Tensor,
    pub in_ln_b: Tensor,
    pub layers: Vec<LayerWeights>,
    pub out_ln_w: Tensor,
    pub out_ln_b: Tensor,
    pub proj_w: Tensor,
    pub proj_b: Tensor,
    /// `[in, out, k]` in GGML order: each tap is a contiguous `[in, out]` matrix.
    pub up_w: Tensor,
    pub up_b: Tensor,
    pub dense_w: Tensor,
    pub dense_b: Tensor,
    pub cls_w: Tensor,
    pub cls_b: Tensor,
}

pub(crate) struct Model {
    gguf: *mut sys::gguf_context,
    host: *mut sys::ggml_context,
    device: Option<DeviceWeights>,
    pub hparams: HParams,
    pub weights: Weights,
    /// Learned embedding filling the reserved silence slots of a compressed speaker cache.
    pub silence_embeds: Vec<f32>,
}

// SAFETY: the raw ggml/gguf contexts and the device buffer are not thread-safe
// under concurrent access. `Diarizer` exposes only `&mut self` methods, so the
// model can move between threads but is never used from two threads at once.
unsafe impl Send for Model {}

struct DeviceWeights {
    ctx: *mut sys::ggml_context,
    buffer: sys::ggml_backend_buffer_t,
    backend: sys::ggml_backend_t,
}

impl Model {
    pub fn load(path: &Path) -> Result<Self> {
        let _span = tracing::info_span!("load", path = %path.display()).entered();
        let started = Instant::now();
        let c_path = CString::new(path.to_string_lossy().as_bytes()).map_err(|_| Error::InvalidPath)?;
        let mut host = ptr::null_mut();
        // SAFETY: `c_path` is a valid NUL-terminated string; the call creates
        // both contexts and hands their ownership to the caller.
        let gguf = unsafe {
            sys::gguf_init_from_file(
                c_path.as_ptr(),
                sys::gguf_init_params {
                    no_alloc: false,
                    ctx: &mut host,
                },
            )
        };
        if gguf.is_null() || host.is_null() {
            // SAFETY: freeing the handle just created here; `Drop` cannot run
            // because `Model` has not been constructed yet.
            unsafe {
                if !gguf.is_null() {
                    sys::gguf_free(gguf);
                }
            }
            return Err(Error::Load(path.display().to_string()));
        }
        let read_ms = started.elapsed().as_secs_f64() * 1e3;

        // From here `Drop` owns both contexts, so every early return frees them.
        let mut model = Self {
            gguf,
            host,
            device: None,
            hparams: placeholder_hparams(),
            weights: Weights::empty(),
            silence_embeds: Vec::new(),
        };
        // SAFETY: `gguf` and `host` are the live contexts created above and are
        // exclusively owned by `model` from here on.
        unsafe {
            let architecture = string(gguf, "general.architecture")?;
            if architecture != ARCHITECTURE {
                return Err(Error::UnsupportedArchitecture(architecture));
            }
            model.hparams = read_hparams(gguf)?;
            model.silence_embeds = model.host_f32("silence_embeds")?;
            if model.silence_embeds.len() != model.hparams.hidden_size {
                return Err(Error::InvalidMetadata {
                    key: "silence_embeds",
                    message: format!(
                        "{} values, expected {}",
                        model.silence_embeds.len(),
                        model.hparams.hidden_size
                    ),
                });
            }
            model.device = DeviceWeights::upload(&model_tensors(gguf, host))?;
            model.weights = model.resolve_weights()?;
        }

        // SAFETY: `host` is alive and its tensors are not mutated by this read.
        let (tensors, bytes) = unsafe { tensor_stats(&model_tensors(gguf, host)) };
        tracing::info!(
            tensors,
            mb = bytes as f64 / 1e6,
            layers = model.hparams.num_layers,
            hidden = model.hparams.hidden_size,
            speakers = model.hparams.num_speakers,
            device = model
                .device
                .as_ref()
                // SAFETY: `d` comes from `self.device`, which owns the backend.
                .map(|d| unsafe { backend_name(d.backend) })
                .unwrap_or_else(|| "cpu".into()),
            read_ms,
            total_ms = started.elapsed().as_secs_f64() * 1e3,
            "model loaded"
        );
        Ok(model)
    }

    pub fn device_backend(&self) -> Option<sys::ggml_backend_t> {
        self.device.as_ref().map(|device| device.backend)
    }

    unsafe fn tensor(&self, name: &str) -> Result<Tensor> {
        let c_name = CString::new(name).map_err(|_| Error::MissingTensor(name.to_owned()))?;
        let ctx = self.device.as_ref().map(|device| device.ctx).unwrap_or(self.host);
        let tensor = sys::ggml_get_tensor(ctx, c_name.as_ptr());
        if tensor.is_null() {
            Err(Error::MissingTensor(name.to_owned()))
        } else {
            Ok(tensor)
        }
    }

    unsafe fn host_f32(&self, name: &str) -> Result<Vec<f32>> {
        let c_name = CString::new(name).map_err(|_| Error::MissingTensor(name.to_owned()))?;
        let tensor = sys::ggml_get_tensor(self.host, c_name.as_ptr());
        if tensor.is_null() {
            return Err(Error::MissingTensor(name.to_owned()));
        }
        if (*tensor).type_ != sys::ggml_type_GGML_TYPE_F32 {
            return Err(Error::InvalidMetadata {
                key: "tensor type",
                message: format!("{name} must be F32"),
            });
        }
        let count = sys::ggml_nelements(tensor) as usize;
        Ok(std::slice::from_raw_parts((*tensor).data.cast::<f32>(), count).to_vec())
    }

    unsafe fn resolve_weights(&self) -> Result<Weights> {
        let h = &self.hparams;
        let hidden = h.hidden_size as i64;
        let intermediate = h.intermediate_size as i64;
        let head = h.head_hidden_size as i64;
        let factor = h.subsampling_factor as i64;

        let t = |name: &str| self.tensor(name);
        let checked = |name: &str, expected: &[i64]| -> Result<Tensor> {
            let tensor = t(name)?;
            expect_shape(tensor, expected, name)?;
            Ok(tensor)
        };
        let layers = (0..h.num_layers)
            .map(|i| {
                let prefix = format!("model.audio_tower.layers.{i}");
                let checked = |suffix: &str, expected: &[i64]| -> Result<Tensor> {
                    let name = format!("{prefix}.{suffix}");
                    let tensor = t(&name)?;
                    expect_shape(tensor, expected, &name)?;
                    Ok(tensor)
                };
                Ok(LayerWeights {
                    ln1_w: checked("layer_norm1.weight", &[hidden])?,
                    ln1_b: checked("layer_norm1.bias", &[hidden])?,
                    q: checked("self_attn.q_proj.weight", &[hidden, hidden])?,
                    k: checked("self_attn.k_proj.weight", &[hidden, hidden])?,
                    v: checked("self_attn.v_proj.weight", &[hidden, hidden])?,
                    o_w: checked("self_attn.o_proj.weight", &[hidden, hidden])?,
                    o_b: checked("self_attn.o_proj.bias", &[hidden])?,
                    ln2_w: checked("layer_norm2.weight", &[hidden])?,
                    ln2_b: checked("layer_norm2.bias", &[hidden])?,
                    fc1_w: checked("mlp.fc1.weight", &[hidden, intermediate])?,
                    fc1_b: checked("mlp.fc1.bias", &[intermediate])?,
                    fc2_w: checked("mlp.fc2.weight", &[intermediate, hidden])?,
                    fc2_b: checked("mlp.fc2.bias", &[hidden])?,
                })
            })
            .collect::<Result<Vec<_>>>()?;

        let embed = checked(
            "model.audio_tower.embedder.projection.weight",
            &[h.num_mels as i64 * factor, hidden],
        )?;

        // The classifier's inner width is not in the metadata, so `dense` defines
        // it and the output projection must agree on both dimensions.
        let dense_w = t("classifier.dense.weight")?;
        expect_shape(dense_w, &[head], "classifier.dense.weight")?;
        let inner = (*dense_w).ne[1];
        let dense_b = checked("classifier.dense.bias", &[inner])?;
        let cls_w = checked("classifier.out_proj.weight", &[inner, h.num_speakers as i64])?;
        let cls_b = checked("classifier.out_proj.bias", &[h.num_speakers as i64])?;

        Ok(Weights {
            embed,
            in_ln_w: checked("model.audio_tower.input_layer_norm.weight", &[hidden])?,
            in_ln_b: checked("model.audio_tower.input_layer_norm.bias", &[hidden])?,
            layers,
            out_ln_w: checked("model.audio_tower.layer_norm.weight", &[hidden])?,
            out_ln_b: checked("model.audio_tower.layer_norm.bias", &[hidden])?,
            proj_w: checked("model.proj.weight", &[hidden, head])?,
            proj_b: checked("model.proj.bias", &[head])?,
            up_w: checked("model.upsampler.conv.weight", &[head, head * factor, 3])?,
            up_b: checked("model.upsampler.conv.bias", &[head * factor])?,
            dense_w,
            dense_b,
            cls_w,
            cls_b,
        })
    }
}

impl Drop for Model {
    fn drop(&mut self) {
        // Device weights first: they hold a backend and a buffer, the host context only memory.
        self.device = None;
        // SAFETY: both handles were created in `load` and are freed exactly once
        // here; the tensors referenced by `weights` are gone after this drop.
        unsafe {
            sys::ggml_free(self.host);
            sys::gguf_free(self.gguf);
        }
    }
}

impl DeviceWeights {
    /// Copies every host tensor to a GPU backend. `None` runs on the CPU against the mapped host data.
    unsafe fn upload(source: &[Tensor]) -> Result<Option<Self>> {
        if std::env::var_os("NEMOTRON_DIARIZE_CPU").is_some() {
            tracing::info!("NEMOTRON_DIARIZE_CPU set, keeping weights on the CPU");
            return Ok(None);
        }
        load_backends_once();
        let backend = sys::ggml_backend_init_by_type(sys::ggml_backend_dev_type_GGML_BACKEND_DEVICE_TYPE_GPU, ptr::null());
        if backend.is_null() {
            tracing::info!("no GPU backend, running on the CPU");
            return Ok(None);
        }
        let started = Instant::now();
        let ctx = sys::ggml_init(sys::ggml_init_params {
            mem_size: sys::ggml_tensor_overhead() * (source.len() + 8),
            mem_buffer: ptr::null_mut(),
            no_alloc: true,
        });
        if ctx.is_null() {
            sys::ggml_backend_free(backend);
            return Err(Error::Ggml("device weight context"));
        }
        for &tensor in source {
            let copy = sys::ggml_dup_tensor(ctx, tensor);
            sys::ggml_set_name(copy, sys::ggml_get_name(tensor));
        }
        let buffer = sys::ggml_backend_alloc_ctx_tensors(ctx, backend);
        if buffer.is_null() {
            sys::ggml_free(ctx);
            sys::ggml_backend_free(backend);
            return Err(Error::Ggml("device weight buffer"));
        }
        for &src in source {
            let dst = sys::ggml_get_tensor(ctx, sys::ggml_get_name(src));
            if dst.is_null() {
                sys::ggml_backend_buffer_free(buffer);
                sys::ggml_free(ctx);
                sys::ggml_backend_free(backend);
                return Err(Error::Ggml("device weight tensor"));
            }
            sys::ggml_backend_tensor_set(dst, (*src).data, 0, sys::ggml_nbytes(src));
        }
        tracing::info!(
            backend = backend_name(backend),
            mb = sys::ggml_backend_buffer_get_size(buffer) as f64 / 1e6,
            ms = started.elapsed().as_secs_f64() * 1e3,
            "weights uploaded"
        );
        Ok(Some(Self { ctx, buffer, backend }))
    }
}

impl Drop for DeviceWeights {
    fn drop(&mut self) {
        // SAFETY: all three handles were created together in `upload` and are
        // freed once, the buffer before the context it was allocated from.
        unsafe {
            sys::ggml_backend_buffer_free(self.buffer);
            sys::ggml_free(self.ctx);
            sys::ggml_backend_free(self.backend);
        }
    }
}

impl Weights {
    fn empty() -> Self {
        let null = ptr::null_mut();
        Self {
            embed: null,
            in_ln_w: null,
            in_ln_b: null,
            layers: Vec::new(),
            out_ln_w: null,
            out_ln_b: null,
            proj_w: null,
            proj_b: null,
            up_w: null,
            up_b: null,
            dense_w: null,
            dense_b: null,
            cls_w: null,
            cls_b: null,
        }
    }
}

/// The GGUF's tensors. Iterating the host context instead would also yield the
/// data blob `gguf_init_from_file` adds when it loads data, duplicating every weight.
unsafe fn model_tensors(gguf: *const sys::gguf_context, host: *mut sys::ggml_context) -> Vec<Tensor> {
    (0..sys::gguf_get_n_tensors(gguf))
        .map(|id| sys::ggml_get_tensor(host, sys::gguf_get_tensor_name(gguf, id)))
        .filter(|tensor| !tensor.is_null())
        .collect()
}

/// Checks the leading `ne` dimensions against what the compute graph expects.
/// A mismatch would otherwise reach `ggml_mul_mat`, which aborts the process.
unsafe fn expect_shape(tensor: Tensor, expected: &[i64], name: &str) -> Result<()> {
    let ne = (*tensor).ne;
    let actual = &ne[..expected.len()];
    if actual != expected {
        return Err(Error::InvalidMetadata {
            key: "tensor shape",
            message: format!("{name}: shape {actual:?}, expected {expected:?} (re-export with scripts/export.py)"),
        });
    }
    Ok(())
}

unsafe fn tensor_stats(tensors: &[Tensor]) -> (usize, usize) {
    (tensors.len(), tensors.iter().map(|&tensor| sys::ggml_nbytes(tensor)).sum())
}

fn placeholder_hparams() -> HParams {
    HParams {
        hidden_size: 0,
        intermediate_size: 0,
        num_layers: 0,
        num_heads: 0,
        num_mels: 0,
        subsampling_factor: 0,
        rope_theta: 0.0,
        head_hidden_size: 0,
        num_speakers: 0,
        chunk_length: 0,
        chunk_right_context: 0,
        fifo_length: 0,
        speaker_cache_update_period: 0,
        cache_length: 0,
        cache_silence_frames: 0,
        prediction_score_threshold: 0.0,
        latest_frames_score_boost: 0.0,
        strong_boost_rate: 0.0,
        weak_boost_rate: 0.0,
        min_positive_scores_rate: 0.0,
        sample_rate: 0,
        n_fft: 0,
        win_length: 0,
        hop_length: 0,
        preemphasis: 0.0,
    }
}

unsafe fn read_hparams(ctx: *const sys::gguf_context) -> Result<HParams> {
    let u = |key: &'static str| u32_value(ctx, key).map(|v| v as usize);
    let f = |key: &'static str| f32_value(ctx, key);
    let hparams = HParams {
        hidden_size: u("nemotron3_diar.audio.hidden_size")?,
        intermediate_size: u("nemotron3_diar.audio.intermediate_size")?,
        num_layers: u("nemotron3_diar.audio.num_layers")?,
        num_heads: u("nemotron3_diar.audio.num_heads")?,
        num_mels: u("nemotron3_diar.audio.num_mels")?,
        subsampling_factor: u("nemotron3_diar.audio.subsampling_factor")?,
        rope_theta: f("nemotron3_diar.audio.rope_theta")?,
        head_hidden_size: u("nemotron3_diar.head.hidden_size")?,
        num_speakers: u("nemotron3_diar.head.num_speakers")?,
        chunk_length: u("nemotron3_diar.offline.chunk_length")?,
        chunk_right_context: u("nemotron3_diar.offline.chunk_right_context")?,
        fifo_length: u("nemotron3_diar.offline.fifo_length")?,
        speaker_cache_update_period: u("nemotron3_diar.offline.speaker_cache_update_period")?,
        cache_length: u("nemotron3_diar.cache.length")?,
        cache_silence_frames: u("nemotron3_diar.cache.silence_frames_per_speaker")?,
        prediction_score_threshold: f("nemotron3_diar.cache.prediction_score_threshold")?,
        latest_frames_score_boost: f("nemotron3_diar.cache.latest_frames_score_boost")?,
        strong_boost_rate: f("nemotron3_diar.cache.strong_boost_rate")?,
        weak_boost_rate: f("nemotron3_diar.cache.weak_boost_rate")?,
        min_positive_scores_rate: f("nemotron3_diar.cache.min_positive_scores_rate")?,
        sample_rate: u("nemotron3_diar.mel.sample_rate")?,
        n_fft: u("nemotron3_diar.mel.n_fft")?,
        win_length: u("nemotron3_diar.mel.win_length")?,
        hop_length: u("nemotron3_diar.mel.hop_length")?,
        preemphasis: f("nemotron3_diar.mel.preemphasis")?,
    };
    validate_hparams(&hparams)?;
    tracing::debug!(?hparams, "hparams");
    Ok(hparams)
}

/// Upper bounds for metadata-supplied sizes: far above any real Nemotron
/// variant, and low enough that dimensions cannot overflow when multiplied in
/// the graph builders or request absurd allocations.
const MAX_DIM: usize = 1 << 20;
const MAX_LAYERS: usize = 1024;
const MAX_SPEAKERS: usize = 4096;
const MAX_SAMPLE_RATE: usize = 1 << 20;

/// Rejects metadata that would make the pipeline divide or index by zero
/// (or allocate an impossible graph) instead of failing on the first call.
fn validate_hparams(h: &HParams) -> Result<()> {
    let invalid = |key: &'static str, message: &str| Error::InvalidMetadata {
        key,
        message: message.into(),
    };
    for (key, value, max) in [
        ("nemotron3_diar.audio.hidden_size", h.hidden_size, MAX_DIM),
        ("nemotron3_diar.audio.intermediate_size", h.intermediate_size, MAX_DIM),
        ("nemotron3_diar.audio.num_layers", h.num_layers, MAX_LAYERS),
        ("nemotron3_diar.audio.num_heads", h.num_heads, MAX_DIM),
        ("nemotron3_diar.audio.subsampling_factor", h.subsampling_factor, MAX_DIM),
        ("nemotron3_diar.head.hidden_size", h.head_hidden_size, MAX_DIM),
        ("nemotron3_diar.head.num_speakers", h.num_speakers, MAX_SPEAKERS),
        ("nemotron3_diar.offline.chunk_length", h.chunk_length, MAX_DIM),
        ("nemotron3_diar.cache.length", h.cache_length, MAX_DIM),
        ("nemotron3_diar.mel.num_mels", h.num_mels, MAX_DIM),
        ("nemotron3_diar.mel.n_fft", h.n_fft, MAX_DIM),
        ("nemotron3_diar.mel.win_length", h.win_length, MAX_DIM),
        ("nemotron3_diar.mel.hop_length", h.hop_length, MAX_DIM),
        ("nemotron3_diar.mel.sample_rate", h.sample_rate, MAX_SAMPLE_RATE),
    ] {
        if value == 0 {
            return Err(invalid(key, "must be greater than zero"));
        }
        if value > max {
            return Err(invalid(key, "value is out of range"));
        }
    }
    if !h.hidden_size.is_multiple_of(h.num_heads) {
        return Err(invalid("nemotron3_diar.audio.num_heads", "must divide hidden_size"));
    }
    if h.chunk_right_context >= h.chunk_length {
        return Err(invalid(
            "nemotron3_diar.offline.chunk_right_context",
            "must be below chunk_length",
        ));
    }
    // The Hann window divides by `win_length - 1` and is centered in an
    // `n_fft` frame, so a shorter-than-2 or oversized window is unusable.
    if h.win_length < 2 || h.win_length > h.n_fft {
        return Err(invalid("nemotron3_diar.mel.win_length", "must be within 2..=n_fft"));
    }
    // The cache picks `cache_length` frames (select_nth_unstable on index
    // `cache_length - 1`) and divides by the speaker count.
    match h
        .cache_silence_frames
        .checked_add(1)
        .and_then(|slots| slots.checked_mul(h.num_speakers))
    {
        Some(slots) if h.cache_length >= slots => {}
        Some(_) => return Err(invalid("nemotron3_diar.cache.length", "too small for the speaker count")),
        None => return Err(invalid("nemotron3_diar.cache.length", "speaker cache size overflows")),
    }
    if !h.rope_theta.is_finite() || h.rope_theta <= 0.0 {
        return Err(invalid("nemotron3_diar.audio.rope_theta", "must be a positive number"));
    }
    for (key, value) in [
        ("nemotron3_diar.mel.preemphasis", h.preemphasis),
        (
            "nemotron3_diar.cache.prediction_score_threshold",
            h.prediction_score_threshold,
        ),
        ("nemotron3_diar.cache.latest_frames_score_boost", h.latest_frames_score_boost),
        ("nemotron3_diar.cache.strong_boost_rate", h.strong_boost_rate),
        ("nemotron3_diar.cache.weak_boost_rate", h.weak_boost_rate),
        ("nemotron3_diar.cache.min_positive_scores_rate", h.min_positive_scores_rate),
    ] {
        if !value.is_finite() {
            return Err(invalid(key, "must be finite"));
        }
    }
    Ok(())
}

unsafe fn key(ctx: *const sys::gguf_context, name: &'static str) -> Result<i64> {
    let c_name = CString::new(name).map_err(|_| Error::MissingMetadata(name))?;
    let id = sys::gguf_find_key(ctx, c_name.as_ptr());
    (id >= 0).then_some(id).ok_or(Error::MissingMetadata(name))
}

unsafe fn string(ctx: *const sys::gguf_context, name: &'static str) -> Result<String> {
    let value = sys::gguf_get_val_str(ctx, key(ctx, name)?);
    if value.is_null() {
        return Err(Error::InvalidMetadata {
            key: name,
            message: "null string".into(),
        });
    }
    Ok(CStr::from_ptr(value).to_string_lossy().into_owned())
}

unsafe fn u32_value(ctx: *const sys::gguf_context, name: &'static str) -> Result<u32> {
    Ok(sys::gguf_get_val_u32(ctx, key(ctx, name)?))
}

unsafe fn f32_value(ctx: *const sys::gguf_context, name: &'static str) -> Result<f32> {
    Ok(sys::gguf_get_val_f32(ctx, key(ctx, name)?))
}

#[cfg(test)]
mod tests {
    use super::*;

    /// The real model's geometry, so the validation tests also pin the values
    /// a legitimate export carries.
    fn valid_hparams() -> HParams {
        HParams {
            hidden_size: 1024,
            intermediate_size: 4096,
            num_layers: 31,
            num_heads: 8,
            num_mels: 128,
            subsampling_factor: 8,
            rope_theta: 10_000.0,
            head_hidden_size: 256,
            num_speakers: 8,
            chunk_length: 24,
            chunk_right_context: 4,
            fifo_length: 16,
            speaker_cache_update_period: 8,
            cache_length: 188,
            cache_silence_frames: 3,
            prediction_score_threshold: 0.5,
            latest_frames_score_boost: 0.5,
            strong_boost_rate: 0.5,
            weak_boost_rate: 0.25,
            min_positive_scores_rate: 0.5,
            sample_rate: 16_000,
            n_fft: 512,
            win_length: 400,
            hop_length: 160,
            preemphasis: 0.97,
        }
    }

    fn rejected_key(hparams: &HParams) -> &'static str {
        match validate_hparams(hparams) {
            Err(Error::InvalidMetadata { key, .. }) => key,
            other => panic!("expected InvalidMetadata, got {other:?}"),
        }
    }

    fn assert_rejects(mutate: impl Fn(&mut HParams), key: &'static str) {
        let mut hparams = valid_hparams();
        mutate(&mut hparams);
        assert_eq!(rejected_key(&hparams), key);
    }

    #[test]
    fn accepts_the_model_geometry() {
        assert!(validate_hparams(&valid_hparams()).is_ok());
    }

    #[test]
    fn zero_dimensions_are_rejected() {
        assert_rejects(|h| h.hidden_size = 0, "nemotron3_diar.audio.hidden_size");
        assert_rejects(|h| h.intermediate_size = 0, "nemotron3_diar.audio.intermediate_size");
        assert_rejects(|h| h.num_layers = 0, "nemotron3_diar.audio.num_layers");
        assert_rejects(|h| h.num_heads = 0, "nemotron3_diar.audio.num_heads");
        assert_rejects(|h| h.subsampling_factor = 0, "nemotron3_diar.audio.subsampling_factor");
        assert_rejects(|h| h.head_hidden_size = 0, "nemotron3_diar.head.hidden_size");
        assert_rejects(|h| h.num_speakers = 0, "nemotron3_diar.head.num_speakers");
        assert_rejects(|h| h.chunk_length = 0, "nemotron3_diar.offline.chunk_length");
        assert_rejects(|h| h.cache_length = 0, "nemotron3_diar.cache.length");
        assert_rejects(|h| h.num_mels = 0, "nemotron3_diar.mel.num_mels");
        assert_rejects(|h| h.n_fft = 0, "nemotron3_diar.mel.n_fft");
        assert_rejects(|h| h.win_length = 0, "nemotron3_diar.mel.win_length");
        assert_rejects(|h| h.hop_length = 0, "nemotron3_diar.mel.hop_length");
        assert_rejects(|h| h.sample_rate = 0, "nemotron3_diar.mel.sample_rate");
    }

    #[test]
    fn zero_speakers_cannot_reach_the_cache_division() {
        // The regression #253 found: `cache_length >= (1 + silence) * speakers`
        // is trivially true at zero, and `SpeakerCache::offline` then divides by it.
        assert_rejects(|h| h.num_speakers = 0, "nemotron3_diar.head.num_speakers");
    }

    #[test]
    fn geometry_cross_checks_are_enforced() {
        assert_rejects(|h| h.num_heads = 7, "nemotron3_diar.audio.num_heads");
        assert_rejects(
            |h| h.chunk_right_context = h.chunk_length,
            "nemotron3_diar.offline.chunk_right_context",
        );
        assert_rejects(|h| h.win_length = 1, "nemotron3_diar.mel.win_length");
        assert_rejects(|h| h.win_length = h.n_fft + 1, "nemotron3_diar.mel.win_length");
        assert_rejects(|h| h.cache_length = 31, "nemotron3_diar.cache.length");
        assert_rejects(|h| h.cache_silence_frames = usize::MAX, "nemotron3_diar.cache.length");
    }

    #[test]
    fn non_finite_floats_are_rejected() {
        assert_rejects(|h| h.rope_theta = f32::INFINITY, "nemotron3_diar.audio.rope_theta");
        assert_rejects(
            |h| h.prediction_score_threshold = f32::NAN,
            "nemotron3_diar.cache.prediction_score_threshold",
        );
    }
}
