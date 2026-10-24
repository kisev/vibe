//! Tests for the unified engine.
//!
//! Model-gated tests run when `GIGAAM_MODEL` (or `PARAKEET_MODEL`,
//! `NEMOTRON_MODEL`, `WHISPER_MODEL` — a GGUF whisper build) points at a
//! GGUF; VAD and audio tests additionally need `GIGAAM_VAD_MODEL` and
//! `GIGAAM_AUDIO`.

use super::*;

fn env_model(name: &str) -> Option<String> {
    std::env::var(name).ok().filter(|path| std::path::Path::new(path).exists())
}

fn gigaam_model() -> Option<String> {
    env_model("GIGAAM_MODEL")
}

fn load_engine(path: &str) -> Option<Engine> {
    Some(match Engine::load(path, ContextOptions::default()) {
        Ok(engine) => engine,
        Err(err) => panic!("load {path}: {err:#}"),
    })
}

fn whisper_engine() -> Option<Engine> {
    load_engine(&env_model("WHISPER_MODEL")?)
}

fn parakeet_engine() -> Option<Engine> {
    load_engine(&env_model("PARAKEET_MODEL")?)
}

fn nemotron_engine() -> Option<Engine> {
    load_engine(&env_model("NEMOTRON_MODEL")?)
}

fn gigaam_engine() -> Option<Engine> {
    load_engine(&gigaam_model()?)
}

fn vad_model() -> Option<String> {
    env_model("GIGAAM_VAD_MODEL")
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

fn transcription_options(vad_model_path: Option<String>) -> TranscribeOptions {
    TranscribeOptions {
        vad_model_path,
        ..TranscribeOptions::default()
    }
}

/// Every emitted segment must have text and a real, non-negative span.
fn assert_timestamped(segments: &[Segment]) {
    assert!(!segments.is_empty(), "expected at least one segment");
    for segment in segments {
        assert!(!segment.text.is_empty(), "empty segment text: {segment:?}");
        assert!(segment.start >= 0, "negative start: {segment:?}");
        assert!(segment.start < segment.end, "empty span: {segment:?}");
    }
}

#[test]
fn vad_options_split_speech_below_the_family_window() {
    let gigaam = vad_options_for(25_000.0);
    assert_eq!(gigaam.max_speech_ms, 24_500);
    assert!(gigaam.max_speech_ms < 25_000, "GigaAM window");

    // Every other bounded family splits at the 30 s window with the same margin.
    let default = vad_options_for(30_000.0);
    assert_eq!(default.max_speech_ms, 29_500);
    assert_ne!(gigaam, default);
}

#[test]
fn vad_cache_is_keyed_by_path_and_options() {
    let Some(vad_path) = vad_model() else { return };
    let mut cache = None;

    let cached = engine_vad(&mut cache, Some(&vad_path), vad_options_for(25_000.0), "GigaAM").expect("load VAD");
    assert_eq!(cached.path, vad_path);
    assert_eq!(cached.options, vad_options_for(25_000.0));

    // Same path and options keep the loaded model.
    engine_vad(&mut cache, Some(&vad_path), vad_options_for(25_000.0), "GigaAM").expect("reuse VAD");
    assert_eq!(cache.as_ref().expect("cached VAD").options, vad_options_for(25_000.0));

    // Different options reload with the requested option set.
    engine_vad(&mut cache, Some(&vad_path), vad_options_for(30_000.0), "GigaAM").expect("reload VAD");
    assert_eq!(cache.as_ref().expect("cached VAD").options, vad_options_for(30_000.0));

    // Different path reloads as well.
    let directory = tempfile::tempdir().expect("temp dir");
    let copied_path = directory.path().join("vad.bin");
    std::fs::copy(&vad_path, &copied_path).expect("copy VAD model");
    let copied_path = copied_path.to_string_lossy().into_owned();
    engine_vad(&mut cache, Some(&copied_path), vad_options_for(30_000.0), "GigaAM").expect("reload VAD");
    assert_eq!(cache.as_ref().expect("cached VAD").path, copied_path);
}

#[test]
fn vad_never_returns_a_chunk_over_the_bound() {
    let (Some(vad_path), Some(samples)) = (vad_model(), audio()) else {
        return;
    };
    // Repeat a real utterance until it is longer than two GigaAM windows,
    // so the VAD has to split it instead of returning it whole.
    let long = samples
        .iter()
        .copied()
        .cycle()
        .take(crate::plan::SAMPLE_RATE as usize * 60)
        .collect::<Vec<_>>();
    let model = transcribe_cpp::Model::load(&vad_path).expect("load VAD model");
    let mut session = model.vad_session().expect("VAD session");
    let options = vad_options_for(25_000.0);
    let result = session.run(&long, &options).expect("VAD segments");

    assert!(!result.segments.is_empty(), "expected detected speech");
    let bound = options.max_speech_ms as i64 * crate::plan::SAMPLE_RATE as i64 / 1000;
    for segment in result.segments {
        assert!(
            segment.end_sample - segment.start_sample <= bound,
            "chunk of {} samples exceeds the {bound}-sample bound",
            segment.end_sample - segment.start_sample
        );
    }
}

/// The metadata flags each family reported through the hand-written engines
/// must survive the switch unchanged; `detect_model` (probe) and a loaded
/// model's capabilities must agree.
#[test]
fn metadata_flags_match_the_legacy_engines() {
    struct Family {
        engine: &'static str,
        env: &'static str,
        languages: &'static [&'static str],
        language_detection: bool,
        bound: Option<f64>,
    }
    let families = [
        Family {
            engine: "gigaam",
            env: "GIGAAM_MODEL",
            languages: &["ru"],
            language_detection: false,
            bound: Some(25.0),
        },
        Family {
            engine: "parakeet",
            env: "PARAKEET_MODEL",
            languages: &[],
            language_detection: true,
            bound: Some(30.0),
        },
        Family {
            engine: "nemotron",
            env: "NEMOTRON_MODEL",
            languages: &[],
            language_detection: true,
            bound: Some(30.0),
        },
        Family {
            engine: "whisper",
            env: "WHISPER_MODEL",
            languages: &[],
            language_detection: true,
            bound: None,
        },
    ];
    for family in families {
        let Some(path) = env_model(family.env) else { continue };
        let probed = detect_model(&path).expect("metadata probe");
        assert_eq!(probed.engine, family.engine, "{} engine name", family.env);
        assert_eq!(probed.max_input_seconds, family.bound, "{} input bound", family.env);
        assert_eq!(probed.requires_vad, family.bound.is_some(), "{} VAD requirement", family.env);
        assert_eq!(
            probed.language_detection, family.language_detection,
            "{} detection",
            family.env
        );
        if !family.languages.is_empty() {
            assert_eq!(probed.languages, family.languages, "{} languages", family.env);
        }
        // GigaAM is the only legacy family without translation or streaming.
        if family.engine == "gigaam" {
            assert!(!probed.translation && !probed.streaming && !probed.text_prompts);
        }
        // Whisper is the only family with the whisper-only knobs.
        assert_eq!(probed.stable_timestamps, family.engine == "whisper");
        assert_eq!(probed.decoding_options, family.engine == "whisper");

        let loaded = load_engine(&path).expect("load for parity");
        let caps = loaded.capabilities();
        assert_eq!(caps.languages, probed.languages, "{} probe/load languages", family.env);
        assert_eq!(
            caps.max_input_seconds, probed.max_input_seconds,
            "{} probe/load bound",
            family.env
        );
        assert_eq!(caps.streaming, probed.streaming, "{} probe/load streaming", family.env);
    }
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
    let plan =
        crate::server::transcription::plan_for(&mut engine, &samples, &[], Some(&vad), None).expect("a plan without diarization");
    assert!(!plan.chunks.is_empty(), "speech is planned");
    for chunk in &plan.chunks {
        assert!(
            chunk.core_end - chunk.core_start <= bound + f64::EPSILON,
            "chunk over the bound: {chunk:?}"
        );
        assert!(chunk.speakers.is_empty(), "no speakers without diarization: {chunk:?}");
    }
}

/// A planned chunk run and the plain VAD path must produce the same text, so
/// the planner never changes what a family hears.
#[test]
fn bounded_families_plan_path_matches_the_vad_path() {
    let cases: [(Option<Engine>, f64); 3] = [(parakeet_engine(), 30.0), (nemotron_engine(), 30.0), (gigaam_engine(), 25.0)];
    for (engine, bound) in cases {
        let (Some(mut engine), Some(vad), Some(samples)) = (engine, vad_model(), audio()) else {
            continue;
        };
        // The plan uses exactly the speech ranges the VAD path feeds the model,
        // so the two paths hear the same audio and must agree on the text.
        let ranges = engine.speech_ranges(&samples, Some(&vad)).expect("speech ranges");
        assert!(!ranges.is_empty(), "expected detected speech");
        let plan = crate::plan::Plan {
            chunks: ranges
                .iter()
                .map(|(start, end)| crate::plan::Chunk {
                    input_start: *start,
                    input_end: *end,
                    core_start: *start,
                    core_end: *end,
                    speakers: vec![1],
                })
                .collect(),
            max_input_seconds: bound,
        };
        let from_vad = engine
            .transcribe(&samples, transcription_options(Some(vad.clone())))
            .expect("VAD path");
        let from_plan = engine
            .transcribe_chunks(&samples, &plan, transcription_options(Some(vad)))
            .expect("plan path");
        assert_eq!(from_vad.text(), from_plan.text());
    }
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
    assert!(err.to_string().contains("vad_model_path is required for gigaam"), "{err}");

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
fn chunk_ranges_follow_the_plan_and_clip_to_the_audio() {
    let plan = crate::plan::Plan {
        chunks: vec![
            crate::plan::Chunk {
                input_start: 0.0,
                input_end: 1.5,
                core_start: 0.0,
                core_end: 1.5,
                speakers: vec![1],
            },
            crate::plan::Chunk {
                input_start: 1.5,
                input_end: 3.0,
                core_start: 1.5,
                core_end: 3.0,
                speakers: vec![2],
            },
            crate::plan::Chunk {
                input_start: 3.0,
                input_end: 9.9,
                core_start: 3.0,
                core_end: 9.9,
                speakers: vec![1, 2],
            },
        ],
        max_input_seconds: 30.0,
    };
    // Two seconds of audio: the third chunk is fully past the end and
    // disappears, while the second is clipped to what exists.
    let sample_count = crate::plan::SAMPLE_RATE as usize * 2;
    assert_eq!(chunk_ranges(&plan, sample_count), vec![(0, 24000), (24000, 32000)]);
}

#[test]
fn legacy_whisper_bin_files_do_not_load() {
    // The pre-catalog whisper binary: probe and load both refuse it by name.
    let directory = tempfile::tempdir().expect("temp dir");
    let path = directory.path().join("ggml-base.en.bin");
    std::fs::write(&path, b"lmggml legacy header").unwrap();
    assert!(detect_model(path.to_str().unwrap()).is_err());
    assert!(Engine::load(path.to_str().unwrap(), ContextOptions::default()).is_err());
}

fn fixture_audio(path: &str) -> Vec<f32> {
    let mut reader = hound::WavReader::open(path).expect("fixture wav");
    reader
        .samples::<i16>()
        .map(|sample| sample.expect("audio sample") as f32 / 32768.0)
        .collect()
}

/// The new families the model catalog publishes: each loads through the
/// unified engine, reports the flags its catalog entry documents, and
/// transcribes the English fixture. Env-gated by the downloaded GGUF.
#[test]
fn new_families_load_transcribe_and_report_catalog_flags() {
    struct NewFamily {
        env: &'static str,
        streaming: bool,
        translation: bool,
        language_detection: bool,
        timestamps: bool,
        language: Option<&'static str>,
    }
    let families = [
        NewFamily {
            env: "CANARY_MODEL",
            streaming: false,
            translation: true,
            language_detection: false,
            timestamps: false,
            language: Some("en"),
        },
        NewFamily {
            env: "QWEN3_06B_MODEL",
            streaming: false,
            translation: false,
            language_detection: true,
            timestamps: false,
            language: None,
        },
        NewFamily {
            env: "QWEN3_17B_MODEL",
            streaming: false,
            translation: false,
            language_detection: true,
            timestamps: false,
            language: None,
        },
        NewFamily {
            env: "VOXTRAL_MINI_MODEL",
            streaming: false,
            translation: true,
            language_detection: true,
            timestamps: false,
            language: None,
        },
        NewFamily {
            env: "VOXTRAL_REALTIME_MODEL",
            streaming: true,
            translation: false,
            language_detection: true,
            timestamps: false,
            language: None,
        },
    ];
    let audio_path = std::env::var("NEW_FAMILY_AUDIO").unwrap_or_else(|_| "../../fixtures/short.wav".to_string());
    for family in families {
        let Some(path) = env_model(family.env) else { continue };
        let mut engine = load_engine(&path).unwrap_or_else(|| panic!("{} failed to load", family.env));
        let caps = engine.capabilities();
        assert_eq!(caps.streaming, family.streaming, "{} streaming", family.env);
        assert_eq!(caps.translation, family.translation, "{} translation", family.env);
        assert_eq!(caps.language_detection, family.language_detection, "{} detection", family.env);
        assert_eq!(caps.timestamps, family.timestamps, "{} timestamps", family.env);
        // The new families own their long-form path: no planner window, no VAD.
        assert_eq!(caps.max_input_seconds, None, "{} window", family.env);
        assert!(!engine.requires_vad(), "{} VAD", family.env);

        let options = TranscribeOptions {
            language: family.language.map(str::to_owned),
            ..TranscribeOptions::default()
        };
        let result = engine
            .transcribe(&fixture_audio(&audio_path), options)
            .unwrap_or_else(|err| panic!("{} transcribes: {err:#}", family.env));
        assert!(!result.segments.is_empty(), "{} produced no segments", family.env);
        assert!(!result.text().is_empty(), "{} produced no text", family.env);
    }
}

/// A streaming family emits segments while it runs, not only at the end.
#[test]
fn a_streaming_family_emits_segments_incrementally() {
    let (Some(mut engine), Some(samples)) = (nemotron_engine(), audio()) else {
        return;
    };
    assert!(engine.capabilities().streaming, "the fixture must be a streaming model");

    let finished = std::time::Instant::now();
    let mut arrivals: Vec<(usize, std::time::Duration)> = Vec::new();
    {
        let on_segment: OnSegment = Box::new(|segment: &Segment| {
            arrivals.push((segment.end as usize, finished.elapsed()));
        });
        let callbacks = StreamCallbacks {
            on_segment: Some(on_segment),
            ..StreamCallbacks::default()
        };
        engine
            .transcribe_stream(&samples, transcription_options(None), callbacks)
            .expect("stream run");
    }
    assert!(!arrivals.is_empty(), "no segments arrived");
    // At least one segment must arrive strictly before the whole run returns,
    // and later segments must not precede earlier ones.
    let total = finished.elapsed();
    assert!(
        arrivals.iter().any(|(_, at)| *at < total),
        "no segment arrived before completion"
    );
    let ends: Vec<usize> = arrivals.iter().map(|(end, _)| *end).collect();
    let mut sorted = ends.clone();
    sorted.sort_unstable();
    assert_eq!(ends, sorted, "segments arrived out of order");
}

/// A bounded family on a long recording keeps every model input inside its
/// window even when speech never pauses.
#[test]
fn a_long_recording_never_exceeds_the_family_window() {
    let (Some(mut engine), Some(vad), Some(samples)) = (gigaam_engine(), vad_model(), audio()) else {
        return;
    };
    let bound = engine.max_input_seconds().expect("bounded");
    let long = samples
        .iter()
        .copied()
        .cycle()
        .take(crate::plan::SAMPLE_RATE as usize * 90)
        .collect::<Vec<_>>();
    let plan = crate::server::transcription::plan_for(&mut engine, &long, &[], Some(&vad), None).expect("plan");
    assert!(!plan.chunks.is_empty(), "expected chunks");
    for chunk in &plan.chunks {
        assert!(
            chunk.core_end - chunk.core_start <= bound + f64::EPSILON,
            "chunk over the bound: {chunk:?}"
        );
    }
}
