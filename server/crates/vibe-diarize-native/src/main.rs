//! Nemotron-3-Diarization as a standalone tool.
//!
//! vibe-server runs this binary beside itself when a diarization GGUF
//! declares the `nemotron3_diar` architecture (see its diarization.rs). The
//! process boundary is what keeps the two GGML builds apart — see the crate
//! comment in Cargo.toml.
//!
//! Usage: `vibe-diarize-native <model.gguf> <audio.wav>`
//! stdout is one JSON array of `{"start": seconds, "end": seconds,
//! "speaker": 0-based}`; any failure exits non-zero with a message on stderr.

use std::path::Path;
use std::process::ExitCode;

fn main() -> ExitCode {
    let mut args = std::env::args_os();
    let program = args.next();
    let (Some(model_path), Some(wav_path), None) = (args.next(), args.next(), args.next()) else {
        eprintln!(
            "usage: {} <model.gguf> <audio.wav>",
            program
                .as_deref()
                .map(std::ffi::OsStr::to_string_lossy)
                .unwrap_or_else(|| "vibe-diarize-native".into())
        );
        return ExitCode::from(2);
    };
    match run(&model_path, &wav_path) {
        Ok(()) => ExitCode::SUCCESS,
        Err(error) => {
            eprintln!("vibe-diarize-native: {error:#}");
            ExitCode::FAILURE
        }
    }
}

fn run(model_path: &std::ffi::OsStr, wav_path: &std::ffi::OsStr) -> anyhow::Result<()> {
    let samples = read_wav(Path::new(wav_path))?;
    let mut diarizer = nemotron_diarize_rs::Diarizer::new(Path::new(model_path)).map_err(|error| anyhow::anyhow!("{error}"))?;
    let expected_rate = diarizer.sample_rate();
    if expected_rate != 16_000 {
        anyhow::bail!("the model expects {expected_rate} Hz audio; the server decodes 16 kHz");
    }
    let segments = diarizer
        .diarize_samples(&samples)
        .map_err(|error| anyhow::anyhow!("{error}"))?;
    // Hand-rolled: the array is flat and this tool deliberately carries no
    // serializer dependency.
    let mut stdout = String::from("[");
    for (index, segment) in segments.iter().enumerate() {
        if index > 0 {
            stdout.push(',');
        }
        stdout.push_str(&format!(
            "{{\"start\":{:.3},\"end\":{:.3},\"speaker\":{}}}",
            segment.start, segment.end, segment.speaker_id
        ));
    }
    stdout.push_str("]\n");
    use std::io::Write as _;
    std::io::stdout().write_all(stdout.as_bytes())?;
    Ok(())
}

/// Mono 16 kHz WAV, exactly what the server writes for this tool; the sample
/// format may be float or int either way, scaled to [-1, 1).
fn read_wav(path: &Path) -> anyhow::Result<Vec<f32>> {
    let mut reader = hound::WavReader::open(path)?;
    let spec = reader.spec();
    anyhow::ensure!(
        spec.sample_rate == 16_000 && spec.channels == 1,
        "expected mono 16 kHz audio, found {} ch {} Hz",
        spec.channels,
        spec.sample_rate
    );
    match spec.sample_format {
        hound::SampleFormat::Float => reader
            .samples::<f32>()
            .collect::<Result<Vec<_>, _>>()
            .map_err(|error| anyhow::anyhow!("wav decode: {error}")),
        hound::SampleFormat::Int => {
            let scale = 1.0 / (1i64 << (spec.bits_per_sample - 1)) as f32;
            Ok(reader
                .samples::<i32>()
                .map(|sample| sample.map(|value| value as f32 * scale))
                .collect::<Result<Vec<_>, _>>()
                .map_err(|error| anyhow::anyhow!("wav decode: {error}"))?)
        }
    }
}
