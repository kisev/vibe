use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use axum::body::Body;
use axum::http::{header, StatusCode};
use axum::response::{IntoResponse, Response};
use tokio_stream::wrappers::UnboundedReceiverStream;
use whisper_rs::StreamCallbacks;

use crate::cli::AppConfig;
use crate::server::diarization;
use crate::server::transcription::build_options;
use crate::server::unload_timeout::ModelLease;
use crate::server::{error, format};

pub(super) fn stream_transcription(
    config: AppConfig,
    mut model: ModelLease,
    samples: Vec<f32>,
    form: HashMap<String, String>,
    stable_timestamps: bool,
    vad_model_path: Option<String>,
    diar_segments: Vec<diarization::Segment>,
    plan: Option<crate::plan::Plan>,
) -> Result<Response, Box<Response>> {
    if model.ctx.is_none() {
        return Err(Box::new(error(
            StatusCode::SERVICE_UNAVAILABLE,
            "no_model",
            "no model loaded",
        )));
    }
    if model.ctx.as_ref().is_some_and(|ctx| ctx.requires_vad()) && vad_model_path.is_none() {
        return Err(Box::new(error(
            StatusCode::BAD_REQUEST,
            "invalid_request",
            "'vad_model' is required for this transcription engine",
        )));
    }

    let opts = build_options(&form, config.verbose(), stable_timestamps, vad_model_path);
    let (tx, rx) = tokio::sync::mpsc::unbounded_channel::<Result<bytes::Bytes, std::convert::Infallible>>();
    let aborted = Arc::new(AtomicBool::new(false));
    let abort_for_progress = Arc::clone(&aborted);
    let abort_for_segment = Arc::clone(&aborted);
    let abort_for_poll = Arc::clone(&aborted);
    let progress_tx = tx.clone();
    let segment_tx = tx.clone();
    let final_tx = tx.clone();
    let segment_diar_segments = diar_segments.clone();
    let segment_plan = plan.clone();

    tokio::task::spawn_blocking(move || {
        let Some(ctx) = model.ctx.as_mut() else {
            let _ = send_event(
                &final_tx,
                serde_json::json!({
                    "type": "error",
                    "message": "no model loaded",
                }),
            );
            return;
        };

        let callbacks = StreamCallbacks {
            on_progress: Some(Box::new(move |progress| {
                if send_event(
                    &progress_tx,
                    serde_json::json!({
                        "type": "progress",
                        "progress": progress,
                    }),
                )
                .is_err()
                {
                    abort_for_progress.store(true, Ordering::SeqCst);
                }
            })),
            on_segment: Some(Box::new(move |segment| {
                let start = format::cs_to_seconds(segment.start);
                let end = format::cs_to_seconds(segment.end);
                let mut event = serde_json::json!({
                    "type": "segment",
                    "start": start,
                    "end": end,
                    "text": segment.text,
                    "no_speech_prob": segment.no_speech_prob,
                });
                let planned = segment_plan.as_ref().map(|plan| {
                    let middle = (start + end) / 2.0;
                    plan.chunks
                        .iter()
                        .find(|chunk| middle >= chunk.core_start && middle <= chunk.core_end)
                        .map_or_else(Vec::new, |chunk| chunk.speakers.clone())
                });
                match planned.filter(|set| !set.is_empty()) {
                    Some(set) => {
                        event["speaker"] = serde_json::json!(set[0]);
                        event["speakers"] = serde_json::json!(set);
                    }
                    None => {
                        if let Some(speaker) = format::match_speaker(start, end, &segment_diar_segments) {
                            event["speaker"] = serde_json::json!(speaker);
                        }
                    }
                }
                if send_event(&segment_tx, event).is_err() {
                    abort_for_segment.store(true, Ordering::SeqCst);
                }
            })),
            should_abort: Some(Box::new(move || {
                abort_for_poll.load(Ordering::SeqCst) || final_tx.is_closed()
            })),
        };
        let result = match plan.as_ref() {
            Some(plan) => {
                let ranges = crate::engine::chunk_ranges(plan, samples.len());
                ctx.transcribe_chunks_with(&samples, &ranges, opts, callbacks)
            }
            None => ctx.transcribe_stream(&samples, opts, callbacks),
        };

        match result {
            Ok(result) => {
                let _ = send_event(
                    &tx,
                    serde_json::json!({
                        "type": "result",
                        "text": result.text(),
                    }),
                );
            }
            Err(err) => {
                tracing::error!("streaming transcription failed: {err:#}");
                if tx.is_closed() {
                    return;
                }
                let _ = send_event(
                    &tx,
                    serde_json::json!({
                        "type": "error",
                        "code": crate::server::engine_error_code(&err),
                        "message": err.to_string(),
                    }),
                );
            }
        }
    });

    let stream = UnboundedReceiverStream::new(rx);
    Ok((
        StatusCode::OK,
        [
            (header::CONTENT_TYPE, "application/x-ndjson"),
            (header::CACHE_CONTROL, "no-cache"),
            (header::CONNECTION, "keep-alive"),
        ],
        Body::from_stream(stream),
    )
        .into_response())
}

fn send_event(
    tx: &tokio::sync::mpsc::UnboundedSender<Result<bytes::Bytes, std::convert::Infallible>>,
    value: serde_json::Value,
) -> Result<(), ()> {
    let mut line = serde_json::to_vec(&value).map_err(|_| ())?;
    line.push(b'\n');
    tx.send(Ok(bytes::Bytes::from(line))).map_err(|_| ())
}
