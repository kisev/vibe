//! Getting a GigaAM GGUF off disk and into a [`Model`]: reading the metadata
//! keys, checking the tensor catalog, dequantizing the small decoder head,
//! and uploading the encoder weights to a GPU backend when one is available.

use std::ffi::{CStr, CString};
use std::path::Path;
use std::ptr;
use std::time::Instant;

use crate::decoder::{CtcHead, HeadWeights, RnntHead};
use crate::mel::{MelConfig, MelFrontend};
use crate::model::{DeviceWeights, Model, ModelInfo, MAX_INPUT_SECONDS};
use crate::runtime::{accelerated_runtime, Graph};
use crate::{sys, Error, Result, Tokenizer};

impl Model {
    /// Reads model metadata without allocating or uploading tensor data.
    pub fn metadata(path: impl AsRef<Path>) -> Result<ModelInfo> {
        let path = CString::new(path.as_ref().to_string_lossy().as_bytes()).map_err(|_| Error::InvalidPath)?;
        let mut weights = ptr::null_mut();
        let gguf = unsafe {
            sys::gguf_init_from_file(
                path.as_ptr(),
                sys::gguf_init_params {
                    no_alloc: true,
                    ctx: &mut weights,
                },
            )
        };
        if gguf.is_null() {
            return Err(Error::Load(path.to_string_lossy().into_owned()));
        }
        let result = unsafe { read_info(gguf) };
        unsafe {
            if !weights.is_null() {
                sys::ggml_free(weights);
            }
            sys::gguf_free(gguf);
        }
        result
    }

    pub fn load(path: impl AsRef<Path>) -> Result<Self> {
        let started = Instant::now();
        eprintln!("[gigaam][load] begin path={}", path.as_ref().display());
        let path_buf = path.as_ref().to_path_buf();
        let path = CString::new(path.as_ref().to_string_lossy().as_bytes()).map_err(|_| Error::InvalidPath)?;
        // `gguf_init_from_file` sizes its own context from the tensor table and
        // aborts the process when that estimate is a few bytes short, which some
        // published GigaAM files are. Read the tensor metadata only and copy the
        // data into a context this crate sizes itself.
        let mut staged = ptr::null_mut();
        let gguf = unsafe {
            sys::gguf_init_from_file(
                path.as_ptr(),
                sys::gguf_init_params {
                    no_alloc: true,
                    ctx: &mut staged,
                },
            )
        };
        if gguf.is_null() {
            return Err(Error::Load(path.to_string_lossy().into_owned()));
        }
        let weights = match unsafe { copy_tensors(gguf, staged, &path_buf) } {
            Ok(weights) => weights,
            Err(error) => {
                unsafe {
                    if !staged.is_null() {
                        sys::ggml_free(staged);
                    }
                    sys::gguf_free(gguf);
                }
                return Err(error);
            }
        };
        unsafe { sys::ggml_free(staged) };

        let loaded = unsafe { read_info(gguf).and_then(|info| Tokenizer::load(gguf).map(|tokenizer| (info, tokenizer))) };
        let (info, tokenizer) = match loaded {
            Ok(loaded) => loaded,
            Err(error) => {
                unsafe {
                    sys::ggml_free(weights);
                    sys::gguf_free(gguf);
                }
                return Err(error);
            }
        };
        if info.architecture != "gigaam" {
            unsafe {
                sys::ggml_free(weights);
                sys::gguf_free(gguf);
            }
            return Err(Error::UnsupportedArchitecture(info.architecture));
        }

        let mel = match build_mel(&info, weights) {
            Ok(mel) => mel,
            Err(error) => {
                unsafe {
                    sys::ggml_free(weights);
                    sys::gguf_free(gguf);
                }
                return Err(error);
            }
        };
        let mut model = Self {
            gguf,
            weights,
            info,
            tokenizer,
            head: HeadWeights::Ctc(CtcHead {
                weight: Vec::new(),
                bias: Vec::new(),
                classes: 0,
                blank: 0,
            }),
            mel,
            device: None,
        };
        model.validate_tensor_catalog()?;
        model.head = model.load_head()?;
        model.device = unsafe { DeviceWeights::load(model.weights)? };
        eprintln!(
            "[gigaam][load] done elapsed_ms={} variant={} head={} tensors={} backend={}",
            started.elapsed().as_millis(),
            model.info.variant,
            model.info.head_kind,
            model.info.tensor_count,
            if model.device.is_some() { "gpu" } else { "cpu" }
        );
        Ok(model)
    }

    pub(crate) fn require(&self, name: impl AsRef<str>) -> Result<()> {
        let name = name.as_ref();
        self.cpu_tensor(name)
            .map(|_| ())
            .ok_or_else(|| Error::MissingTensor(name.to_owned()))
    }

    fn validate_tensor_catalog(&self) -> Result<()> {
        for name in [
            "frontend.mel_filterbank",
            "frontend.window",
            "enc.pre_encode.conv.0.weight",
            "enc.pre_encode.conv.0.bias",
            "enc.pre_encode.conv.2.weight",
            "enc.pre_encode.conv.2.bias",
        ] {
            self.require(name)?;
        }
        for layer in 0..self.info.encoder_layers {
            for suffix in [
                "norm_ff1.weight",
                "norm_ff1.bias",
                "ff1.linear1.weight",
                "ff1.linear1.bias",
                "ff1.linear2.weight",
                "ff1.linear2.bias",
                "norm_conv.weight",
                "norm_conv.bias",
                "conv.pointwise1.weight",
                "conv.pointwise1.bias",
                "conv.depthwise.weight",
                "conv.depthwise.bias",
                "conv.ln.weight",
                "conv.ln.bias",
                "conv.pointwise2.weight",
                "conv.pointwise2.bias",
                "norm_attn.weight",
                "norm_attn.bias",
                "attn.linear_q.weight",
                "attn.linear_q.bias",
                "attn.linear_k.weight",
                "attn.linear_k.bias",
                "attn.linear_v.weight",
                "attn.linear_v.bias",
                "attn.linear_out.weight",
                "attn.linear_out.bias",
                "norm_ff2.weight",
                "norm_ff2.bias",
                "ff2.linear1.weight",
                "ff2.linear1.bias",
                "ff2.linear2.weight",
                "ff2.linear2.bias",
                "norm_out.weight",
                "norm_out.bias",
            ] {
                self.require(format!("enc.blocks.{layer}.{suffix}"))?;
            }
        }
        match self.info.head_kind.as_str() {
            "rnnt" => {
                for name in [
                    "pred.embed.weight",
                    "pred.lstm.0.Wx",
                    "pred.lstm.0.Wh",
                    "pred.lstm.0.bias",
                    "joint.enc.weight",
                    "joint.enc.bias",
                    "joint.pred.weight",
                    "joint.pred.bias",
                    "joint.out.weight",
                    "joint.out.bias",
                ] {
                    self.require(name)?;
                }
            }
            "ctc" => {
                self.require("head.ctc.weight")?;
                self.require("head.ctc.bias")?;
            }
            other => return Err(Error::UnsupportedHead(other.to_owned())),
        }
        Ok(())
    }

    fn load_head(&self) -> Result<HeadWeights> {
        let rows = |name: &str| -> Result<Vec<f32>> {
            let tensor = self.cpu_tensor(name).ok_or_else(|| Error::MissingTensor(name.to_owned()))?;
            unsafe { rows_f32(tensor) }
        };
        match self.info.head_kind.as_str() {
            "rnnt" => {
                let hidden = self.info.predictor_hidden as usize;
                let joint = self.info.joint_hidden as usize;
                let classes = self.info.classes as usize;
                let head = RnntHead {
                    embed: rows("pred.embed.weight")?,
                    hidden,
                    wx: rows("pred.lstm.0.Wx")?,
                    wh: rows("pred.lstm.0.Wh")?,
                    bias: rows("pred.lstm.0.bias")?,
                    enc_w: rows("joint.enc.weight")?,
                    enc_b: rows("joint.enc.bias")?,
                    pred_w: rows("joint.pred.weight")?,
                    pred_b: rows("joint.pred.bias")?,
                    out_w: rows("joint.out.weight")?,
                    out_b: rows("joint.out.bias")?,
                    joint_hidden: joint,
                    classes,
                    blank: self.tokenizer.blank_id(),
                    max_symbols: 10,
                };
                let expected = (classes * hidden, joint * hidden, joint * classes);
                if head.wx.len() != 4 * hidden * hidden
                    || head.wh.len() != 4 * hidden * hidden
                    || head.embed.len() != expected.0
                    || head.pred_w.len() != expected.1
                    || head.out_w.len() != expected.2
                {
                    return Err(Error::InvalidMetadata {
                        key: "stt.gigaam.predictor",
                        message: "predictor or joint tensor shapes do not match the metadata".into(),
                    });
                }
                Ok(HeadWeights::Rnnt(Box::new(head)))
            }
            "ctc" => {
                let dimension = self.info.encoder_dimension;
                let classes = self.info.classes as usize;
                let weight = self
                    .cpu_tensor("head.ctc.weight")
                    .ok_or(Error::MissingTensor("head.ctc.weight".into()))?;
                let matrix = unsafe { sys::ggml_reshape_2d(self.weights, weight, dimension as i64, classes as i64) };
                let weight = unsafe { rows_f32(matrix)? };
                if weight.len() != classes * dimension as usize {
                    return Err(Error::InvalidMetadata {
                        key: "stt.gigaam.head",
                        message: "CTC head shape does not match the metadata".into(),
                    });
                }
                Ok(HeadWeights::Ctc(CtcHead {
                    weight,
                    bias: rows("head.ctc.bias")?,
                    classes,
                    blank: self.tokenizer.blank_id(),
                }))
            }
            other => Err(Error::UnsupportedHead(other.to_owned())),
        }
    }
}

/// Copies every tensor out of the metadata-only GGUF context into a context
/// sized from the real tensor table. The GGUF reader's own sizing assumes the
/// tensor data fits in exactly `data_size` bytes, and a published GigaAM file
/// misses that estimate by a few hundred bytes — `ggml_new_object` aborts the
/// process instead of returning an error, so the crate cannot rely on it.
unsafe fn copy_tensors(
    gguf: *const sys::gguf_context,
    staged: *mut sys::ggml_context,
    path: &Path,
) -> Result<*mut sys::ggml_context> {
    let count = sys::gguf_get_n_tensors(gguf) as usize;
    let mut data_size = 0usize;
    let mut tensor = sys::ggml_get_first_tensor(staged);
    while !tensor.is_null() {
        data_size += sys::ggml_nbytes(tensor) + 64;
        tensor = sys::ggml_get_next_tensor(staged, tensor);
    }
    // One arena holds the tensor headers and every weight block.
    let mem_size = data_size + (count + 8) * (sys::ggml_tensor_overhead() + 64) + 128 * 1024;
    let ctx = sys::ggml_init(sys::ggml_init_params {
        mem_size,
        mem_buffer: ptr::null_mut(),
        no_alloc: false,
    });
    if ctx.is_null() {
        return Err(Error::Ggml("weight context"));
    }
    let file = match std::fs::read(path) {
        Ok(file) => file,
        Err(error) => {
            sys::ggml_free(ctx);
            return Err(Error::Load(error.to_string()));
        }
    };
    let base = sys::gguf_get_data_offset(gguf);
    let mut index = 0i64;
    let mut source = sys::ggml_get_first_tensor(staged);
    while !source.is_null() {
        let copy = sys::ggml_dup_tensor(ctx, source);
        sys::ggml_set_name(copy, sys::ggml_get_name(source));
        let offset = base + sys::gguf_get_tensor_offset(gguf, index);
        let size = sys::ggml_nbytes(source);
        if offset + size > file.len() {
            sys::ggml_free(ctx);
            return Err(Error::Load(format!("tensor data ends past the file at offset {offset}")));
        }
        std::ptr::copy_nonoverlapping(file.as_ptr().add(offset), (*copy).data.cast::<u8>(), size);
        index += 1;
        source = sys::ggml_get_next_tensor(staged, source);
    }
    Ok(ctx)
}

fn build_mel(info: &ModelInfo, weights: *mut sys::ggml_context) -> Result<MelFrontend> {
    if info.frontend.center {
        return Err(Error::InvalidMetadata {
            key: "stt.frontend.center",
            message: "centered frames are not supported".into(),
        });
    }
    let window = lookup_tensor(weights, "frontend.window").ok_or(Error::MissingTensor("frontend.window".into()))?;
    let filterbank =
        lookup_tensor(weights, "frontend.mel_filterbank").ok_or(Error::MissingTensor("frontend.mel_filterbank".into()))?;
    let window = unsafe { rows_f32(window)? };
    let filterbank = unsafe { rows_f32(filterbank)? };
    MelFrontend::new(info.frontend.clone(), window, filterbank)
}

/// Reads a tensor as `f32` rows. Plain `F32`/`F16` data is converted directly;
/// quantized tensors are dequantized by the backend through `get_rows`, which
/// supports every type the GGUF writer emits.
unsafe fn rows_f32(tensor: *mut sys::ggml_tensor) -> Result<Vec<f32>> {
    let rows = (*tensor).ne[1] as usize;
    if (*tensor).type_ == sys::ggml_type_GGML_TYPE_F32 {
        let count = sys::ggml_nelements(tensor) as usize;
        let data = (*tensor).data.cast::<f32>();
        if !data.is_null() {
            return Ok(std::slice::from_raw_parts(data, count).to_vec());
        }
    }
    if (*tensor).type_ == sys::ggml_type_GGML_TYPE_F16 {
        let count = sys::ggml_nelements(tensor) as usize;
        let data = (*tensor).data.cast::<u16>();
        if !data.is_null() {
            return Ok(std::slice::from_raw_parts(data, count)
                .iter()
                .map(|value| half_to_f32(*value))
                .collect());
        }
    }

    let runtime = accelerated_runtime(None)?;
    let mut graph = Graph::with_capacity(16 * 1024 * 1024)?;
    let indices = sys::ggml_new_tensor_1d(graph.ctx, sys::ggml_type_GGML_TYPE_I32, rows as i64);
    let matrix = if (*tensor).ne[2] == 1 && (*tensor).ne[3] == 1 {
        tensor
    } else {
        sys::ggml_reshape_2d(graph.ctx, tensor, (*tensor).ne[0], rows as i64)
    };
    let output = sys::ggml_get_rows(graph.ctx, matrix, indices);
    graph.output(output);
    let values = (0..rows as i32).collect::<Vec<_>>();
    let bytes = std::slice::from_raw_parts(values.as_ptr().cast::<u8>(), std::mem::size_of_val(values.as_slice()));
    runtime.execute_bytes(&mut graph, &[(indices, bytes)])?;
    let count = sys::ggml_nelements(output) as usize;
    let mut data = vec![0.0f32; count];
    sys::ggml_backend_tensor_get(output, data.as_mut_ptr().cast(), 0, count * 4);
    Ok(data)
}

fn half_to_f32(bits: u16) -> f32 {
    let sign = (bits >> 15) & 1;
    let exponent = (bits >> 10) & 0x1f;
    let mantissa = bits & 0x3ff;
    let value = if exponent == 0 {
        (mantissa as f32) * 2.0f32.powi(-24)
    } else if exponent == 0x1f {
        if mantissa == 0 {
            f32::INFINITY
        } else {
            f32::NAN
        }
    } else {
        (1.0 + mantissa as f32 / 1024.0) * 2.0f32.powi(exponent as i32 - 15)
    };
    if sign == 1 {
        -value
    } else {
        value
    }
}

impl DeviceWeights {
    pub(crate) unsafe fn load(source: *mut sys::ggml_context) -> Result<Option<Self>> {
        if std::env::var_os("GIGAAM_CPU").is_some() {
            return Ok(None);
        }
        sys::ggml_backend_load_all();
        let mut backend = sys::ggml_backend_init_by_type(sys::ggml_backend_dev_type_GGML_BACKEND_DEVICE_TYPE_GPU, ptr::null());
        if backend.is_null() {
            backend = sys::ggml_backend_init_by_type(sys::ggml_backend_dev_type_GGML_BACKEND_DEVICE_TYPE_IGPU, ptr::null());
        }
        if backend.is_null() {
            return Ok(None);
        }
        let mut count = 0usize;
        let mut tensor = sys::ggml_get_first_tensor(source);
        while !tensor.is_null() {
            count += 1;
            tensor = sys::ggml_get_next_tensor(source, tensor);
        }
        eprintln!("[gigaam][load] uploading_tensors={} backend=gpu", count);
        let ctx = sys::ggml_init(sys::ggml_init_params {
            mem_size: sys::ggml_tensor_overhead() * (count + 32),
            mem_buffer: ptr::null_mut(),
            no_alloc: true,
        });
        if ctx.is_null() {
            sys::ggml_backend_free(backend);
            return Err(Error::Ggml("device weight context"));
        }
        tensor = sys::ggml_get_first_tensor(source);
        while !tensor.is_null() {
            let copy = sys::ggml_dup_tensor(ctx, tensor);
            sys::ggml_set_name(copy, sys::ggml_get_name(tensor));
            tensor = sys::ggml_get_next_tensor(source, tensor);
        }
        let buffer = sys::ggml_backend_alloc_ctx_tensors(ctx, backend);
        if buffer.is_null() {
            sys::ggml_free(ctx);
            sys::ggml_backend_free(backend);
            return Err(Error::Ggml("device weight buffer"));
        }
        let mut src = sys::ggml_get_first_tensor(source);
        while !src.is_null() {
            let dst = sys::ggml_get_tensor(ctx, sys::ggml_get_name(src));
            if dst.is_null() {
                sys::ggml_backend_buffer_free(buffer);
                sys::ggml_free(ctx);
                sys::ggml_backend_free(backend);
                return Err(Error::Ggml("device weight lookup"));
            }
            sys::ggml_backend_tensor_set(dst, (*src).data, 0, sys::ggml_nbytes(src));
            src = sys::ggml_get_next_tensor(source, src);
        }
        eprintln!("[gigaam][load] upload_complete tensors={}", count);
        Ok(Some(Self { ctx, buffer, backend }))
    }
}

pub(crate) fn lookup_tensor(ctx: *mut sys::ggml_context, name: &str) -> Option<*mut sys::ggml_tensor> {
    let candidate = CString::new(name).ok()?;
    let tensor = unsafe { sys::ggml_get_tensor(ctx, candidate.as_ptr()) };
    (!tensor.is_null()).then_some(tensor)
}

unsafe fn read_info(ctx: *const sys::gguf_context) -> Result<ModelInfo> {
    let head_kind = string(ctx, "stt.gigaam.head_kind")?;
    if head_kind != "rnnt" && head_kind != "ctc" {
        return Err(Error::UnsupportedHead(head_kind));
    }
    let attention = string(ctx, "stt.gigaam.encoder.self_attention_model")?;
    if attention != "rotary" {
        return Err(Error::UnsupportedHead(format!("attention {attention}")));
    }
    let frontend = MelConfig {
        sample_rate: u32_value(ctx, "stt.frontend.sample_rate")? as usize,
        num_mels: u32_value(ctx, "stt.frontend.num_mels")? as usize,
        n_fft: u32_value(ctx, "stt.frontend.n_fft")? as usize,
        win_length: u32_value(ctx, "stt.frontend.win_length")? as usize,
        hop_length: u32_value(ctx, "stt.frontend.hop_length")? as usize,
        center: optional_bool(ctx, "stt.frontend.center").unwrap_or(true),
        log_clamp_min: f32_value(ctx, "stt.frontend.log_clamp_min")?,
        log_clamp_max: f32_value(ctx, "stt.frontend.log_clamp_max")?,
    };
    let (predictor_hidden, predictor_layers, joint_hidden, classes) = match head_kind.as_str() {
        "rnnt" => (
            u32_value(ctx, "stt.gigaam.predictor.hidden")? as i32,
            u32_value(ctx, "stt.gigaam.predictor.n_layers")? as i32,
            u32_value(ctx, "stt.gigaam.joint.hidden")? as i32,
            u32_value(ctx, "stt.gigaam.joint.num_classes")? as i32,
        ),
        _ => (0, 0, 0, u32_value(ctx, "stt.gigaam.head.num_classes")? as i32),
    };
    Ok(ModelInfo {
        architecture: string(ctx, "general.architecture")?,
        variant: string(ctx, "stt.variant")?,
        head_kind,
        languages: strings(ctx, "general.languages")?,
        language_detection: false,
        tensor_count: sys::gguf_get_n_tensors(ctx) as usize,
        encoder_layers: u32_value(ctx, "stt.gigaam.encoder.n_layers")? as i32,
        encoder_dimension: u32_value(ctx, "stt.gigaam.encoder.d_model")? as i32,
        encoder_heads: u32_value(ctx, "stt.gigaam.encoder.n_heads")? as i32,
        encoder_d_ff: u32_value(ctx, "stt.gigaam.encoder.d_ff")? as i32,
        encoder_conv_kernel: u32_value(ctx, "stt.gigaam.encoder.conv_kernel")? as i32,
        subsampling_factor: u32_value(ctx, "stt.gigaam.encoder.subsampling_factor")? as i32,
        subs_kernel_size: u32_value(ctx, "stt.gigaam.encoder.subs_kernel_size")? as i32,
        pos_emb_base: u32_value(ctx, "stt.gigaam.encoder.pos_emb_max_len")? as i32,
        frontend,
        predictor_hidden,
        predictor_layers,
        joint_hidden,
        classes,
        max_input_seconds: MAX_INPUT_SECONDS,
    })
}

unsafe fn key(ctx: *const sys::gguf_context, name: &'static str) -> Result<i64> {
    let c_name = CString::new(name).unwrap();
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

unsafe fn strings(ctx: *const sys::gguf_context, name: &'static str) -> Result<Vec<String>> {
    let id = key(ctx, name)?;
    let count = sys::gguf_get_arr_n(ctx, id);
    (0..count)
        .map(|index| {
            let value = sys::gguf_get_arr_str(ctx, id, index);
            if value.is_null() {
                Err(Error::InvalidMetadata {
                    key: name,
                    message: format!("null string at {index}"),
                })
            } else {
                Ok(CStr::from_ptr(value).to_string_lossy().into_owned())
            }
        })
        .collect()
}

unsafe fn u32_value(ctx: *const sys::gguf_context, name: &'static str) -> Result<u32> {
    Ok(sys::gguf_get_val_u32(ctx, key(ctx, name)?))
}

unsafe fn f32_value(ctx: *const sys::gguf_context, name: &'static str) -> Result<f32> {
    Ok(sys::gguf_get_val_f32(ctx, key(ctx, name)?))
}

unsafe fn optional_bool(ctx: *const sys::gguf_context, name: &'static str) -> Option<bool> {
    let c_name = CString::new(name).unwrap();
    let id = sys::gguf_find_key(ctx, c_name.as_ptr());
    (id >= 0).then(|| sys::gguf_get_val_bool(ctx, id))
}
