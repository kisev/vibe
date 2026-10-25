//! Regression coverage for the diarization-guided chunk plan.
//!
//! The same recording is transcribed twice — once as before, once with a
//! diarization model — and the two transcripts must keep their words. A plan
//! that follows turns changes where the model is cut, which can change a word
//! at a boundary, but it must never lose whole passages or reorder the speech.
//! Only the planned run carries speaker sets.
//!
//! Model-gated like the other CLI tests: an engine without `GIGAAM_MODEL`,
//! `PARAKEET_MODEL`, or `NEMOTRON_MODEL` is skipped, and `DIARIZE_MODEL` must
//! name a diarization model for any of them to run. `GIGAAM_VAD_MODEL` is
//! required by all three.

// Test harness: a panic with context beats a silent skip.
#![allow(clippy::expect_used)]

use std::path::{Path, PathBuf};
use std::process::Command;

use serde_json::Value;

struct Engine {
    name: &'static str,
    model_env: &'static str,
    /// Engine-specific audio; falls back to `DIARIZATION_AUDIO`, then the fixture.
    audio_env: &'static str,
}

const ENGINES: [Engine; 3] = [
    Engine {
        name: "GigaAM",
        model_env: "GIGAAM_MODEL",
        audio_env: "GIGAAM_AUDIO",
    },
    Engine {
        name: "Parakeet",
        model_env: "PARAKEET_MODEL",
        audio_env: "PARAKEET_AUDIO",
    },
    Engine {
        name: "Nemotron",
        model_env: "NEMOTRON_MODEL",
        audio_env: "NEMOTRON_AUDIO",
    },
];

/// A lower bound on kept content, loose enough for a word changed at a cut.
const MIN_WORDS_KEPT: f64 = 0.75;
/// Words in order, so a lost passage or a scrambled transcript fails.
const MIN_WORD_ORDER: f64 = 0.5;

fn existing(variable: &str) -> Option<String> {
    std::env::var(variable).ok().filter(|path| Path::new(path).exists())
}

fn audio(engine: &Engine) -> Option<PathBuf> {
    existing(engine.audio_env)
        .or_else(|| existing("DIARIZATION_AUDIO"))
        .map(PathBuf::from)
        .or_else(|| {
            // A multi-speaker English recording tracked with the repository.
            let fixture = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../fixtures/multi.wav");
            fixture.exists().then_some(fixture)
        })
}

fn transcribe(model: &str, vad: &str, audio: &Path, diarize: Option<&str>) -> Value {
    let mut command = Command::new(env!("CARGO_BIN_EXE_vibe-server"));
    command
        .arg("transcribe")
        .arg(model)
        .arg(audio)
        .args(["--vad-model", vad, "--format", "json"]);
    if let Some(diarize) = diarize {
        command.args(["--diarize-model", diarize]);
    }
    let output = command.output().expect("run vibe-server");
    assert!(
        output.status.success(),
        "transcription failed: {}",
        String::from_utf8_lossy(&output.stderr)
    );
    serde_json::from_slice(&output.stdout).expect("json transcript")
}

fn words(text: &str) -> Vec<String> {
    text.split_whitespace()
        .map(|word| word.trim_matches(|c: char| !c.is_alphanumeric()).to_lowercase())
        .filter(|word| !word.is_empty())
        .collect()
}

/// Twice the longest common subsequence over the sum of the lengths: 1.0 when
/// the two word sequences agree exactly, 0 when they share nothing.
fn word_order(left: &[String], right: &[String]) -> f64 {
    if left.is_empty() && right.is_empty() {
        return 1.0;
    }
    let mut previous = vec![0_usize; right.len() + 1];
    for word in left {
        let mut current = vec![0_usize; right.len() + 1];
        for (index, other) in right.iter().enumerate() {
            current[index + 1] = if word == other {
                previous[index] + 1
            } else {
                previous[index + 1].max(current[index])
            };
        }
        previous = current;
    }
    2.0 * previous[right.len()] as f64 / (left.len() + right.len()) as f64
}

#[test]
fn diarization_bounds_change_where_the_cuts_fall_not_the_words() {
    let Some(diarize) = existing("DIARIZE_MODEL") else {
        eprintln!("skipping: DIARIZE_MODEL is not set");
        return;
    };
    let Some(vad) = existing("GIGAAM_VAD_MODEL") else {
        eprintln!("skipping: GIGAAM_VAD_MODEL is not set");
        return;
    };

    let mut ran = 0;
    for engine in &ENGINES {
        let (Some(model), Some(audio)) = (existing(engine.model_env), audio(engine)) else {
            eprintln!("skipping {}: {} or its audio is missing", engine.name, engine.model_env);
            continue;
        };
        ran += 1;

        let plain = transcribe(&model, &vad, &audio, None);
        let planned = transcribe(&model, &vad, &audio, Some(&diarize));

        let plain_words = words(plain["text"].as_str().unwrap_or_default());
        let planned_words = words(planned["text"].as_str().unwrap_or_default());
        assert!(
            !plain_words.is_empty(),
            "{}: the reference run produced no words",
            engine.name
        );

        let kept = planned_words.len() as f64 / plain_words.len() as f64;
        assert!(
            kept >= MIN_WORDS_KEPT,
            "{}: the planned run kept {:.0}% of the words ({}/{})",
            engine.name,
            kept * 100.0,
            planned_words.len(),
            plain_words.len()
        );
        let order = word_order(&plain_words, &planned_words);
        assert!(
            order >= MIN_WORD_ORDER,
            "{}: the planned transcript reorders the speech ({order:.2})",
            engine.name
        );

        // Without a plan the engine keeps its own long-form path, so no segment
        // claims a speaker set.
        for segment in plain["segments"].as_array().expect("segments") {
            assert!(
                segment.get("speakers").is_none(),
                "{}: a segment without a plan reports speaker sets",
                engine.name
            );
        }

        let mut last_start = f64::NEG_INFINITY;
        let mut planned_sets = 0;
        for segment in planned["segments"].as_array().expect("segments") {
            let start = segment["start"].as_f64().expect("start");
            assert!(start >= last_start, "{}: segments are out of order", engine.name);
            last_start = start;

            let Some(sets) = segment.get("speakers") else {
                // Speech diarization missed keeps no speaker set; that is expected.
                continue;
            };
            let sets: Vec<u64> = serde_json::from_value(sets.clone()).expect("speaker ids");
            assert!(!sets.is_empty(), "{}: an empty speaker set was reported", engine.name);
            let reported = segment["speaker"].as_u64().expect("speaker");
            assert!(
                sets.contains(&reported),
                "{}: `speaker` {reported} is not one of the planned ids {sets:?}",
                engine.name
            );
            planned_sets += 1;
        }
        assert!(planned_sets > 0, "{}: no segment carries its chunk's speakers", engine.name);
    }

    assert!(ran > 0, "no engine model was available, so nothing was verified");
}
