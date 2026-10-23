use std::collections::HashMap;

use axum::http::{header, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::Json;
use whisper_rs::TranscribeOptions;

use crate::audio;
use crate::cache;
use crate::cli::AppConfig;
use crate::server::diarization;
use crate::server::form::FormValues;
use crate::server::stream::stream_transcription;
use crate::server::unload_timeout::ModelLease;
use crate::server::{error, format, TextResponse};
use crate::{
    engine::Engine,
    plan::{self, Plan, Settings},
};

pub(super) struct TranscriptionRequest {
    pub file: Vec<u8>,
    pub form: HashMap<String, String>,
}

pub(super) async fn transcribe(
    config: AppConfig,
    mut model: ModelLease,
    request: TranscriptionRequest,
) -> Result<Response, Response> {
    let TranscriptionRequest { file, form } = request;
    let (diarize_model, enhance_audio, stable_timestamps, vad_model_path, stream, response_format, chunk_seconds) = {
        let values = FormValues::new(&form);
        (
            values.string("diarize_model"),
            values.bool("enhance_audio"),
            values.bool("stable_timestamps"),
            values.string("vad_model"),
            values.bool("stream"),
            values.str_or("response_format", "json").to_string(),
            values.f32("chunk_seconds"),
        )
    };
    let chunk_seconds = (chunk_seconds > 0.0).then_some(f64::from(chunk_seconds));

    // The bound is known before any audio is decoded, so a request that can
    // never succeed is refused here.
    if let Some(ctx) = model.ctx.as_ref() {
        if let Some(message) = chunk_seconds_error(chunk_seconds, ctx.max_input_seconds()) {
            return Err(error(StatusCode::BAD_REQUEST, "invalid_request", &message));
        }
    }
    let audio_options = audio::ReadOptions {
        enhance_audio,
        verbose: config.verbose(),
    };
    let samples = audio::read_bytes_with_options(file, audio_options).map_err(|err| {
        error(
            StatusCode::BAD_REQUEST,
            "invalid_audio",
            &format!("invalid audio file: {err}"),
        )
    })?;

    let diar_segments = diarize_model
        .as_deref()
        .map_or_else(Vec::new, |model_path| diarization::diarize(model_path, &samples));

    if stable_timestamps && vad_model_path.is_none() {
        return Err(error(
            StatusCode::BAD_REQUEST,
            "invalid_request",
            "'vad_model' is required when 'stable_timestamps' is true",
        ));
    }

    if let Some(ctx) = model.ctx.as_ref() {
        let options = build_options(&form, config.verbose(), stable_timestamps, vad_model_path.clone());
        if let Err(err) = ctx.validate_request(&options) {
            return Err(error(
                super::engine_error_status(&err),
                super::engine_error_code(&err),
                &err.to_string(),
            ));
        }
    }

    if stream {
        let plan = model
            .ctx
            .as_mut()
            .and_then(|ctx| plan_for(ctx, &samples, &diar_segments, vad_model_path.as_deref(), chunk_seconds));
        return stream_transcription(
            config,
            model,
            samples,
            form,
            stable_timestamps,
            vad_model_path,
            diar_segments,
            plan,
        )
        .map_err(|err| *err);
    }

    let verbose = config.verbose();
    let model_path = model.model_path.clone();
    let ctx = model
        .ctx
        .as_mut()
        .ok_or_else(|| error(StatusCode::SERVICE_UNAVAILABLE, "no_model", "no model loaded"))?;

    if ctx.requires_vad() && vad_model_path.is_none() {
        return Err(error(
            StatusCode::BAD_REQUEST,
            "invalid_request",
            "'vad_model' is required for this transcription engine",
        ));
    }

    let opts = build_options(&form, verbose, stable_timestamps, vad_model_path.clone());
    let plan = plan_for(ctx, &samples, &diar_segments, vad_model_path.as_deref(), chunk_seconds);
    let options_json = serde_json::json!({
        "language": opts.language,
        "detect_language": opts.detect_language,
        "translate": opts.translate,
        "prompt": opts.prompt,
        "temperature": opts.temperature,
        "word_timestamps": opts.word_timestamps,
        "max_segment_len": opts.max_segment_len,
        "stable_timestamps": opts.stable_timestamps,
        "vad_model": opts.vad_model_path,
    });
    let result = match (plan.as_ref(), config.cache_dir()) {
        (Some(plan), Some(root)) => transcribe_cached(ctx, &model_path, &samples, plan, &opts, root, options_json),
        (Some(plan), None) => ctx.transcribe_chunks(&samples, plan, opts),
        (None, _) => ctx.transcribe(&samples, opts),
    }
    .map_err(|err| {
        tracing::error!(samples = samples.len(), "transcription failed: {err:#}");
        error(
            super::engine_error_status(&err),
            super::engine_error_code(&err),
            &format!("transcription failed: {err}"),
        )
    })?;

    let speaker_sets = plan.as_ref().map(|plan| format::planned_speakers(&result, plan));
    Ok(format_response(
        &response_format,
        &result,
        &diar_segments,
        speaker_sets.as_deref(),
    ))
}

/// A segment as it is stored in the cache; identical to the engine's output.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
struct StoredSegment {
    start: i64,
    end: i64,
    text: String,
    no_speech_prob: f32,
}

impl From<&whisper_rs::Segment> for StoredSegment {
    fn from(segment: &whisper_rs::Segment) -> Self {
        Self {
            start: segment.start,
            end: segment.end,
            text: segment.text.clone(),
            no_speech_prob: segment.no_speech_prob,
        }
    }
}

impl From<StoredSegment> for whisper_rs::Segment {
    fn from(segment: StoredSegment) -> Self {
        Self {
            start: segment.start,
            end: segment.end,
            text: segment.text,
            no_speech_prob: segment.no_speech_prob,
        }
    }
}

/// Transcribe the plan chunk by chunk, reusing every chunk a previous run
/// already finished. A chunk that runs out of memory is split in half and the
/// halves are tried; the split is not persisted as a separate plan, so a resumed
/// run reuses the finished result under the same index.
fn transcribe_cached(
    ctx: &mut Engine,
    model_path: &str,
    samples: &[f32],
    plan: &Plan,
    options: &whisper_rs::TranscribeOptions,
    root: &str,
    options_json: serde_json::Value,
) -> anyhow::Result<whisper_rs::TranscribeResult> {
    let engine = ctx.capabilities().engine;
    let identity = cache::Identity {
        audio: samples,
        model: cache::ModelStamp::of(model_path),
        engine: &engine,
        options: options_json.clone(),
        plan,
    };
    let store = cache::Cache::new(root);
    let entry = store.open(&identity.key()).map_err(anyhow::Error::from)?;
    if entry.manifest().is_none() {
        entry
            .write_manifest(&cache::Manifest {
                schema: cache::SCHEMA_VERSION,
                audio_hash: cache::audio_hash(samples),
                model: cache::ModelStamp::of(model_path),
                engine,
                options: options_json,
                plan: plan.clone(),
            })
            .map_err(anyhow::Error::from)?;
        entry.write_plan(plan).map_err(anyhow::Error::from)?;
    }

    let mut segments = Vec::new();
    for (index, chunk) in plan.chunks.iter().enumerate() {
        if let Some(stored) = entry.part::<Vec<StoredSegment>>(index) {
            tracing::debug!(chunk = index, segments = stored.len(), "reusing cached chunk");
            segments.extend(stored.into_iter().map(whisper_rs::Segment::from));
            continue;
        }
        let finished = transcribe_chunk(ctx, samples, chunk, plan.max_input_seconds, options, 0)?;
        entry
            .write_part(index, &finished.iter().map(StoredSegment::from).collect::<Vec<_>>())
            .map_err(anyhow::Error::from)?;
        segments.extend(finished);
    }
    Ok(whisper_rs::TranscribeResult { segments })
}

/// Transcribe one chunk, halving it on an out-of-memory failure until the
/// engine copes or the chunk reaches the minimum useful length.
fn transcribe_chunk(
    ctx: &mut Engine,
    samples: &[f32],
    chunk: &crate::plan::Chunk,
    max_input_seconds: f64,
    options: &whisper_rs::TranscribeOptions,
    depth: usize,
) -> anyhow::Result<Vec<whisper_rs::Segment>> {
    let single = Plan {
        chunks: vec![chunk.clone()],
        max_input_seconds,
    };
    match ctx.transcribe_chunks(samples, &single, options.clone()) {
        Ok(result) => Ok(result.segments),
        Err(err) if is_out_of_memory(&err) && depth < 6 => {
            let middle = (chunk.core_start + chunk.core_end) / 2.0;
            if middle - chunk.core_start < 1.0 || chunk.core_end - middle < 1.0 {
                return Err(err);
            }
            let mut segments = Vec::new();
            for (start, end) in [(chunk.core_start, middle), (middle, chunk.core_end)] {
                let half = crate::plan::Chunk {
                    input_start: start,
                    input_end: end,
                    core_start: start,
                    core_end: end,
                    speakers: chunk.speakers.clone(),
                };
                segments.extend(transcribe_chunk(ctx, samples, &half, max_input_seconds, options, depth + 1)?);
            }
            Ok(segments)
        }
        Err(err) => Err(err),
    }
}

fn is_out_of_memory(error: &anyhow::Error) -> bool {
    let message = format!("{error:#}").to_ascii_lowercase();
    ["out of memory", "outofmemory", "oom", "failed to allocate"]
        .iter()
        .any(|marker| message.contains(marker))
}

/// A message when the requested chunk duration cannot be honoured by this
/// engine, which is known before any audio is decoded.
fn chunk_seconds_error(requested: Option<f64>, maximum: Option<f64>) -> Option<String> {
    match (requested, maximum) {
        (Some(requested), Some(maximum)) if requested > maximum => {
            Some(format!("'chunk_seconds' must not exceed {maximum} for this engine"))
        }
        _ => None,
    }
}

/// Build the chunk plan when the engine accepts explicit chunks and a
/// diarization model supplied the turns. Without either, the engine keeps its
/// own VAD chunking and speakers stay attributed by overlap.
pub(crate) fn plan_for(
    ctx: &mut Engine,
    samples: &[f32],
    diar_segments: &[diarization::Segment],
    vad_model_path: Option<&str>,
    chunk_seconds: Option<f64>,
) -> Option<Plan> {
    let maximum = ctx.max_input_seconds()?;
    if diar_segments.is_empty() {
        return None;
    }
    let speech = match ctx.speech_ranges(samples, vad_model_path) {
        Ok(ranges) => ranges,
        Err(err) => {
            tracing::warn!("skipping chunk planning: {err:#}");
            return None;
        }
    };
    let max_input_seconds = chunk_seconds.map_or(maximum, |value| value.min(maximum));
    let settings = Settings {
        max_input_seconds,
        preferred_seconds: Settings::default().preferred_seconds.min(max_input_seconds),
        ..Settings::default()
    };
    let turns: Vec<plan::DiarSegment> = diar_segments
        .iter()
        .map(|segment| plan::DiarSegment {
            start: segment.start,
            end: segment.end,
            speaker: u16::try_from(segment.speaker_id).unwrap_or(u16::MAX),
        })
        .collect();
    let duration = samples.len() as f64 / plan::SAMPLE_RATE;
    Some(plan::plan(duration, &turns, &speech, settings))
}

pub(super) fn build_options(
    form: &HashMap<String, String>,
    verbose: bool,
    stable_timestamps: bool,
    vad_model_path: Option<String>,
) -> TranscribeOptions {
    let values = FormValues::new(form);
    TranscribeOptions {
        language: values.string("language"),
        detect_language: values.bool("detect_language"),
        translate: values.bool("translate"),
        threads: values.i32("n_threads"),
        prompt: values.string("prompt"),
        verbose,
        temperature: values.f32("temperature"),
        max_text_ctx: values.i32("max_text_ctx"),
        word_timestamps: values.bool("word_timestamps"),
        max_segment_len: values.i32("max_segment_len"),
        sampling_greedy: form.get("sampling_strategy").is_none_or(|strategy| strategy != "beam_search"),
        best_of: values.i32("best_of"),
        beam_size: values.i32("beam_size"),
        stable_timestamps,
        vad_model_path,
    }
}

fn format_response(
    response_format: &str,
    result: &whisper_rs::TranscribeResult,
    diar_segments: &[diarization::Segment],
    speaker_sets: Option<&[Vec<u16>]>,
) -> Response {
    match response_format {
        "verbose_json" => Json(format::build_verbose_json(result, diar_segments, speaker_sets)).into_response(),
        "text" => ([(header::CONTENT_TYPE, "text/plain; charset=utf-8")], result.text()).into_response(),
        "srt" => (
            [(header::CONTENT_TYPE, "text/plain; charset=utf-8")],
            format::format_srt(&result.segments),
        )
            .into_response(),
        "vtt" => (
            [(header::CONTENT_TYPE, "text/plain; charset=utf-8")],
            format::format_vtt(&result.segments),
        )
            .into_response(),
        _ => Json(TextResponse { text: result.text() }).into_response(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn form_fields_reach_the_engine_options() {
        let form = HashMap::from([
            ("language".to_string(), "en".to_string()),
            ("translate".to_string(), "true".to_string()),
            ("word_timestamps".to_string(), "true".to_string()),
        ]);
        let options = build_options(&form, false, false, Some("/tmp/vad.bin".to_string()));
        assert_eq!(options.language.as_deref(), Some("en"));
        assert!(options.translate);
        assert!(options.word_timestamps);
        assert_eq!(options.vad_model_path.as_deref(), Some("/tmp/vad.bin"));
    }

    fn gigaam() -> Option<(crate::engine::Engine, String, Vec<f32>)> {
        let model = std::env::var("GIGAAM_MODEL").ok()?;
        let vad = std::env::var("GIGAAM_VAD_MODEL").ok()?;
        let audio_path = std::env::var("GIGAAM_AUDIO").ok()?;
        if !std::path::Path::new(&model).exists() {
            return None;
        }
        let mut reader = hound::WavReader::open(audio_path).ok()?;
        let samples = reader
            .samples::<i16>()
            .map(|sample| sample.expect("audio sample") as f32 / 32768.0)
            .collect();
        let engine = crate::engine::Engine::load(&model, whisper_rs::ContextOptions::default()).ok()?;
        Some((engine, model, samples))
    }

    fn two_chunk_plan(duration: f64) -> Plan {
        let middle = duration / 2.0;
        Plan {
            chunks: vec![
                crate::plan::Chunk {
                    input_start: 0.0,
                    input_end: middle,
                    core_start: 0.0,
                    core_end: middle,
                    speakers: vec![1],
                },
                crate::plan::Chunk {
                    input_start: middle,
                    input_end: duration,
                    core_start: middle,
                    core_end: duration,
                    speakers: vec![2],
                },
            ],
            max_input_seconds: 25.0,
        }
    }

    #[test]
    fn a_cached_run_stores_every_chunk_and_repeats_identically() {
        let Some((mut engine, model_path, samples)) = gigaam() else {
            return;
        };
        let dir = tempfile::tempdir().unwrap();
        let plan = two_chunk_plan(samples.len() as f64 / crate::plan::SAMPLE_RATE);
        let options = build_options(&HashMap::new(), false, false, std::env::var("GIGAAM_VAD_MODEL").ok());
        let root = dir.path().to_str().unwrap();

        let first = transcribe_cached(
            &mut engine,
            &model_path,
            &samples,
            &plan,
            &options,
            root,
            serde_json::json!({"test": 1}),
        )
        .expect("first run");
        let second = transcribe_cached(
            &mut engine,
            &model_path,
            &samples,
            &plan,
            &options,
            root,
            serde_json::json!({"test": 1}),
        )
        .expect("second run");
        assert_eq!(first.text(), second.text());
        assert!(!first.segments.is_empty());
        let parts = std::fs::read_dir(dir.path().join(shortest_dir(dir.path())))
            .map(|entries| entries.filter_map(Result::ok).count())
            .unwrap_or(0);
        assert!(parts > 0, "the entry directory holds the stored files");
    }

    fn shortest_dir(root: &std::path::Path) -> std::path::PathBuf {
        std::fs::read_dir(root)
            .expect("cache root")
            .filter_map(Result::ok)
            .map(|entry| entry.file_name())
            .next()
            .expect("one entry")
            .into()
    }

    #[test]
    fn a_finished_chunk_is_reused_instead_of_transcribed() {
        let Some((mut engine, model_path, samples)) = gigaam() else {
            return;
        };
        let dir = tempfile::tempdir().unwrap();
        let plan = two_chunk_plan(samples.len() as f64 / crate::plan::SAMPLE_RATE);
        let options = build_options(&HashMap::new(), false, false, std::env::var("GIGAAM_VAD_MODEL").ok());
        let root = dir.path().to_str().unwrap();

        // A previous run finished both chunks; overwrite the first with a marker.
        transcribe_cached(
            &mut engine,
            &model_path,
            &samples,
            &plan,
            &options,
            root,
            serde_json::json!({}),
        )
        .expect("warm the cache");
        let entry = dir.path().join(shortest_dir(dir.path()));
        let marker = vec![StoredSegment {
            start: 0,
            end: 100,
            text: "cached marker".to_string(),
            no_speech_prob: 0.0,
        }];
        std::fs::write(
            entry.join("parts").join("part-000000.json"),
            serde_json::to_vec(&marker).unwrap(),
        )
        .unwrap();

        let result = transcribe_cached(
            &mut engine,
            &model_path,
            &samples,
            &plan,
            &options,
            root,
            serde_json::json!({}),
        )
        .expect("resumed run");
        assert_eq!(result.segments[0].text, "cached marker");
    }

    #[test]
    fn a_chunk_duration_above_the_engine_maximum_is_rejected() {
        let message = chunk_seconds_error(Some(30.0), Some(25.0)).expect("rejected");
        assert!(message.contains("25"), "{message}");
        assert!(chunk_seconds_error(Some(20.0), Some(25.0)).is_none());
        // Whisper advertises no bound, so nothing to validate against.
        assert!(chunk_seconds_error(Some(30.0), None).is_none());
        assert!(chunk_seconds_error(None, Some(25.0)).is_none());
    }

    #[test]
    fn stable_timestamps_flag_is_carried_into_options() {
        let options = build_options(&HashMap::new(), false, true, None);
        assert!(options.stable_timestamps);
        assert!(options.language.is_none());
        assert!(!options.translate);
    }
}
