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
