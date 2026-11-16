// Test harness: a panic with context beats a silent skip.
#![allow(clippy::expect_used)]

use std::process::Command;

/// The output file is opened only after transcription succeeds, so a run that
/// fails before that point must leave no file behind.
#[test]
fn failed_transcription_creates_no_output_file() {
    let dir = tempfile::tempdir().unwrap();
    let output = dir.path().join("transcript.txt");
    let missing_audio = dir.path().join("missing.wav");

    let result = Command::new(env!("CARGO_BIN_EXE_vibe-server"))
        .arg("transcribe")
        .arg(dir.path().join("missing-model.bin"))
        .arg(&missing_audio)
        .arg("--output")
        .arg(&output)
        .output()
        .expect("run vibe-server");

    assert!(!result.status.success(), "expected a failing transcription");
    assert!(!output.exists(), "failed transcription must not create {}", output.display());
}

/// Environment-gated CLI tests: each variable must name an existing file, or
/// the test prints why it is skipped and returns.
fn gated_path(variable: &str) -> Option<String> {
    match std::env::var(variable) {
        Ok(path) if std::path::Path::new(&path).exists() => Some(path),
        Ok(path) => {
            eprintln!("skipping: {variable}={path:?} does not exist");
            None
        }
        Err(_) => {
            eprintln!("skipping: {variable} is not set");
            None
        }
    }
}

fn run_transcribe(arguments: &[&str]) -> std::process::Output {
    Command::new(env!("CARGO_BIN_EXE_vibe-server"))
        .arg("transcribe")
        .args(arguments)
        // The CLI reads the cache root from this variable, and a developer
        // working on the cache commonly exports it. A "plain" run must stay
        // uncached, so each test controls caching only through its arguments.
        .env_remove("VIBE_SERVER_CACHE_DIR")
        .output()
        .expect("run vibe-server")
}

fn text(bytes: &[u8]) -> String {
    String::from_utf8_lossy(bytes).into_owned()
}

/// GigaAM only transcribes Russian, so Cyrillic output distinguishes a real
/// transcript from an empty or garbled one whatever recording `GIGAAM_AUDIO`
/// names.
fn has_cyrillic(text: &str) -> bool {
    text.chars().any(|c| ('\u{0400}'..='\u{04FF}').contains(&c))
}

#[test]
fn gigaam_cli_transcribes_a_russian_file() {
    let (Some(model), Some(audio), Some(vad)) = (
        gated_path("GIGAAM_MODEL"),
        gated_path("GIGAAM_AUDIO"),
        gated_path("GIGAAM_VAD_MODEL"),
    ) else {
        return;
    };

    let output = run_transcribe(&[&model, &audio, "--vad-model", &vad]);
    let stdout = text(&output.stdout);
    assert!(output.status.success(), "transcription failed: {}", text(&output.stderr));
    assert!(has_cyrillic(&stdout), "unexpected transcript: {stdout:?}");
}

#[test]
fn gigaam_cli_requires_vad() {
    let (Some(model), Some(audio)) = (gated_path("GIGAAM_MODEL"), gated_path("GIGAAM_AUDIO")) else {
        return;
    };

    let output = run_transcribe(&[&model, &audio]);
    assert!(
        !output.status.success(),
        "a GigaAM transcription without --vad-model must fail"
    );
    assert!(
        text(&output.stderr).contains("vad_model"),
        "expected a vad_model error, got: {}",
        text(&output.stderr)
    );
    assert!(
        output.stdout.is_empty(),
        "a failing run must not write to stdout: {:?}",
        text(&output.stdout)
    );
}

#[test]
fn gigaam_cli_rejects_unsupported_language() {
    let (Some(model), Some(audio), Some(vad)) = (
        gated_path("GIGAAM_MODEL"),
        gated_path("GIGAAM_AUDIO"),
        gated_path("GIGAAM_VAD_MODEL"),
    ) else {
        return;
    };

    let output = run_transcribe(&[&model, &audio, "--vad-model", &vad, "--language", "en"]);
    assert!(!output.status.success(), "an English GigaAM transcription must fail");
    assert!(
        text(&output.stderr).contains("unsupported_language"),
        "expected an unsupported_language error, got: {}",
        text(&output.stderr)
    );
    assert!(
        output.stdout.is_empty(),
        "a failing run must not write to stdout: {:?}",
        text(&output.stdout)
    );
}

#[test]
fn gigaam_cli_markdown_without_diarization() {
    let (Some(model), Some(audio), Some(vad)) = (
        gated_path("GIGAAM_MODEL"),
        gated_path("GIGAAM_AUDIO"),
        gated_path("GIGAAM_VAD_MODEL"),
    ) else {
        return;
    };

    let output = run_transcribe(&[&model, &audio, "--vad-model", &vad, "--format", "md"]);
    let stdout = text(&output.stdout);
    assert!(output.status.success(), "transcription failed: {}", text(&output.stderr));
    for expected in ["**[", "-->"] {
        assert!(stdout.contains(expected), "missing {expected:?} in {stdout:?}");
    }
    assert!(has_cyrillic(&stdout), "missing the Russian transcript in {stdout:?}");
    assert!(
        !stdout.contains("Speaker "),
        "no speaker labels without --diarize-model: {stdout:?}"
    );
}

#[test]
fn gigaam_cli_markdown_with_diarization() {
    let (Some(model), Some(audio), Some(vad), Some(diarize)) = (
        gated_path("GIGAAM_MODEL"),
        gated_path("GIGAAM_AUDIO"),
        gated_path("GIGAAM_VAD_MODEL"),
        gated_path("DIARIZE_MODEL"),
    ) else {
        return;
    };

    let output = run_transcribe(&[
        &model,
        &audio,
        "--vad-model",
        &vad,
        "--diarize-model",
        &diarize,
        "--format",
        "md",
    ]);
    let stdout = text(&output.stdout);
    assert!(output.status.success(), "transcription failed: {}", text(&output.stderr));
    assert!(stdout.contains("Speaker 1"), "missing a speaker label in {stdout:?}");
}

/// Run the same command twice against one cache directory and check that the
/// second run reuses every finished chunk. `--diarize-model` is the only
/// difference between the diarized and the plain scenario.
fn assert_chunks_are_cached(model: &str, audio: &str, vad: &str, diarize: Option<&str>) {
    let dir = tempfile::tempdir().expect("cache directory");
    let cache = dir.path().to_str().expect("cache path is UTF-8");
    let mut arguments = vec![model, audio, "--vad-model", vad];
    if let Some(diarize) = diarize {
        arguments.extend(["--diarize-model", diarize]);
    }
    arguments.extend(["--cache-dir", cache]);

    let first = run_transcribe(&arguments);
    assert!(first.status.success(), "first run failed: {}", text(&first.stderr));

    let parts: Vec<_> = walk(dir.path())
        .into_iter()
        .filter(|path| {
            path.file_name()
                .is_some_and(|name| name.to_string_lossy().starts_with("part-"))
        })
        .collect();
    assert!(!parts.is_empty(), "the cache holds at least one finished chunk");
    // Age the parts first: file systems may stamp to the second, so a rewrite
    // inside the same tick would otherwise leave mtime unchanged. A rewrite
    // during the second run then carries a current time that cannot match.
    for part in &parts {
        age_part(part);
    }
    let before: Vec<_> = parts.iter().map(|part| part_stamp(part)).collect();

    let second = run_transcribe(&arguments);
    assert!(second.status.success(), "second run failed: {}", text(&second.stderr));
    assert_eq!(text(&first.stdout), text(&second.stdout), "the transcript is unchanged");

    let after: Vec<_> = parts.iter().map(|part| part_stamp(part)).collect();
    assert_eq!(before, after, "cached chunks are not rewritten");
}

/// Move a cached part far into the past, where a rewrite cannot land.
fn age_part(path: &std::path::Path) {
    let stamp = std::time::SystemTime::UNIX_EPOCH + std::time::Duration::from_secs(86_400);
    let file = std::fs::OpenOptions::new().write(true).open(path).expect("open cache part");
    file.set_times(std::fs::FileTimes::new().set_modified(stamp))
        .expect("backdate cache part");
}

fn part_stamp(path: &std::path::Path) -> (u64, std::time::SystemTime) {
    let metadata = std::fs::metadata(path).expect("cache part metadata");
    (metadata.len(), metadata.modified().expect("cache part mtime"))
}

/// With diarization the CLI plans chunks and caches each finished one, so a
/// repeated run reuses them instead of running inference again.
#[test]
fn gigaam_cli_caches_finished_chunks() {
    let (Some(model), Some(audio), Some(vad), Some(diar)) = (
        gated_path("GIGAAM_MODEL"),
        gated_path("GIGAAM_AUDIO"),
        gated_path("GIGAAM_VAD_MODEL"),
        gated_path("DIARIZE_MODEL"),
    ) else {
        return;
    };

    assert_chunks_are_cached(&model, &audio, &vad, Some(&diar));
}

/// Planning is not diarization-only: a plain run with a VAD model still plans
/// chunks from detected speech, so its finished chunks are cached and reused.
#[test]
fn gigaam_cli_caches_finished_chunks_without_diarization() {
    let (Some(model), Some(audio), Some(vad)) = (
        gated_path("GIGAAM_MODEL"),
        gated_path("GIGAAM_AUDIO"),
        gated_path("GIGAAM_VAD_MODEL"),
    ) else {
        return;
    };

    assert_chunks_are_cached(&model, &audio, &vad, None);
}

/// The cache is an optimization, not part of the result: the same inputs must
/// produce the same transcript whether or not a directory is configured.
#[test]
fn gigaam_cli_output_does_not_depend_on_the_cache() {
    let (Some(model), Some(audio), Some(vad), Some(diar)) = (
        gated_path("GIGAAM_MODEL"),
        gated_path("GIGAAM_AUDIO"),
        gated_path("GIGAAM_VAD_MODEL"),
        gated_path("DIARIZE_MODEL"),
    ) else {
        return;
    };
    let dir = tempfile::tempdir().expect("cache directory");
    let cache = dir.path().to_str().expect("cache path is UTF-8");

    let plain = run_transcribe(&[
        &model,
        &audio,
        "--vad-model",
        &vad,
        "--diarize-model",
        &diar,
        "--format",
        "json",
    ]);
    assert!(plain.status.success(), "uncached run failed: {}", text(&plain.stderr));
    let cached = run_transcribe(&[
        &model,
        &audio,
        "--vad-model",
        &vad,
        "--diarize-model",
        &diar,
        "--format",
        "json",
        "--cache-dir",
        cache,
    ]);
    assert!(cached.status.success(), "cached run failed: {}", text(&cached.stderr));

    assert_eq!(
        text(&plain.stdout),
        text(&cached.stdout),
        "the cache must not change the transcript"
    );
}

fn walk(root: &std::path::Path) -> Vec<std::path::PathBuf> {
    let mut files = Vec::new();
    let Ok(entries) = std::fs::read_dir(root) else {
        return files;
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            files.extend(walk(&path));
        } else {
            files.push(path);
        }
    }
    files
}

/// The legacy whisper .bin container is refused with the format named and the
/// model catalog pointed at. The audio is read before the model loads, so the
/// fixture path is anchored to the crate instead of the test's working
/// directory; a missing fixture then fails on the path, not on the assertion.
#[test]
fn legacy_bin_is_refused_with_the_catalog_pointer() {
    let Ok(model) = std::env::var("WHISPER_BIN_MODEL") else {
        return;
    };
    if !std::path::Path::new(&model).exists() {
        eprintln!("skipping: WHISPER_BIN_MODEL={model:?} does not exist");
        return;
    }
    let audio = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../fixtures/short.wav");
    let audio = audio.to_string_lossy();
    let result = run_transcribe(&[&model, &audio, "--format", "json"]);
    assert!(!result.status.success(), "the legacy .bin must not load");
    let stderr = String::from_utf8_lossy(&result.stderr);
    let combined = format!("{stderr}{}", String::from_utf8_lossy(&result.stdout));
    assert!(combined.contains(".bin"), "names the format: {combined}");
    assert!(
        combined.to_lowercase().contains("catalog"),
        "points at the catalog: {combined}"
    );
}
