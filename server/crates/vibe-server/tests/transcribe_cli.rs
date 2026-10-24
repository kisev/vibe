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
        .output()
        .expect("run vibe-server")
}

fn text(bytes: &[u8]) -> String {
    String::from_utf8_lossy(bytes).into_owned()
}

#[test]
fn gigaam_cli_transcribes_a_russian_file() {
    let (Some(model), Some(audio), Some(vad)) = (
        gated_path("GIGAAM_MODEL"),
        gated_path("GIGAAM_AUDIO"),
        gated_path("GIGAAM_VAD"),
    ) else {
        return;
    };

    let output = run_transcribe(&[&model, &audio, "--vad-model", &vad]);
    let stdout = text(&output.stdout);
    assert!(output.status.success(), "transcription failed: {}", text(&output.stderr));
    assert!(stdout.contains("глаголы"), "unexpected transcript: {stdout:?}");
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
        gated_path("GIGAAM_VAD"),
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
        gated_path("GIGAAM_VAD"),
    ) else {
        return;
    };

    let output = run_transcribe(&[&model, &audio, "--vad-model", &vad, "--format", "md"]);
    let stdout = text(&output.stdout);
    assert!(output.status.success(), "transcription failed: {}", text(&output.stderr));
    for expected in ["**[", "-->", "глаголы"] {
        assert!(stdout.contains(expected), "missing {expected:?} in {stdout:?}");
    }
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
        gated_path("GIGAAM_VAD"),
        gated_path("GIGAAM_DIARIZE"),
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

/// With diarization the CLI plans chunks and caches each finished one, so a
/// repeated run reuses them instead of running inference again.
#[test]
fn gigaam_cli_caches_finished_chunks() {
    let (Some(model), Some(audio), Some(vad), Some(diar)) = (
        gated_path("GIGAAM_MODEL"),
        gated_path("GIGAAM_AUDIO"),
        gated_path("GIGAAM_VAD"),
        gated_path("GIGAAM_DIARIZE"),
    ) else {
        return;
    };
    let dir = tempfile::tempdir().unwrap();
    let cache = dir.path().to_str().unwrap();

    let first = run_transcribe(&[
        &model,
        &audio,
        "--vad-model",
        &vad,
        "--diarize-model",
        &diar,
        "--cache-dir",
        cache,
    ]);
    assert!(first.status.success(), "first run failed: {}", text(&first.stderr));

    let parts: Vec<_> = walk(dir.path())
        .into_iter()
        .filter(|path| {
            path.file_name()
                .is_some_and(|name| name.to_string_lossy().starts_with("part-"))
        })
        .collect();
    assert!(!parts.is_empty(), "the cache holds at least one finished chunk");
    let before: Vec<_> = parts
        .iter()
        .map(|path| std::fs::metadata(path).unwrap().modified().unwrap())
        .collect();

    let second = run_transcribe(&[
        &model,
        &audio,
        "--vad-model",
        &vad,
        "--diarize-model",
        &diar,
        "--cache-dir",
        cache,
    ]);
    assert!(second.status.success(), "second run failed: {}", text(&second.stderr));
    assert_eq!(text(&first.stdout), text(&second.stdout), "the transcript is unchanged");

    let after: Vec<_> = parts
        .iter()
        .map(|path| std::fs::metadata(path).unwrap().modified().unwrap())
        .collect();
    assert_eq!(before, after, "cached chunks are not rewritten");
}

/// The cache is an optimization, not part of the result: the same inputs must
/// produce the same transcript whether or not a directory is configured.
#[test]
fn gigaam_cli_output_does_not_depend_on_the_cache() {
    let (Some(model), Some(audio), Some(vad), Some(diar)) = (
        gated_path("GIGAAM_MODEL"),
        gated_path("GIGAAM_AUDIO"),
        gated_path("GIGAAM_VAD"),
        gated_path("GIGAAM_DIARIZE"),
    ) else {
        return;
    };
    let dir = tempfile::tempdir().unwrap();
    let cache = dir.path().to_str().unwrap();

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
