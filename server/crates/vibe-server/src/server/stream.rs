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

/// The NDJSON event for one segment. A planned chunk supplies the speaker set
/// and names its dominant speaker; without one, speakers come from overlap.
fn segment_event(
    segment: &whisper_rs::Segment,
    plan: Option<&crate::plan::Plan>,
    diarization: &[diarization::Segment],
) -> serde_json::Value {
    let start = format::cs_to_seconds(segment.start);
    let end = format::cs_to_seconds(segment.end);
    let mut event = serde_json::json!({
        "type": "segment",
        "start": start,
        "end": end,
        "text": segment.text,
        "no_speech_prob": segment.no_speech_prob,
    });
    let planned = plan
        .and_then(|plan| format::planned_chunk(plan, start, end))
        .filter(|chunk| !chunk.speakers.is_empty());
    match planned {
        Some(chunk) => {
            if let Some(speaker) = format::dominant_speaker(chunk, diarization) {
                event["speaker"] = serde_json::json!(speaker);
            }
            event["speakers"] = serde_json::json!(chunk.speakers);
        }
        None => {
            if let Some(speaker) = format::match_speaker(start, end, diarization) {
                event["speaker"] = serde_json::json!(speaker);
            }
        }
    }
    event
}

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
                let event = segment_event(&segment, segment_plan.as_ref(), &segment_diar_segments);
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::plan::{Chunk, Plan};

    fn segment(start: i64, end: i64) -> whisper_rs::Segment {
        whisper_rs::Segment {
            start,
            end,
            text: "hello".to_string(),
            no_speech_prob: 0.0,
        }
    }

    fn turn(start: f64, end: f64, speaker_id: usize) -> diarization::Segment {
        diarization::Segment { start, end, speaker_id }
    }

    fn plan(speakers: Vec<u16>) -> Plan {
        Plan {
            chunks: vec![Chunk {
                input_start: 10.0,
                input_end: 20.0,
                core_start: 10.0,
                core_end: 20.0,
                speakers,
            }],
            max_input_seconds: 30.0,
        }
    }

    #[test]
    fn a_boundary_event_names_the_dominant_speaker_and_the_whole_set() {
        let plan = plan(vec![1, 2]);
        let diarization = [turn(10.0, 11.0, 1), turn(14.0, 19.0, 2)];
        let event = segment_event(&segment(1500, 1900), Some(&plan), &diarization);

        assert_eq!(event["speaker"], 2);
        assert_eq!(event["speakers"], serde_json::json!([1, 2]));
    }

    #[test]
    fn a_single_speaker_event_is_unchanged() {
        let plan = plan(vec![1]);
        let diarization = [turn(10.0, 11.0, 1)];
        let event = segment_event(&segment(1500, 1900), Some(&plan), &diarization);

        assert_eq!(event["speaker"], 1);
        assert_eq!(event["speakers"], serde_json::json!([1]));
    }

    #[test]
    fn without_a_plan_the_event_keeps_overlap_attribution() {
        let diarization = [turn(15.0, 19.0, 3)];
        let event = segment_event(&segment(1500, 1900), None, &diarization);

        assert_eq!(event["speaker"], 3);
        assert!(event.get("speakers").is_none());
    }

    #[test]
    fn an_unattributed_chunk_leaves_the_event_unplanned() {
        let plan = plan(Vec::new());
        let diarization = [turn(15.0, 19.0, 3)];
        let event = segment_event(&segment(1500, 1900), Some(&plan), &diarization);

        assert_eq!(event["speaker"], 3);
        assert!(event.get("speakers").is_none());
    }
}
