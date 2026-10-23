use anyhow::{bail, Context as _};
use serde::Serialize;
use whisper_rs::{ContextOptions, Segment, StreamCallbacks, TranscribeOptions, TranscribeResult};

/// One VAD instance per model path and option set. GigaAM caps chunks below
/// its 25-second window while the other engines keep the 30-second default.
pub struct VadCache {
    path: String,
    options: vad_rs::Options,
    vad: vad_rs::Vad,
}

#[derive(Debug, Clone, Serialize, utoipa::ToSchema)]
pub struct EngineCapabilities {
    pub engine: String,
    pub requires_vad: bool,
    pub languages: Vec<String>,
    pub language_detection: bool,
    pub streaming: bool,
    pub translation: bool,
    pub timestamps: bool,
    pub text_prompts: bool,
    /// Longest audio the engine may receive, when it accepts externally
    /// chunked input. Absent means the engine owns its own long-form path.
    pub max_input_seconds: Option<f64>,
}

// One engine lives at a time, so the size gap between variants costs nothing.
#[allow(clippy::large_enum_variant)]
pub enum Engine {
    Whisper(whisper_rs::Context),
    Nemotron {
        model: Box<nemotron_rs::Model>,
        vad: Option<VadCache>,
    },
    Parakeet {
        model: Box<parakeet_rs::Model>,
        vad: Option<VadCache>,
    },
    Gigaam {
        model: Box<gigaam_rs::Model>,
        vad: Option<VadCache>,
    },
}

impl Engine {
    pub fn requires_vad(&self) -> bool {
        matches!(self, Self::Nemotron { .. } | Self::Parakeet { .. } | Self::Gigaam { .. })
    }

    pub fn load(path: &str, options: ContextOptions) -> anyhow::Result<Self> {
        let capabilities = detect_model(path)?;
        match capabilities.engine.as_str() {
            "whisper" => Ok(Self::Whisper(whisper_rs::Context::new(path, options)?)),
            "gigaam" => Ok(Self::Gigaam {
                model: Box::new(gigaam_rs::Model::load(path).context("GigaAM model failed to load")?),
                vad: None,
            }),
            "parakeet" => Ok(Self::Parakeet {
                model: Box::new(parakeet_rs::Model::load(path).context("Parakeet model failed to load")?),
                vad: None,
            }),
            _ => Ok(Self::Nemotron {
                model: Box::new(nemotron_rs::Model::load(path).context("Nemotron model failed to load")?),
                vad: None,
            }),
        }
    }

    pub fn transcribe(&mut self, samples: &[f32], options: TranscribeOptions) -> anyhow::Result<TranscribeResult> {
        match self {
            Self::Whisper(context) => context.transcribe(samples, options).map_err(Into::into),
            Self::Nemotron { model, vad } => {
                if options.translate {
                    bail!("Nemotron does not support translation");
                }
                if options.prompt.is_some() {
                    bail!("Nemotron does not support text prompts");
                }
                let language = if options.detect_language {
                    "auto"
                } else {
                    options.language.as_deref().unwrap_or("en-US")
                };
                let vad = engine_vad(vad, options.vad_model_path.as_deref(), vad_rs::Options::default(), "Nemotron")?;
                let result = model
                    .transcribe(vad, samples, language)
                    .context("Nemotron inference failed")?;
                Ok(TranscribeResult {
                    segments: result
                        .segments
                        .into_iter()
                        .filter(|segment| !segment.text.is_empty())
                        .map(|segment| Segment {
                            start: segment.tokens.first().map_or(0, |token| token.frame as i64 * 8),
                            end: segment.tokens.last().map_or(0, |token| (token.frame as i64 + 1) * 8),
                            text: segment.text,
                            no_speech_prob: 0.0,
                        })
                        .collect(),
                })
            }
            Self::Parakeet { model, vad } => {
                validate_parakeet_options(&options)?;
                let language = if options.detect_language {
                    "auto"
                } else {
                    options.language.as_deref().unwrap_or("en")
                };
                let vad = engine_vad(vad, options.vad_model_path.as_deref(), vad_rs::Options::default(), "Parakeet")?;
                let result = model
                    .transcribe(vad, samples, language)
                    .context("Parakeet inference failed")?;
                Ok(TranscribeResult {
                    segments: result.segments.iter().filter_map(parakeet_segment).collect(),
                })
            }
            Self::Gigaam { model, vad } => {
                validate_gigaam_options(&options)?;
                let language = if options.detect_language {
                    "auto"
                } else {
                    options.language.as_deref().unwrap_or("ru")
                };
                let vad = engine_vad(vad, options.vad_model_path.as_deref(), gigaam_vad_options(), "GigaAM")?;
                let result = model.transcribe(vad, samples, language).context("GigaAM inference failed")?;
                Ok(TranscribeResult {
                    segments: result.segments.iter().filter_map(gigaam_segment).collect(),
                })
            }
        }
    }

    /// Longest input the engine accepts from an external plan.
    pub fn max_input_seconds(&self) -> Option<f64> {
        self.capabilities().max_input_seconds
    }

    /// Speech ranges in seconds, from the engine's cached VAD. The planner uses
    /// them as the pauses it may cut in.
    pub fn speech_ranges(&mut self, samples: &[f32], vad_model_path: Option<&str>) -> anyhow::Result<Vec<(f64, f64)>> {
        let (vad, label, options) = match self {
            Self::Whisper(_) => bail!("whisper keeps its own long-form path"),
            Self::Nemotron { vad, .. } => (vad, "Nemotron", vad_rs::Options::default()),
            Self::Parakeet { vad, .. } => (vad, "Parakeet", vad_rs::Options::default()),
            Self::Gigaam { vad, .. } => (vad, "GigaAM", gigaam_vad_options()),
        };
        let vad = engine_vad(vad, vad_model_path, options, label)?;
        let ranges = vad.segments(samples).context("VAD segmentation failed")?;
        Ok(ranges
            .into_iter()
            .map(|range| {
                (
                    range.start_sample as f64 / crate::plan::SAMPLE_RATE,
                    range.end_sample as f64 / crate::plan::SAMPLE_RATE,
                )
            })
            .collect())
    }

    /// Transcribe the plan's chunks. Every input is exactly the audio the plan
    /// chose, so a chunk that belongs to one speaker is never widened by the
    /// engine's own VAD pass.
    ///
    /// Whisper is refused: its output depends on its internal segmentation and
    /// prompt context, so it keeps its own long-form path.
    pub fn transcribe_chunks(
        &mut self,
        samples: &[f32],
        plan: &crate::plan::Plan,
        options: TranscribeOptions,
    ) -> anyhow::Result<TranscribeResult> {
        let ranges = chunk_ranges(plan, samples.len());
        let callbacks = StreamCallbacks::default();
        self.transcribe_chunks_with(samples, &ranges, options, callbacks)
    }

    pub(crate) fn transcribe_chunks_with(
        &mut self,
        samples: &[f32],
        ranges: &[(usize, usize)],
        options: TranscribeOptions,
        callbacks: StreamCallbacks<'_>,
    ) -> anyhow::Result<TranscribeResult> {
        let StreamCallbacks {
            mut on_progress,
            mut on_segment,
            mut should_abort,
        } = callbacks;
        match self {
            Self::Whisper(_) => bail!("whisper does not accept an external chunk plan"),
            Self::Nemotron { model, .. } => {
                if options.translate {
                    bail!("Nemotron does not support translation");
                }
                if options.prompt.is_some() {
                    bail!("Nemotron does not support text prompts");
                }
                let language = chunk_language(&options, "en-US");
                let result = model.transcribe_ranges(
                    samples,
                    ranges,
                    &language,
                    || should_abort.as_mut().is_some_and(|callback| callback()),
                    |transcription| {
                        if let Some(callback) = on_segment.as_mut() {
                            if let Some(segment) = nemotron_segment(transcription) {
                                callback(segment);
                            }
                        }
                    },
                    |progress| {
                        if let Some(callback) = on_progress.as_mut() {
                            callback(progress);
                        }
                    },
                )?;
                Ok(TranscribeResult {
                    segments: result.segments.iter().filter_map(nemotron_segment).collect(),
                })
            }
            Self::Parakeet { model, .. } => {
                validate_parakeet_options(&options)?;
                let language = chunk_language(&options, "en");
                let result = model.transcribe_ranges(
                    samples,
                    ranges,
                    &language,
                    || should_abort.as_mut().is_some_and(|callback| callback()),
                    |transcription| {
                        if let Some(callback) = on_segment.as_mut() {
                            if let Some(segment) = parakeet_segment(transcription) {
                                callback(segment);
                            }
                        }
                    },
                    |progress| {
                        if let Some(callback) = on_progress.as_mut() {
                            callback(progress);
                        }
                    },
                )?;
                Ok(TranscribeResult {
                    segments: result.segments.iter().filter_map(parakeet_segment).collect(),
                })
            }
            Self::Gigaam { model, .. } => {
                validate_gigaam_options(&options)?;
                let language = chunk_language(&options, "ru");
                let result = model.transcribe_ranges(
                    samples,
                    ranges,
                    &language,
                    || should_abort.as_mut().is_some_and(|callback| callback()),
                    |transcription| {
                        if let Some(callback) = on_segment.as_mut() {
                            if let Some(segment) = gigaam_segment(transcription) {
                                callback(segment);
                            }
                        }
                    },
                    |progress| {
                        if let Some(callback) = on_progress.as_mut() {
                            callback(progress);
                        }
                    },
                )?;
                Ok(TranscribeResult {
                    segments: result.segments.iter().filter_map(gigaam_segment).collect(),
                })
            }
        }
    }

    pub fn transcribe_stream(
        &mut self,
        samples: &[f32],
        options: TranscribeOptions,
        callbacks: StreamCallbacks<'_>,
    ) -> anyhow::Result<TranscribeResult> {
        match self {
            Self::Whisper(context) => context.transcribe_stream(samples, options, callbacks).map_err(Into::into),
            Self::Nemotron { model, vad } => {
                if options.translate {
                    bail!("Nemotron does not support translation");
                }
                if options.prompt.is_some() {
                    bail!("Nemotron does not support text prompts");
                }
                let language = if options.detect_language {
                    "auto"
                } else {
                    options.language.as_deref().unwrap_or("en-US")
                };
                let vad = engine_vad(vad, options.vad_model_path.as_deref(), vad_rs::Options::default(), "Nemotron")?;
                let StreamCallbacks {
                    mut on_progress,
                    mut on_segment,
                    mut should_abort,
                } = callbacks;
                let result = model.transcribe_with(
                    vad,
                    samples,
                    language,
                    || should_abort.as_mut().is_some_and(|callback| callback()),
                    |transcription| {
                        if let Some(callback) = on_segment.as_mut() {
                            if let Some(segment) = nemotron_segment(transcription) {
                                callback(segment);
                            }
                        }
                    },
                    |progress| {
                        if let Some(callback) = on_progress.as_mut() {
                            callback(progress);
                        }
                    },
                )?;
                Ok(TranscribeResult {
                    segments: result.segments.iter().filter_map(nemotron_segment).collect(),
                })
            }
            Self::Parakeet { model, vad } => {
                validate_parakeet_options(&options)?;
                let language = if options.detect_language {
                    "auto"
                } else {
                    options.language.as_deref().unwrap_or("en")
                };
                let vad = engine_vad(vad, options.vad_model_path.as_deref(), vad_rs::Options::default(), "Parakeet")?;
                let StreamCallbacks {
                    mut on_progress,
                    mut on_segment,
                    mut should_abort,
                } = callbacks;
                let result = model
                    .transcribe_with(
                        vad,
                        samples,
                        language,
                        || should_abort.as_mut().is_some_and(|callback| callback()),
                        |transcription| {
                            if let (Some(callback), Some(segment)) = (on_segment.as_mut(), parakeet_segment(transcription)) {
                                callback(segment);
                            }
                        },
                        |progress| {
                            if let Some(callback) = on_progress.as_mut() {
                                callback(progress);
                            }
                        },
                    )
                    .context("Parakeet inference failed")?;
                Ok(TranscribeResult {
                    segments: result.segments.iter().filter_map(parakeet_segment).collect(),
                })
            }
            Self::Gigaam { model, vad } => {
                validate_gigaam_options(&options)?;
                let language = if options.detect_language {
                    "auto"
                } else {
                    options.language.as_deref().unwrap_or("ru")
                };
                let vad = engine_vad(vad, options.vad_model_path.as_deref(), gigaam_vad_options(), "GigaAM")?;
                let StreamCallbacks {
                    mut on_progress,
                    mut on_segment,
                    mut should_abort,
                } = callbacks;
                let result = model
                    .transcribe_with(
                        vad,
                        samples,
                        language,
                        || should_abort.as_mut().is_some_and(|callback| callback()),
                        |transcription| {
                            if let (Some(callback), Some(segment)) = (on_segment.as_mut(), gigaam_segment(transcription)) {
                                callback(segment);
                            }
                        },
                        |progress| {
                            if let Some(callback) = on_progress.as_mut() {
                                callback(progress);
                            }
                        },
                    )
                    .context("GigaAM inference failed")?;
                Ok(TranscribeResult {
                    segments: result.segments.iter().filter_map(gigaam_segment).collect(),
                })
            }
        }
    }

    /// Rejects options the loaded engine cannot honor before any audio is
    /// decoded, so CLI and streaming requests fail with a specific reason.
    pub fn validate_request(&self, options: &TranscribeOptions) -> anyhow::Result<()> {
        match self {
            Self::Whisper(_) => Ok(()),
            Self::Gigaam { .. } => {
                validate_gigaam_options(options)?;
                let language = if options.detect_language {
                    "auto"
                } else {
                    options.language.as_deref().unwrap_or("ru")
                };
                if !language.is_empty() && language != "auto" && language != "ru" {
                    return Err(gigaam_rs::Error::UnsupportedLanguage(language.to_owned()).into());
                }
                Ok(())
            }
            Self::Parakeet { .. } => validate_parakeet_options(options),
            Self::Nemotron { .. } => {
                if options.translate {
                    bail!("Nemotron does not support translation");
                }
                if options.prompt.is_some() {
                    bail!("Nemotron does not support text prompts");
                }
                Ok(())
            }
        }
    }

    pub fn capabilities(&self) -> EngineCapabilities {
        match self {
            Self::Whisper(_) => whisper_capabilities(),
            Self::Nemotron { model, .. } => {
                nemotron_capabilities(model.info().languages.clone(), model.info().language_detection)
            }
            Self::Parakeet { model, .. } => {
                parakeet_capabilities(model.info().languages.clone(), model.info().language_detection)
            }
            Self::Gigaam { model, .. } => gigaam_capabilities(model.info()),
        }
    }
}

pub fn nemotron_capabilities(languages: Vec<String>, language_detection: bool) -> EngineCapabilities {
    EngineCapabilities {
        engine: "nemotron".to_string(),
        requires_vad: true,
        languages,
        language_detection,
        streaming: false,
        translation: false,
        timestamps: true,
        text_prompts: false,
        max_input_seconds: Some(30.0),
    }
}

pub fn parakeet_capabilities(languages: Vec<String>, language_detection: bool) -> EngineCapabilities {
    EngineCapabilities {
        engine: "parakeet".to_string(),
        requires_vad: true,
        languages,
        language_detection,
        streaming: false,
        translation: false,
        timestamps: true,
        text_prompts: false,
        max_input_seconds: Some(30.0),
    }
}

/// Sample ranges the plan sends to the model, clipped to the decoded audio.
pub fn chunk_ranges(plan: &crate::plan::Plan, sample_count: usize) -> Vec<(usize, usize)> {
    plan.chunks
        .iter()
        .filter_map(|chunk| {
            let start = (chunk.input_start * crate::plan::SAMPLE_RATE).round().max(0.0) as usize;
            let end = (chunk.input_end * crate::plan::SAMPLE_RATE).round().max(0.0) as usize;
            let start = start.min(sample_count);
            let end = end.min(sample_count);
            (end > start).then_some((start, end))
        })
        .collect()
}

/// The language a chunked run uses: `auto` when detection is on, the requested
/// language otherwise, and the engine's default when neither is given.
fn chunk_language(options: &TranscribeOptions, default: &str) -> String {
    if options.detect_language {
        return "auto".to_string();
    }
    match options.language.as_deref() {
        Some(language) if !language.is_empty() => language.to_string(),
        _ => default.to_string(),
    }
}

pub fn whisper_capabilities() -> EngineCapabilities {
    EngineCapabilities {
        engine: "whisper".to_string(),
        requires_vad: false,
        languages: whisper_rs::supported_languages(),
        language_detection: true,
        streaming: true,
        translation: true,
        timestamps: true,
        text_prompts: true,
        max_input_seconds: None,
    }
}

fn nemotron_segment(transcription: &nemotron_rs::Transcription) -> Option<Segment> {
    (!transcription.text.is_empty()).then(|| Segment {
        start: transcription.tokens.first().map_or(0, |token| token.frame as i64 * 8),
        end: transcription.tokens.last().map_or(0, |token| (token.frame as i64 + 1) * 8),
        text: transcription.text.clone(),
        no_speech_prob: 0.0,
    })
}

fn validate_parakeet_options(options: &TranscribeOptions) -> anyhow::Result<()> {
    if options.translate {
        bail!("Parakeet does not support translation");
    }
    if options.prompt.is_some() {
        bail!("Parakeet does not support text prompts");
    }
    Ok(())
}

fn engine_vad<'a>(
    cached: &'a mut Option<VadCache>,
    path: Option<&str>,
    options: vad_rs::Options,
    engine: &str,
) -> anyhow::Result<&'a mut vad_rs::Vad> {
    let path = path.with_context(|| format!("vad_model_path is required for {engine}"))?;
    let stale = cached
        .as_ref()
        .is_none_or(|cached| cached.path != path || cached.options != options);
    if stale {
        *cached = Some(VadCache {
            path: path.to_owned(),
            options,
            vad: vad_rs::Vad::new(path, options)?,
        });
    }
    Ok(&mut cached.as_mut().expect("VAD initialized").vad)
}

fn parakeet_segment(transcription: &parakeet_rs::Transcription) -> Option<Segment> {
    (!transcription.text.is_empty()).then(|| Segment {
        start: transcription.tokens.first().map_or(0, |token| token.frame as i64 * 8),
        end: transcription
            .tokens
            .last()
            .map_or(0, |token| (token.frame + token.duration_frames.max(1)) as i64 * 8),
        text: transcription.text.clone(),
        no_speech_prob: 0.0,
    })
}

pub fn gigaam_capabilities(info: &gigaam_rs::ModelInfo) -> EngineCapabilities {
    EngineCapabilities {
        engine: "gigaam".to_string(),
        requires_vad: true,
        languages: info.languages.clone(),
        language_detection: false,
        streaming: false,
        translation: false,
        timestamps: true,
        text_prompts: false,
        max_input_seconds: Some(25.0),
    }
}

/// GigaAM is trained for utterances up to about 25 seconds, so its VAD chunks
/// stay below that bound with no cross-chunk overlap.
fn gigaam_vad_options() -> vad_rs::Options {
    vad_rs::Options {
        max_chunk_ms: 24_000,
        overlap_ms: 0,
        ..vad_rs::Options::default()
    }
}

fn validate_gigaam_options(options: &TranscribeOptions) -> anyhow::Result<()> {
    if options.translate {
        bail!("GigaAM does not support translation");
    }
    if options.prompt.is_some() {
        bail!("GigaAM does not support text prompts");
    }
    if options.stable_timestamps {
        bail!("GigaAM does not support stable timestamps");
    }
    Ok(())
}

/// GigaAM reports token timestamps at the 40 ms encoder frame rate.
const GIGAAM_CENTISECONDS_PER_FRAME: i64 = 4;

fn gigaam_segment(transcription: &gigaam_rs::Transcription) -> Option<Segment> {
    (!transcription.text.is_empty()).then(|| Segment {
        start: transcription
            .tokens
            .first()
            .map_or(0, |token| token.frame as i64 * GIGAAM_CENTISECONDS_PER_FRAME),
        end: transcription
            .tokens
            .last()
            .map_or(0, |token| (token.frame as i64 + 1) * GIGAAM_CENTISECONDS_PER_FRAME),
        text: transcription.text.clone(),
        no_speech_prob: 0.0,
    })
}

/// Whether the file starts with the GGUF magic. Whisper models use the older
/// GGML container and are handled by whisper.cpp instead.
pub fn is_gguf(path: &str) -> bool {
    use std::io::Read;

    let mut magic = [0u8; 4];
    std::fs::File::open(path).is_ok_and(|mut file| file.read_exact(&mut magic).is_ok()) && &magic == b"GGUF"
}

/// Reads model metadata once and reports the engine the server would load.
/// `Engine::load` and the metadata route share this function so a model cannot
/// be listed as supported and then rejected, or the other way round.
pub fn detect_model(path: &str) -> anyhow::Result<EngineCapabilities> {
    if !is_gguf(path) {
        whisper_rs::validate_model_file(path)?;
        return Ok(whisper_capabilities());
    }
    // Read `general.architecture` once so an unsupported file is rejected by
    // name instead of by whichever key the last engine reader happened to miss.
    let architecture = gguf_architecture(path);
    if let Ok(info) = gigaam_rs::Model::metadata(path) {
        if info.architecture == "gigaam" {
            return Ok(gigaam_capabilities(&info));
        }
    }
    if let Ok(info) = parakeet_rs::Model::metadata(path) {
        if info.architecture == "parakeet" && info.head_kind == "tdt" && info.variant.contains("v3") {
            return Ok(parakeet_capabilities(info.languages, info.language_detection));
        }
    }
    match nemotron_rs::Model::metadata(path) {
        Ok(info) if info.architecture == "parakeet" && info.head_kind == "rnnt" => {
            Ok(nemotron_capabilities(info.languages, info.language_detection))
        }
        Ok(info) => bail!(
            "unsupported GGUF architecture '{}' with head '{}'",
            info.architecture,
            info.head_kind
        ),
        Err(err) => {
            tracing::error!(model = path, "failed to read GGUF metadata: {err}");
            match architecture {
                Some(architecture) => bail!("unsupported GGUF architecture '{architecture}'"),
                None => bail!("failed to read GGUF metadata: {err}"),
            }
        }
    }
}

/// Reads `general.architecture` from a GGUF without materializing tensors.
fn gguf_architecture(path: &str) -> Option<String> {
    use gigaam_rs::sys;
    use std::ffi::{CStr, CString};

    let path = CString::new(path).ok()?;
    let key = CString::new("general.architecture").ok()?;
    unsafe {
        let mut tensors = std::ptr::null_mut();
        let gguf = sys::gguf_init_from_file(
            path.as_ptr(),
            sys::gguf_init_params {
                no_alloc: true,
                ctx: &mut tensors,
            },
        );
        if gguf.is_null() {
            return None;
        }
        let id = sys::gguf_find_key(gguf, key.as_ptr());
        let architecture = (id >= 0)
            .then(|| sys::gguf_get_val_str(gguf, id))
            .filter(|value| !value.is_null())
            .map(|value| CStr::from_ptr(value).to_string_lossy().into_owned());
        if !tensors.is_null() {
            sys::ggml_free(tensors);
        }
        sys::gguf_free(gguf);
        architecture
    }
}

#[cfg(test)]
#[path = "engine_tests.rs"]
mod tests;
