use std::collections::HashMap;

use axum::http::{header, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::Json;
use whisper_rs::TranscribeOptions;

use crate::audio;
use crate::cli::AppConfig;
use crate::server::diarization;
use crate::server::form::FormValues;
use crate::server::stream::{stream_transcription, StreamRequest};
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
) -> Result<Response, Box<Response>> {
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
            return Err(Box::new(error(StatusCode::BAD_REQUEST, "invalid_request", &message)));
        }
    }
    let audio_options = audio::ReadOptions {
        enhance_audio,
        verbose: config.verbose(),
    };
    let samples = audio::read_bytes_with_options(file, audio_options).map_err(|err| {
        Box::new(error(
            StatusCode::BAD_REQUEST,
            "invalid_audio",
            &format!("invalid audio file: {err}"),
        ))
    })?;

    let diar_segments = diarize_model
        .as_deref()
        .map_or_else(Vec::new, |model_path| diarization::diarize(model_path, &samples));

    if stable_timestamps && vad_model_path.is_none() {
        return Err(Box::new(error(
            StatusCode::BAD_REQUEST,
            "invalid_request",
            "'vad_model' is required when 'stable_timestamps' is true",
        )));
    }

    if let Some(ctx) = model.ctx.as_ref() {
        let options = build_options(&form, config.verbose(), stable_timestamps, vad_model_path.clone());
        if let Err(err) = ctx.validate_request(&options) {
            return Err(Box::new(error(
                super::engine_error_status(&err),
                super::engine_error_code(&err),
                &err.to_string(),
            )));
        }
    }

    if stream {
        let plan = model
            .ctx
            .as_mut()
            .and_then(|ctx| plan_for(ctx, &samples, &diar_segments, vad_model_path.as_deref(), chunk_seconds));
        let request = StreamRequest {
            config,
            model,
            samples,
            form,
            stable_timestamps,
            vad_model_path,
            diar_segments,
            plan,
        };
        return stream_transcription(request);
    }

    let verbose = config.verbose();
    let model_path = model.model_path.clone();
    let ctx = model
        .ctx
        .as_mut()
        .ok_or_else(|| Box::new(error(StatusCode::SERVICE_UNAVAILABLE, "no_model", "no model loaded")))?;

    if ctx.requires_vad() && vad_model_path.is_none() {
        return Err(Box::new(error(
            StatusCode::BAD_REQUEST,
            "invalid_request",
            "'vad_model' is required for this transcription engine",
        )));
    }

    let opts = build_options(&form, verbose, stable_timestamps, vad_model_path.clone());
    let plan = plan_for(ctx, &samples, &diar_segments, vad_model_path.as_deref(), chunk_seconds);
    let result = match (plan.as_ref(), config.cache_dir()) {
        (Some(plan), Some(root)) => super::chunk_cache::transcribe_cached(ctx, &model_path, &samples, plan, &opts, root),
        (Some(plan), None) => ctx.transcribe_chunks(&samples, plan, opts),
        (None, _) => ctx.transcribe(&samples, opts),
    }
    .map_err(|err| {
        tracing::error!(samples = samples.len(), "transcription failed: {err:#}");
        Box::new(error(
            super::engine_error_status(&err),
            super::engine_error_code(&err),
            &format!("transcription failed: {err}"),
        ))
    })?;

    Ok(format_response(&response_format, &result, &diar_segments, plan.as_ref()))
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

/// Build the chunk plan when the engine accepts explicit chunks. A plan exists
/// for every bounded engine with or without diarization turns: without turns,
/// each detected speech range becomes its own chunk with an empty speaker set
/// and speakers stay attributed by overlap. Engines without a bound (whisper)
/// keep their own internal long-form path and are never planned.
pub(crate) fn plan_for(
    ctx: &mut Engine,
    samples: &[f32],
    diar_segments: &[diarization::Segment],
    vad_model_path: Option<&str>,
    chunk_seconds: Option<f64>,
) -> Option<Plan> {
    let maximum = ctx.max_input_seconds()?;
    let speech = match ctx.speech_ranges(samples, vad_model_path) {
        Ok(ranges) => ranges,
        Err(err) => {
            tracing::warn!("skipping chunk planning: {err:#}");
            return None;
        }
    };
    let duration = samples.len() as f64 / plan::SAMPLE_RATE;
    Some(build_plan(duration, diar_segments, &speech, chunk_seconds, maximum))
}

fn build_plan(
    duration: f64,
    diar_segments: &[diarization::Segment],
    speech: &[(f64, f64)],
    chunk_seconds: Option<f64>,
    maximum: f64,
) -> Plan {
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
    plan::plan(duration, &turns, speech, settings)
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
    plan: Option<&Plan>,
) -> Response {
    match response_format {
        "verbose_json" => Json(format::build_verbose_json(result, diar_segments, plan)).into_response(),
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

    #[test]
    fn a_bounded_engine_plans_from_speech_without_diarization() {
        let speech = vec![(0.0, 9.9), (10.5, 19.4), (25.0, 40.0)];
        let plan = build_plan(60.0, &[], &speech, None, 25.0);
        assert!(!plan.chunks.is_empty(), "speech is planned, not dropped");
        for chunk in &plan.chunks {
            assert!(chunk.core_end - chunk.core_start <= 25.0 + f64::EPSILON, "chunk over the bound: {chunk:?}");
            assert!(chunk.speakers.is_empty(), "unattributed chunk carries no speakers: {chunk:?}");
        }
    }

    #[test]
    fn a_custom_bound_still_plans_without_diarization() {
        let speech = vec![(0.0, 30.0)];
        let plan = build_plan(30.0, &[], &speech, Some(10.0), 25.0);
        for chunk in &plan.chunks {
            assert!(chunk.core_end - chunk.core_start <= 10.0 + f64::EPSILON, "custom bound ignored: {chunk:?}");
        }
    }
}
