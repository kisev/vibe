//! Tests for the engine integration.
//!
//! Model-gated tests run when `GIGAAM_MODEL` points at a GGUF; VAD and audio
//! tests additionally need `GIGAAM_VAD_MODEL` and `GIGAAM_AUDIO`.

use std::sync::{Arc, Mutex};

use super::*;

fn gigaam_model() -> Option<String> {
    std::env::var("GIGAAM_MODEL")
        .ok()
        .filter(|path| std::path::Path::new(path).exists())
}

fn whisper_engine() -> Option<Engine> {
    let path = std::env::var("WHISPER_MODEL").ok()?;
    if !std::path::Path::new(&path).exists() {
        return None;
    }
    Some(Engine::load(&path, ContextOptions::default()).expect("load Whisper model"))
}

fn parakeet_engine() -> Option<Engine> {
    let path = std::env::var("PARAKEET_MODEL").ok()?;
    if !std::path::Path::new(&path).exists() {
        return None;
    }
    Some(Engine::load(&path, ContextOptions::default()).expect("load Parakeet model"))
}

fn nemotron_engine() -> Option<Engine> {
    let path = std::env::var("NEMOTRON_MODEL").ok()?;
    if !std::path::Path::new(&path).exists() {
        return None;
    }
    Some(Engine::load(&path, ContextOptions::default()).expect("load Nemotron model"))
}

fn vad_model() -> Option<String> {
    std::env::var("GIGAAM_VAD_MODEL")
        .ok()
        .filter(|path| std::path::Path::new(path).exists())
}

fn audio() -> Option<Vec<f32>> {
    let path = std::env::var("GIGAAM_AUDIO").ok()?;
    let mut reader = hound::WavReader::open(path).ok()?;
    Some(
        reader
            .samples::<i16>()
            .map(|sample| sample.expect("audio sample") as f32 / 32768.0)
            .collect(),
    )
}

fn gigaam_engine() -> Option<Engine> {
    let path = gigaam_model()?;
    Some(Engine::load(&path, ContextOptions::default()).expect("load GigaAM model"))
}

fn transcription_options(vad_model_path: Option<String>) -> TranscribeOptions {
    TranscribeOptions {
        vad_model_path,
        ..TranscribeOptions::default()
    }
}

/// GigaAM token timestamps land on 40 ms encoder frames, so every emitted
/// segment must sit on a 4-centisecond boundary and have a real span.
fn assert_timestamped(segments: &[Segment]) {
    assert!(!segments.is_empty(), "expected at least one segment");
    for segment in segments {
        assert!(!segment.text.is_empty(), "empty segment text: {segment:?}");
        assert!(segment.start >= 0, "negative start: {segment:?}");
        assert!(segment.start < segment.end, "empty span: {segment:?}");
        assert_eq!(
            segment.start % GIGAAM_CENTISECONDS_PER_FRAME,
            0,
            "start is not on a 40 ms frame: {segment:?}"
        );
        assert_eq!(
            segment.end % GIGAAM_CENTISECONDS_PER_FRAME,
            0,
            "end is not on a 40 ms frame: {segment:?}"
        );
    }
}

#[test]
fn gigaam_vad_options_cap_chunks_below_its_window() {
    let options = gigaam_vad_options();
    assert_eq!(options.max_chunk_ms, 24_000);
    assert_eq!(options.overlap_ms, 0);
    assert!(options.max_chunk_ms < 25_000);

    // Parakeet and Nemotron pass `vad_rs::Options::default()` straight
    // through; Whisper only builds a VAD for stable timestamps. Neither
    // reaches the GigaAM cap.
    let default = vad_rs::Options::default();
    assert_eq!(default.max_chunk_ms, 30_000);
    assert_ne!(options, default);
}

#[test]
fn vad_cache_is_keyed_by_path_and_options() {
    let Some(vad_path) = vad_model() else { return };
    let mut cache = None;

    let vad = engine_vad(&mut cache, Some(&vad_path), gigaam_vad_options(), "GigaAM").expect("load VAD");
    assert_eq!(vad.options(), gigaam_vad_options());
    assert_eq!(cache.as_ref().expect("cached VAD").path, vad_path);

    // Same path and options keep the loaded instance.
    engine_vad(&mut cache, Some(&vad_path), gigaam_vad_options(), "GigaAM").expect("reuse VAD");
    assert_eq!(cache.as_ref().expect("cached VAD").options, gigaam_vad_options());

    // Different options reload with the requested option set.
    engine_vad(&mut cache, Some(&vad_path), vad_rs::Options::default(), "GigaAM").expect("reload VAD");
    assert_eq!(cache.as_ref().expect("cached VAD").options, vad_rs::Options::default());

    // Different path reloads as well.
    let directory = tempfile::tempdir().expect("temp dir");
    let copied_path = directory.path().join("vad.bin");
    std::fs::copy(&vad_path, &copied_path).expect("copy VAD model");
    let copied_path = copied_path.to_string_lossy().into_owned();
    engine_vad(&mut cache, Some(&copied_path), vad_rs::Options::default(), "GigaAM").expect("reload VAD");
    assert_eq!(cache.as_ref().expect("cached VAD").path, copied_path);
}

#[test]
fn gigaam_vad_never_returns_a_chunk_over_the_bound() {
    let (Some(vad_path), Some(samples)) = (vad_model(), audio()) else {
        return;
    };
    // Repeat a real utterance until it is longer than two GigaAM windows,
    // so the VAD has to split it instead of returning it whole.
    let long = samples
        .iter()
        .copied()
        .cycle()
        .take(vad_rs::SAMPLE_RATE * 60)
        .collect::<Vec<_>>();
    let mut vad = vad_rs::Vad::new(&vad_path, gigaam_vad_options()).expect("load VAD");
    let segments = vad.segments(&long).expect("VAD segments");

    assert!(!segments.is_empty(), "expected detected speech");
    let bound = gigaam_vad_options().max_chunk_ms as usize * vad_rs::SAMPLE_RATE / 1000;
    for segment in segments {
        assert!(
            segment.end_sample - segment.start_sample <= bound,
            "chunk of {} samples exceeds the {bound}-sample bound",
            segment.end_sample - segment.start_sample
        );
    }
}

#[test]
fn gigaam_rejects_unsupported_options_but_ignores_word_timestamps() {
    let base = TranscribeOptions::default();
    let rejected = [
        (
            TranscribeOptions {
                translate: true,
                ..base.clone()
            },
            "translation",
        ),
        (
            TranscribeOptions {
                prompt: Some("prompt".to_string()),
                ..base.clone()
            },
            "text prompts",
        ),
        (
            TranscribeOptions {
                stable_timestamps: true,
                ..base.clone()
            },
            "stable timestamps",
        ),
    ];
    for (options, needle) in rejected {
        let err = validate_gigaam_options(&options).expect_err(needle);
        assert!(err.to_string().contains(needle), "{err}");
    }

    let word_timestamps = TranscribeOptions {
        word_timestamps: true,
        ..base
    };
    assert!(validate_gigaam_options(&word_timestamps).is_ok());
}

#[test]
fn unsupported_gguf_is_rejected_by_architecture_name() {
    let directory = std::env::temp_dir().join("vibe-engine-tests");
    std::fs::create_dir_all(&directory).unwrap();
    let path = directory.join("whisper.gguf");
    // A GGUF header with one key and no tensors; enough to name the architecture.
    let mut bytes = Vec::new();
    bytes.extend_from_slice(b"GGUF\x03\x00\x00\x00");
    bytes.extend_from_slice(&0u64.to_le_bytes());
    bytes.extend_from_slice(&1u64.to_le_bytes());
    let key = b"general.architecture";
    bytes.extend_from_slice(&(key.len() as u64).to_le_bytes());
    bytes.extend_from_slice(key);
    bytes.extend_from_slice(&8u32.to_le_bytes());
    let value = b"whisper";
    bytes.extend_from_slice(&(value.len() as u64).to_le_bytes());
    bytes.extend_from_slice(value);
    std::fs::write(&path, bytes).unwrap();

    let error = detect_model(path.to_str().unwrap()).expect_err("whisper is not a supported GGUF");
    assert!(error.to_string().contains("'whisper'"), "{error}");
    std::fs::remove_file(&path).ok();
}

#[test]
fn probe_and_load_report_the_same_capabilities() {
    let Some(path) = gigaam_model() else { return };
    let probed = detect_model(&path).expect("metadata probe");
    assert_eq!(probed.engine, "gigaam");
    assert_eq!(probed.languages, vec!["ru".to_string()]);
    assert!(probed.requires_vad);
    assert!(!probed.language_detection);
    assert!(!probed.streaming);
    assert!(!probed.translation);
    assert!(probed.timestamps);
    assert!(!probed.text_prompts);
    assert_eq!(probed.max_input_seconds, Some(25.0), "GigaAM's window");

    let loaded = gigaam_engine().expect("load GigaAM model").capabilities();
    assert_eq!(loaded.engine, probed.engine);
    assert_eq!(loaded.requires_vad, probed.requires_vad);
    assert_eq!(loaded.languages, probed.languages);
    assert_eq!(loaded.language_detection, probed.language_detection);
    assert_eq!(loaded.streaming, probed.streaming);
    assert_eq!(loaded.translation, probed.translation);
    assert_eq!(loaded.timestamps, probed.timestamps);
    assert_eq!(loaded.text_prompts, probed.text_prompts);
    assert_eq!(loaded.max_input_seconds, probed.max_input_seconds);
}

/// The plan path must produce the same transcript as the engine's own VAD loop
/// when the plan is one chunk covering the whole recording.
fn assert_chunk_path_matches(engine: &mut Engine, vad: String, samples: &[f32]) {
    let from_vad = engine
        .transcribe(samples, transcription_options(Some(vad.clone())))
        .expect("VAD path");
    let duration = samples.len() as f64 / crate::plan::SAMPLE_RATE;
    let plan = crate::plan::Plan {
        chunks: vec![crate::plan::Chunk {
            input_start: 0.0,
            input_end: duration,
            core_start: 0.0,
            core_end: duration,
            speakers: vec![1],
        }],
        max_input_seconds: 30.0,
    };
    let from_plan = engine
        .transcribe_chunks(samples, &plan, transcription_options(Some(vad)))
        .expect("plan path");
    assert_eq!(from_vad.text(), from_plan.text());
}

#[test]
fn whisper_is_never_planned() {
    let (Some(mut engine), Some(samples)) = (whisper_engine(), audio()) else {
        return;
    };
    assert_eq!(engine.max_input_seconds(), None, "no external bound");
    let diar = [crate::server::diarization::Segment {
        start: 0.0,
        end: 2.0,
        speaker_id: 1,
    }];
    // Even with diarization present, Whisper keeps its internal long-form path.
    assert!(crate::server::transcription::plan_for(&mut engine, &samples, &diar, None, None).is_none());
    // And without diarization there is nothing to plan for it either.
    assert!(crate::server::transcription::plan_for(&mut engine, &samples, &[], None, None).is_none());
    assert!(engine
        .transcribe_chunks(
            &samples,
            &crate::plan::Plan {
                chunks: Vec::new(),
                max_input_seconds: 30.0
            },
            transcription_options(None)
        )
        .is_err());
}

/// Planning is not diarization-only: a bounded engine plans from detected
/// speech alone, so caching and resume apply to plain runs too.
#[test]
fn gigaam_plans_without_diarization() {
    let (Some(mut engine), Some(vad), Some(samples)) = (gigaam_engine(), vad_model(), audio()) else {
        return;
    };
    let bound = engine.max_input_seconds().expect("GigaAM is bounded");
    let plan = crate::server::transcription::plan_for(&mut engine, &samples, &[], Some(&vad), None)
        .expect("a plan without diarization");
    assert!(!plan.chunks.is_empty(), "speech is planned");
    for chunk in &plan.chunks {
        assert!(chunk.core_end - chunk.core_start <= bound + f64::EPSILON, "chunk over the bound: {chunk:?}");
        assert!(chunk.speakers.is_empty(), "no speakers without diarization: {chunk:?}");
    }
}

#[test]
fn parakeet_chunk_path_matches_the_vad_path() {
    let (Some(mut engine), Some(vad), Some(samples)) = (parakeet_engine(), vad_model(), audio()) else {
        return;
    };
    assert_chunk_path_matches(&mut engine, vad, &samples);
}

#[test]
fn nemotron_chunk_path_matches_the_vad_path() {
    let (Some(mut engine), Some(vad), Some(samples)) = (nemotron_engine(), vad_model(), audio()) else {
        return;
    };
    assert_chunk_path_matches(&mut engine, vad, &samples);
}

#[test]
fn gigaam_chunk_path_matches_the_vad_path() {
    let (Some(mut engine), Some(vad), Some(samples)) = (gigaam_engine(), vad_model(), audio()) else {
        return;
    };
    let from_vad = engine
        .transcribe(&samples, transcription_options(Some(vad.clone())))
        .expect("VAD path");

    let duration = samples.len() as f64 / crate::plan::SAMPLE_RATE;
    let plan = crate::plan::Plan {
        chunks: vec![crate::plan::Chunk {
            input_start: 0.0,
            input_end: duration,
            core_start: 0.0,
            core_end: duration,
            speakers: vec![1],
        }],
        max_input_seconds: 25.0,
    };
    let from_plan = engine
        .transcribe_chunks(&samples, &plan, transcription_options(Some(vad)))
        .expect("plan path");
    assert_eq!(from_vad.text(), from_plan.text());
}

#[test]
fn chunk_ranges_follow_the_plan_and_clip_to_the_audio() {
    use crate::plan::{Chunk, Plan};
    let plan = Plan {
        chunks: vec![
            Chunk {
                input_start: 0.0,
                input_end: 1.0,
                core_start: 0.0,
                core_end: 0.8,
                speakers: vec![1],
            },
            Chunk {
                input_start: 1.0,
                input_end: 2.0,
                core_start: 1.0,
                core_end: 2.0,
                speakers: vec![2],
            },
            Chunk {
                input_start: 2.0,
                input_end: 5.0,
                core_start: 2.0,
                core_end: 2.5,
                speakers: vec![2],
            },
        ],
        max_input_seconds: 25.0,
    };
    // 2.5 seconds of audio: the last chunk is clipped, not dropped.
    let ranges = chunk_ranges(&plan, 40_000);
    assert_eq!(ranges, vec![(0, 16_000), (16_000, 32_000), (32_000, 40_000)]);
    // With no audio left, a chunk produces nothing.
    assert_eq!(chunk_ranges(&plan, 32_000).len(), 2);
}

#[test]
fn engines_report_their_input_bound() {
    // Whisper owns its long-form path, so it advertises no external bound.
    assert_eq!(whisper_capabilities().max_input_seconds, None);
    let parakeet = parakeet_capabilities(vec!["en".to_string()], true);
    let nemotron = nemotron_capabilities(vec!["en".to_string()], true);
    assert_eq!(parakeet.max_input_seconds, Some(30.0));
    assert_eq!(nemotron.max_input_seconds, Some(30.0));
    assert_eq!(parakeet.engine, "parakeet");
    assert_eq!(nemotron.engine, "nemotron");
}

#[test]
fn gigaam_request_contract_and_segments() {
    let (Some(mut engine), Some(vad_path), Some(samples)) = (gigaam_engine(), vad_model(), audio()) else {
        return;
    };
    assert_eq!(engine.capabilities().engine, "gigaam");
    assert!(engine.requires_vad());

    // Missing VAD is refused before inference starts.
    let err = engine
        .transcribe(&samples, transcription_options(None))
        .expect_err("VAD is required");
    assert!(err.to_string().contains("vad_model_path is required for GigaAM"), "{err}");

    // Russian, auto, and an omitted language are accepted; anything else
    // is an `unsupported_language` error that maps to HTTP 400.
    let accepted = [None, Some("ru".to_string()), Some("auto".to_string()), Some(String::new())];
    for language in accepted {
        let options = TranscribeOptions {
            language,
            ..transcription_options(Some(vad_path.clone()))
        };
        engine.validate_request(&options).expect("Russian is accepted");
    }
    for language in ["en", "de", "ru-RU"] {
        let options = TranscribeOptions {
            language: Some(language.to_string()),
            ..transcription_options(Some(vad_path.clone()))
        };
        let err = engine.validate_request(&options).expect_err("language is not supported");
        assert_eq!(crate::server::engine_error_code(&err), "unsupported_language");
        assert_eq!(crate::server::engine_error_status(&err), axum::http::StatusCode::BAD_REQUEST);
        assert!(matches!(
            err.downcast_ref::<gigaam_rs::Error>(),
            Some(gigaam_rs::Error::UnsupportedLanguage(_))
        ));
    }

    // The request gate rejects the same options as the engine.
    for options in [
        TranscribeOptions {
            translate: true,
            ..transcription_options(Some(vad_path.clone()))
        },
        TranscribeOptions {
            prompt: Some("prompt".to_string()),
            ..transcription_options(Some(vad_path.clone()))
        },
        TranscribeOptions {
            stable_timestamps: true,
            ..transcription_options(Some(vad_path.clone()))
        },
    ] {
        engine.validate_request(&options).expect_err("option is not supported");
    }

    // Word timestamps are ignored; the result still carries segment times.
    let result = engine
        .transcribe(
            &samples,
            TranscribeOptions {
                word_timestamps: true,
                ..transcription_options(Some(vad_path))
            },
        )
        .expect("transcribe GigaAM");
    assert_timestamped(&result.segments);
    if let Ok(expected) = std::env::var("GIGAAM_EXPECTED") {
        let text = result.text().to_lowercase();
        assert!(
            text.contains(&expected.to_lowercase()),
            "expected {expected:?}, got {:?}",
            result.text()
        );
    }
}

#[test]
fn gigaam_streaming_contract() {
    let (Some(mut engine), Some(vad_path), Some(samples)) = (gigaam_engine(), vad_model(), audio()) else {
        return;
    };

    // An unsupported language is rejected before the first event, so a
    // streaming request cannot leak a partial transcript.
    let emitted = Arc::new(Mutex::new(0usize));
    let counter = Arc::clone(&emitted);
    let err = engine
        .transcribe_stream(
            &samples,
            TranscribeOptions {
                language: Some("en".to_string()),
                ..transcription_options(Some(vad_path.clone()))
            },
            StreamCallbacks {
                on_progress: Some(Box::new(|_| {})),
                on_segment: Some(Box::new(move |_| {
                    *counter.lock().expect("counter") += 1;
                })),
                should_abort: None,
            },
        )
        .expect_err("unsupported language");
    assert_eq!(crate::server::engine_error_code(&err), "unsupported_language");
    assert_eq!(*emitted.lock().expect("counter"), 0);

    // A Russian stream emits every timestamped segment the final result
    // reports, which is what the NDJSON endpoint serializes.
    let streamed = Arc::new(Mutex::new(Vec::new()));
    let collect = Arc::clone(&streamed);
    let result = engine
        .transcribe_stream(
            &samples,
            transcription_options(Some(vad_path)),
            StreamCallbacks {
                on_progress: Some(Box::new(|_| {})),
                on_segment: Some(Box::new(move |segment| {
                    collect.lock().expect("segments").push(segment);
                })),
                should_abort: None,
            },
        )
        .expect("stream GigaAM");
    let streamed = streamed.lock().expect("segments");
    assert_eq!(streamed.len(), result.segments.len());
    assert_timestamped(streamed.as_slice());
    assert_timestamped(&result.segments);
    for (streamed, final_segment) in streamed.iter().zip(&result.segments) {
        assert_eq!(streamed.start, final_segment.start);
        assert_eq!(streamed.end, final_segment.end);
        assert_eq!(streamed.text, final_segment.text);
    }
}

/// The Whisper-only gates clients derive from capability flags, never from the engine name.
#[test]
fn capability_flags_name_the_whisper_only_features() {
    let whisper = whisper_capabilities();
    assert!(whisper.stable_timestamps);
    assert!(whisper.decoding_options);

    let nemotron = nemotron_capabilities(vec!["en".to_string()], false);
    assert!(!nemotron.stable_timestamps);
    assert!(!nemotron.decoding_options);

    let parakeet = parakeet_capabilities(vec!["en".to_string()], false);
    assert!(!parakeet.stable_timestamps);
    assert!(!parakeet.decoding_options);

    let info = gigaam_rs::ModelInfo {
        architecture: "conformer".to_string(),
        variant: "v3".to_string(),
        head_kind: "rotary".to_string(),
        languages: vec!["ru".to_string()],
        language_detection: false,
        tensor_count: 0,
        encoder_layers: 0,
        encoder_dimension: 0,
        encoder_heads: 0,
        encoder_d_ff: 0,
        encoder_conv_kernel: 0,
        subsampling_factor: 0,
        subs_kernel_size: 0,
        pos_emb_base: 0,
        frontend: Default::default(),
        predictor_hidden: 0,
        predictor_layers: 0,
        joint_hidden: 0,
        classes: 0,
        max_input_seconds: 25.0,
    };
    let gigaam = gigaam_capabilities(&info);
    assert!(!gigaam.stable_timestamps);
    assert!(!gigaam.decoding_options);
}
