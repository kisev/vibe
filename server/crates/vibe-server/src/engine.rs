use std::sync::OnceLock;

use anyhow::{bail, Context as _};
use serde::Serialize;
use transcribe_cpp::{Capabilities, Feature, Model, RunOptions, Task, TimestampKind, Transcript};

/// One VAD model per path and option set. GigaAM caps speech segments below
/// its 25-second window while the other engines keep the 30-second default.
pub struct VadCache {
    pub path: String,
    pub options: transcribe_cpp::VadOptions,
    pub model: transcribe_cpp::Model,
}

/// A transcript segment with timestamps in centiseconds, matching the units
/// the formatters and the diarization overlap matcher expect.
#[derive(Debug, Clone, Serialize, utoipa::ToSchema)]
pub struct Segment {
    pub start: i64,
    pub end: i64,
    pub text: String,
    pub no_speech_prob: f32,
}

#[derive(Debug, Clone, Default, Serialize)]
pub struct TranscribeResult {
    pub segments: Vec<Segment>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub language: Option<String>,
}

impl TranscribeResult {
    pub fn text(&self) -> String {
        let mut text = String::new();
        for (index, segment) in self.segments.iter().enumerate() {
            if index > 0 {
                text.push(' ');
            }
            text.push_str(segment.text.trim());
        }
        text
    }
}

/// Progress callbacks for a chunked or streaming run. `on_segment` fires as
/// soon as a segment is final; `should_abort` is polled between chunks.
pub type OnProgress<'a> = Box<dyn FnMut(usize) + 'a>;
pub type OnSegment<'a> = Box<dyn FnMut(&Segment) + 'a>;
pub type ShouldAbort<'a> = Box<dyn FnMut() -> bool + 'a>;

#[derive(Default)]
pub struct StreamCallbacks<'a> {
    pub on_progress: Option<OnProgress<'a>>,
    pub on_segment: Option<OnSegment<'a>>,
    pub should_abort: Option<ShouldAbort<'a>>,
}

/// The request options the CLI and the HTTP form build. Every field maps onto
/// the unified engine where an equivalent exists; the whisper beam-search
/// knobs are accepted for API compatibility and honored as greedy decoding.
#[derive(Debug, Clone, Default)]
pub struct TranscribeOptions {
    pub language: Option<String>,
    pub detect_language: bool,
    pub translate: bool,
    pub threads: i32,
    pub prompt: Option<String>,
    /// Kept for the CLI/HTTP surface; the unified engine's own logging rides
    /// on `set_verbose` instead of a per-request flag.
    #[allow(dead_code)]
    pub verbose: bool,
    pub temperature: f32,
    pub max_text_ctx: i32,
    pub word_timestamps: bool,
    pub max_segment_len: i32,
    pub sampling_greedy: bool,
    pub best_of: i32,
    pub beam_size: i32,
    pub stable_timestamps: bool,
    pub vad_model_path: Option<String>,
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
    /// Whether stable-timestamp correction applies. Only Whisper implements it today;
    /// clients gate the control on this flag, never on the engine name.
    pub stable_timestamps: bool,
    /// Whether the Whisper-style decoding knobs apply (sampling strategy, beams,
    /// temperature, word timestamps, sentence splitting). Clients gate on this flag.
    pub decoding_options: bool,
    /// Longest audio the engine may receive, when it accepts externally
    /// chunked input. Absent means the engine owns its own long-form path.
    pub max_input_seconds: Option<f64>,
}

/// Device selection for a model load, mirroring the old whisper context
/// options: an explicit GPU index or strict CPU.
#[derive(Debug, Clone, Copy, Default)]
pub struct ContextOptions {
    pub gpu_device: i32,
    pub no_gpu: bool,
}

/// Route native engine diagnostics somewhere useful, or silence them.
pub fn set_verbose(verbose: bool) {
    if verbose {
        transcribe_cpp::init_logging();
    } else {
        transcribe_cpp::disable_logging();
    }
}

pub struct GpuDevice {
    pub index: usize,
    pub name: String,
    pub description: String,
    pub device_type: GPUDeviceType,
}

pub enum GPUDeviceType {
    Gpu,
    IntegratedGpu,
}

/// The GPU devices this build can see, in the CLI's stable order.
pub fn list_gpu_devices() -> Vec<GpuDevice> {
    transcribe_cpp::devices()
        .into_iter()
        .enumerate()
        .filter_map(|(index, device)| {
            let device_type = match device.device_type {
                transcribe_cpp::DeviceType::Gpu => GPUDeviceType::Gpu,
                transcribe_cpp::DeviceType::Igpu => GPUDeviceType::IntegratedGpu,
                _ => return None,
            };
            Some(GpuDevice {
                index,
                name: device.name,
                description: device.description,
                device_type,
            })
        })
        .collect()
}

/// Register backend modules once before the first load; a no-op in the
/// static-link builds the server ships.
fn ensure_backends() {
    static INIT: OnceLock<()> = OnceLock::new();
    INIT.get_or_init(|| {
        if let Err(err) = transcribe_cpp::init_backends_default() {
            tracing::error!(?err, "transcribe.cpp backend init failed; dynamic backends are unavailable");
        }
    });
}

/// The unified ASR engine: every family loads through the transcribe.cpp
/// transcribe.cpp model, and the planner drives bounded families.
pub struct Engine {
    model: Model,
    vad: Option<VadCache>,
    caps: EngineCapabilities,
    max_timestamp_kind: TimestampKind,
}

impl Engine {
    pub fn requires_vad(&self) -> bool {
        self.caps.requires_vad
    }

    pub fn load(path: &str, options: ContextOptions) -> anyhow::Result<Self> {
        reject_legacy_container(path)?;
        ensure_backends();
        // `gpu_device` keeps the old whisper contract: 0 (and negatives) pick the
        // backend's automatic device, n > 0 selects the (n-1)-th GPU explicitly.
        let model_options = if options.no_gpu {
            transcribe_cpp::ModelOptions {
                backend: transcribe_cpp::Backend::Cpu,
                ..Default::default()
            }
        } else if options.gpu_device > 0 {
            let gpus = list_gpu_devices();
            let index = gpus
                .get(options.gpu_device as usize - 1)
                .map(|gpu| gpu.index)
                .with_context(|| format!("GPU device {} is not available", options.gpu_device))?;
            let device = transcribe_cpp::devices().into_iter().nth(index);
            transcribe_cpp::ModelOptions {
                backend: transcribe_cpp::Backend::Auto,
                device,
                ..Default::default()
            }
        } else {
            transcribe_cpp::ModelOptions::default()
        };
        let model = load_model(path, &model_options)?;
        let caps = model_capabilities(&model)?;
        let max_timestamp_kind = model
            .capabilities()
            .map(|c| c.max_timestamp_kind)
            .unwrap_or(TimestampKind::None);
        Ok(Engine {
            model,
            vad: None,
            caps,
            max_timestamp_kind,
        })
    }

    pub fn transcribe(&mut self, samples: &[f32], mut options: TranscribeOptions) -> anyhow::Result<TranscribeResult> {
        self.validate_request(&mut options)?;
        if self.caps.requires_vad {
            // Bounded families run through VAD-detected speech, exactly as the
            // hand-written engines did: whole-buffer input is refused by design.
            let ranges = self.speech_ranges(samples, options.vad_model_path.as_deref())?;
            let flat: Vec<(usize, usize)> = ranges
                .iter()
                .map(|(start, end)| {
                    (
                        (*start * crate::plan::SAMPLE_RATE) as usize,
                        (*end * crate::plan::SAMPLE_RATE) as usize,
                    )
                })
                .collect();
            let callbacks = StreamCallbacks::default();
            return self.transcribe_chunks_with(samples, &flat, options, callbacks);
        }
        let mut session = self.model.session().context("session init failed")?;
        let run = self.run_options(&options);
        let transcript = session.run(samples, &run).context("inference failed")?;
        let segments = segments_for(&transcript, 0, samples.len());
        Ok(TranscribeResult {
            segments,
            language: transcript.language,
        })
    }

    /// Longest input the engine accepts from an external plan.
    pub fn max_input_seconds(&self) -> Option<f64> {
        self.caps.max_input_seconds
    }

    /// Speech ranges in seconds, from the engine's cached VAD. The planner uses
    /// them as the pauses it may cut in.
    pub fn speech_ranges(&mut self, samples: &[f32], vad_model_path: Option<&str>) -> anyhow::Result<Vec<(f64, f64)>> {
        if !self.caps.requires_vad {
            bail!("{} keeps its own long-form path", self.caps.engine);
        }
        let bound_ms = self.caps.max_input_seconds.unwrap_or(30.0) * 1000.0;
        let options = vad_options_for(bound_ms);
        let vad = engine_vad(&mut self.vad, vad_model_path, options, &self.caps.engine)?;
        let mut session = vad.model.vad_session().context("VAD session init failed")?;
        let result = session.run(samples, &vad.options).context("VAD segmentation failed")?;
        Ok(result
            .segments
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
    /// Long-form families are refused: their output depends on internal
    /// segmentation and prompt context, so they keep their own long-form path.
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
        mut options: TranscribeOptions,
        callbacks: StreamCallbacks<'_>,
    ) -> anyhow::Result<TranscribeResult> {
        if self.caps.max_input_seconds.is_none() {
            bail!("{} does not accept an external chunk plan", self.caps.engine);
        }
        self.validate_request(&mut options)?;
        let StreamCallbacks {
            mut on_progress,
            mut on_segment,
            mut should_abort,
        } = callbacks;
        let mut session = self.model.session().context("session init failed")?;
        let run = self.run_options(&options);
        let mut segments = Vec::new();
        for (index, (start, end)) in ranges.iter().enumerate() {
            if should_abort.as_mut().is_some_and(|callback| callback()) {
                bail!("transcription aborted");
            }
            let chunk = &samples[*start..*end];
            let transcript = session.run(chunk, &run).context("inference failed")?;
            if let Some(callback) = on_progress.as_mut() {
                callback(index + 1);
            }
            for segment in segments_for(&transcript, *start, *end) {
                if let Some(callback) = on_segment.as_mut() {
                    callback(&segment);
                }
                segments.push(segment);
            }
        }
        Ok(TranscribeResult {
            segments,
            language: None,
        })
    }

    pub fn transcribe_stream(
        &mut self,
        samples: &[f32],
        mut options: TranscribeOptions,
        callbacks: StreamCallbacks<'_>,
    ) -> anyhow::Result<TranscribeResult> {
        self.validate_request(&mut options)?;
        let StreamCallbacks {
            mut on_progress,
            mut on_segment,
            mut should_abort,
        } = callbacks;
        let mut session = self.model.session().context("session init failed")?;
        let run = self.run_options(&options);
        let mut seen = 0usize;
        if self.caps.streaming {
            use transcribe_cpp::{StreamExtension, StreamOptions};
            // The parakeet-lineage streaming families take their cache-aware
            // streaming knobs through the family extension; without it the
            // engine keeps its default commit policy and emits nothing.
            let family = matches!(self.caps.engine.as_str(), "parakeet" | "nemotron")
                .then(|| StreamExtension::ParakeetStream(Default::default()));
            let stream_options = StreamOptions {
                family,
                ..StreamOptions::default()
            };
            let mut stream = session.stream(&run, &stream_options).context("stream init failed")?;
            // Feed in roughly one-second windows so segments commit early.
            // Structured families surface committed segments through the
            // snapshot; text-only streaming families (the parakeet lineage)
            // grow `committed` instead, and each growth becomes one segment.
            let window = crate::plan::SAMPLE_RATE as usize;
            let mut emitted_text = String::new();
            let mut emitted_ms = 0i64;
            let mut live: Vec<Segment> = Vec::new();
            let drain = |stream: &transcribe_cpp::Stream<'_>,
                         seen: &mut usize,
                         end_ms: i64,
                         on_segment: &mut Option<OnSegment<'_>>,
                         live: &mut Vec<Segment>,
                         emitted_text: &mut String,
                         emitted_ms: &mut i64| {
                let snapshot = stream.snapshot();
                if !snapshot.segments.is_empty() {
                    emit_new(seen, &snapshot, on_segment);
                    return;
                }
                let committed = stream.text().committed;
                if committed.len() > emitted_text.len() && committed.starts_with(&*emitted_text) {
                    let delta = &committed[emitted_text.len()..];
                    let text = delta.trim().to_owned();
                    if !text.is_empty() {
                        let segment = Segment {
                            start: *emitted_ms / 10,
                            end: end_ms / 10,
                            text,
                            no_speech_prob: 0.0,
                        };
                        if let Some(callback) = on_segment.as_mut() {
                            callback(&segment);
                        }
                        live.push(segment);
                    }
                    *emitted_ms = end_ms;
                    *emitted_text = committed;
                }
            };
            for chunk_start in (0..samples.len()).step_by(window) {
                if should_abort.as_mut().is_some_and(|callback| callback()) {
                    drop(stream);
                    bail!("transcription aborted");
                }
                let end = (chunk_start + window).min(samples.len());
                let update = stream.feed(&samples[chunk_start..end]).context("stream feed failed")?;
                drain(
                    &stream,
                    &mut seen,
                    update.input_received_ms,
                    &mut on_segment,
                    &mut live,
                    &mut emitted_text,
                    &mut emitted_ms,
                );
                if let Some(callback) = on_progress.as_mut() {
                    callback((end / window).max(1));
                }
            }
            let final_update = stream.finalize().context("stream finalize failed")?;
            drain(
                &stream,
                &mut seen,
                final_update.input_received_ms,
                &mut on_segment,
                &mut live,
                &mut emitted_text,
                &mut emitted_ms,
            );
            let transcript = stream.snapshot();
            let language = transcript.language.clone();
            if !transcript.segments.is_empty() {
                let segments = segments_for(&transcript, 0, samples.len());
                Ok(TranscribeResult { segments, language })
            } else {
                Ok(TranscribeResult {
                    segments: live,
                    language,
                })
            }
        } else {
            let transcript = session.run(samples, &run).context("inference failed")?;
            emit_new(&mut seen, &transcript, &mut on_segment);
            let segments = segments_for(&transcript, 0, samples.len());
            Ok(TranscribeResult {
                segments,
                language: transcript.language,
            })
        }
    }

    /// Rejects options the loaded engine cannot honor before any audio is
    /// decoded, so CLI and streaming requests fail with a specific reason.
    /// A stable-timestamp request the engine cannot run is downgraded to a
    /// warning and dropped instead, like word timestamps: it is a quality
    /// enhancement, never a semantic option, and clients send it without
    /// checking the model's capabilities.
    pub fn validate_request(&self, options: &mut TranscribeOptions) -> anyhow::Result<()> {
        let engine = self.caps.engine.as_str();
        if options.translate && !self.caps.translation {
            bail!("{engine} does not support translation");
        }
        if options.prompt.is_some() && !self.caps.text_prompts {
            bail!("{engine} does not support text prompts");
        }
        if options.stable_timestamps && !self.caps.stable_timestamps {
            tracing::warn!("{engine} does not support stable timestamps; ignoring the flag");
            options.stable_timestamps = false;
        }
        if self.caps.languages.len() == 1 && !self.caps.language_detection {
            let only = &self.caps.languages[0];
            let requested = options.language.as_deref().unwrap_or("");
            if !requested.is_empty() && requested != "auto" && requested != only {
                bail!("{engine} supports only {only}");
            }
        }
        Ok(())
    }

    pub fn capabilities(&self) -> EngineCapabilities {
        self.caps.clone()
    }

    fn run_options(&self, options: &TranscribeOptions) -> RunOptions {
        warn_ignored(options);
        let mut run = RunOptions {
            language: (!options.detect_language).then(|| options.language.clone()).flatten(),
            task: if options.translate {
                Task::Translate
            } else {
                Task::Transcribe
            },
            timestamps: requested_timestamps(options.word_timestamps, self.max_timestamp_kind),
            ..RunOptions::default()
        };
        if self.caps.decoding_options {
            run.family = Some(transcribe_cpp::RunExtension::Whisper(transcribe_cpp::WhisperRunOptions {
                initial_prompt: options.prompt.clone(),
                temperature: (options.temperature != 0.0).then_some(options.temperature),
                condition_on_prev_tokens: Some(options.stable_timestamps),
                max_prev_context_tokens: (options.max_text_ctx != 0).then_some(options.max_text_ctx),
                ..Default::default()
            }));
        }
        run
    }
}

/// Map a transcript's segments, or synthesize one spanning the input when the
/// family emits only running text (GigaAM today): every model input still
/// yields exactly one row the planner and the overlap matcher can place.
fn segments_for(transcript: &Transcript, start_sample: usize, end_sample: usize) -> Vec<Segment> {
    let mapped: Vec<Segment> = transcript
        .segments
        .iter()
        .filter(|segment| !segment.text.is_empty())
        .map(|segment| Segment {
            start: segment.t0_ms / 10,
            end: segment.t1_ms / 10,
            text: segment.text.clone(),
            no_speech_prob: 0.0,
        })
        .collect();
    if !mapped.is_empty() {
        return mapped;
    }
    let text = transcript.text.trim();
    if end_sample > start_sample && !text.is_empty() {
        vec![Segment {
            start: (start_sample as f64 / crate::plan::SAMPLE_RATE * 100.0) as i64,
            end: (end_sample as f64 / crate::plan::SAMPLE_RATE * 100.0) as i64,
            text: text.to_owned(),
            no_speech_prob: 0.0,
        }]
    } else {
        Vec::new()
    }
}

/// Emit the segments of `transcript` past `seen` through `on_segment`.
fn emit_new(seen: &mut usize, transcript: &Transcript, on_segment: &mut Option<OnSegment<'_>>) {
    let fresh: Vec<Segment> = transcript
        .segments
        .iter()
        .skip(*seen)
        .filter(|segment| !segment.text.is_empty())
        .map(|segment| Segment {
            start: segment.t0_ms / 10,
            end: segment.t1_ms / 10,
            text: segment.text.clone(),
            no_speech_prob: 0.0,
        })
        .collect();
    *seen += fresh.len();
    for segment in fresh {
        if let Some(callback) = on_segment.as_mut() {
            callback(&segment);
        }
    }
}

/// The granularity to request: word-level when asked for and the family can
/// produce it, segment-level when the family produces alignment at all, and
/// none for text-only families (canary, Qwen3-ASR, voxtral today).
fn requested_timestamps(word_timestamps: bool, max_kind: TimestampKind) -> TimestampKind {
    match max_kind {
        TimestampKind::Token | TimestampKind::Word => {
            if word_timestamps {
                TimestampKind::Word
            } else {
                TimestampKind::Segment
            }
        }
        TimestampKind::Segment | TimestampKind::Auto => TimestampKind::Segment,
        TimestampKind::None => TimestampKind::None,
    }
}

fn warn_ignored(options: &TranscribeOptions) {
    static WARNED: OnceLock<()> = OnceLock::new();
    if WARNED.set(()).is_ok() {
        if !options.sampling_greedy || options.beam_size != 0 || options.best_of != 0 {
            log::warn!(
                "beam-search decoding is not available in the unified engine; decoding greedily with temperature fallback"
            );
        }
        if options.max_segment_len != 0 || options.threads != 0 {
            log::warn!("max_segment_len and n_threads are engine-internal in the unified engine and are ignored");
        }
    }
}

/// The legacy families' documented input windows and names. The unified
/// engine treats several of them as long-form internally, but the planner and
/// the cache need the explicit windows the hand-written engines enforced, and
/// the desktop still keys its engine unions on these names, so vibe owns them.
/// Returns `(engine name, window seconds)`; a `None` window means unbounded.
fn family_window(arch: &str, variant: &str) -> Option<(&'static str, Option<f64>)> {
    match (arch, variant.starts_with("nemotron")) {
        ("whisper", _) => Some(("whisper", None)),
        ("gigaam", _) => Some(("gigaam", Some(25.0))),
        ("parakeet", true) => Some(("nemotron", Some(30.0))),
        ("parakeet", false) => Some(("parakeet", Some(30.0))),
        _ => None,
    }
}

/// The capability view of a loaded model: the unified engine's metadata,
/// shaped into the server's capability contract.
pub fn model_capabilities(model: &Model) -> anyhow::Result<EngineCapabilities> {
    let arch = model.arch();
    let variant = model.variant();
    let caps: Capabilities = model.capabilities()?;
    // Known families keep their legacy name and documented window; a new
    // family reports its own architecture name and honors any upstream bound.
    let (engine, window) = match family_window(&arch, &variant) {
        Some((name, bound)) => (name.to_owned(), bound),
        None => {
            // A new family owns its own input handling unless it declares an
            // utterance-scale window (≤ 60 s); multi-minute limits such as
            // canary's 400 s are long-form behavior, not a planner window.
            let utterance_bound = caps.max_audio_ms > 0 && caps.max_audio_ms <= 60_000;
            let bound = (utterance_bound && !model.supports(Feature::LongForm)).then(|| caps.max_audio_ms as f64 / 1000.0);
            (arch.clone(), bound)
        }
    };
    let is_whisper = engine == "whisper";
    Ok(EngineCapabilities {
        engine,
        // Bounded families are planned externally and need the VAD model for
        // pause-aware cutting; long-form families handle their own input.
        requires_vad: window.is_some(),
        languages: caps.languages,
        language_detection: caps.supports_language_detect,
        streaming: caps.supports_streaming,
        translation: caps.supports_translate,
        timestamps: !matches!(caps.max_timestamp_kind, TimestampKind::None | TimestampKind::Auto),
        text_prompts: model.supports(Feature::InitialPrompt) || model.supports(Feature::ContextPrompt),
        stable_timestamps: is_whisper,
        decoding_options: is_whisper,
        max_input_seconds: window,
    })
}

/// Reads `general.architecture` straight from the GGUF container, so an
/// unsupported family is rejected by name even when the engine's own error
/// only carries a status code.
pub(crate) fn gguf_architecture(path: &str) -> Option<String> {
    use std::io::Read;

    let mut bytes = Vec::new();
    std::fs::File::open(path).ok()?.read_to_end(&mut bytes).ok()?;
    if bytes.len() < 12 || &bytes[..4] != b"GGUF" {
        return None;
    }
    // Header: magic (4) + version u32 (4), then tensor count and kv count, u64 each.
    let u64_at = |bytes: &[u8], at: usize| {
        at.checked_add(8)
            .and_then(|end| bytes.get(at..end))
            .and_then(|v| <[u8; 8]>::try_from(v).ok().map(u64::from_le_bytes))
    };
    let mut cursor = 8usize;
    let _tensors = u64_at(&bytes, cursor)?;
    cursor += 8;
    let kvs = u64_at(&bytes, cursor)? as usize;
    cursor += 8;
    for _ in 0..kvs {
        let key_len = u64_at(&bytes, cursor)? as usize;
        cursor += 8;
        let key = bytes.get(cursor..cursor.checked_add(key_len)?)?;
        cursor += key_len;
        let value_type = bytes
            .get(cursor..cursor.checked_add(4)?)?
            .try_into()
            .map(u32::from_le_bytes)
            .ok()?;
        cursor += 4;
        // Walk the value; only the string shape is decoded, everything else
        // is skipped by its documented GGUF width.
        let width = match value_type {
            0..=5 => 1, // u8..f32 except f64
            6 => 2,     // f64
            7 => 1,     // bool
            8 => {
                return (key == b"general.architecture").then(|| {
                    let len = u64_at(&bytes, cursor).unwrap_or(0) as usize;
                    String::from_utf8_lossy(bytes.get(cursor + 8..cursor + 8 + len).unwrap_or_default()).into_owned()
                })
            }
            9 | 10 => 4, // u32 pairs and i32 pairs
            11 => 16,    // f32 quartet
            _ => return None,
        };
        cursor += width;
    }
    None
}

/// Load a GGUF model through the unified engine, naming the family when the
/// engine refuses the file.
fn load_model(path: &str, model_options: &transcribe_cpp::ModelOptions) -> anyhow::Result<Model> {
    transcribe_cpp::Model::load_with(path, model_options).with_context(|| match gguf_architecture(path) {
        Some(architecture) => format!("unsupported architecture: {architecture}"),
        None => "model load failed".to_string(),
    })
}

/// Whisper models in the legacy ggml `.bin` container are retired: the error
/// names the format and points at the catalog that publishes the GGUF files.
pub fn reject_legacy_container(path: &str) -> anyhow::Result<()> {
    if is_gguf(path) {
        return Ok(());
    }
    let filename = std::path::Path::new(path)
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or(path);
    bail!(
        "unsupported model format: {filename} is not a GGUF file. The legacy whisper .bin container is \
         no longer supported — download the GGUF build from the model catalog"
    )
}

/// Speech segments longer than the model's input window are split by the VAD
/// itself (`max_speech_ms`), with half a second of margin below the bound.
/// GigaAM's 24 s window matches Silero's documented utterance limit.
fn vad_options_for(bound_ms: f64) -> transcribe_cpp::VadOptions {
    transcribe_cpp::VadOptions {
        max_speech_ms: (bound_ms - 500.0) as i32,
        ..Default::default()
    }
}

fn engine_vad<'a>(
    cached: &'a mut Option<VadCache>,
    path: Option<&str>,
    options: transcribe_cpp::VadOptions,
    engine: &str,
) -> anyhow::Result<&'a mut VadCache> {
    let path = path.with_context(|| format!("vad_model_path is required for {engine}"))?;
    let stale = cached
        .as_ref()
        .is_none_or(|cached| cached.path != path || cached.options != options);
    if stale {
        let model = transcribe_cpp::Model::load(path).context("VAD model load failed")?;
        *cached = Some(VadCache {
            path: path.to_owned(),
            options,
            model,
        });
    }
    cached.as_mut().ok_or_else(|| anyhow::anyhow!("VAD cache missing after load"))
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

/// Whether the file starts with the GGUF magic. Anything else is a legacy or
/// foreign container and never reaches the unified loader.
pub fn is_gguf(path: &str) -> bool {
    use std::io::Read;

    let mut magic = [0u8; 4];
    std::fs::File::open(path).is_ok_and(|mut file| file.read_exact(&mut magic).is_ok()) && &magic == b"GGUF"
}

/// Loads the model metadata once and reports the engine the server would run.
/// `Engine::load` and the metadata route share this function so a model cannot
/// be listed as supported and then rejected, or the other way round. The load
/// is memory-mapped, so the probe costs the metadata read, not the weights.
pub fn detect_model(path: &str) -> anyhow::Result<EngineCapabilities> {
    reject_legacy_container(path)?;
    ensure_backends();
    let model = load_model(path, &transcribe_cpp::ModelOptions::default())?;
    model_capabilities(&model)
}

#[cfg(test)]
#[path = "engine_tests.rs"]
mod tests;
