//! Model-gated tests. Set `GIGAAM_MODEL` to a published GGUF to run them.
//!
//! `GIGAAM_MODELS` may point at a directory holding the four published
//! variants (`gigaam-v3-rnnt`, `gigaam-v3-ctc`, `gigaam-v3-e2e-rnnt`,
//! `gigaam-v3-e2e-ctc`) for the variant sweep; `GIGAAM_AUDIO` is a 16 kHz mono
//! WAV with Russian speech and `GIGAAM_VAD` a Silero GGML model.

use std::path::{Path, PathBuf};

use gigaam_rs::{Error, LongFormTranscription, Model};

/// Minimal GGUF v3 writer for metadata-only fixtures (no tensors).
mod fixture {
    use std::path::PathBuf;

    pub enum Value {
        U32(u32),
        Bool(bool),
        F32(f32),
        Str(&'static str),
        StrArray(Vec<&'static str>),
    }

    fn push_string(out: &mut Vec<u8>, value: &str) {
        out.extend_from_slice(&(value.len() as u64).to_le_bytes());
        out.extend_from_slice(value.as_bytes());
    }

    pub fn write(name: &str, entries: &[(&str, Value)]) -> PathBuf {
        let directory = std::env::temp_dir().join("gigaam-fixtures");
        std::fs::create_dir_all(&directory).unwrap();
        let path = directory.join(name);
        let mut out = Vec::new();
        out.extend_from_slice(b"GGUF\x03\x00\x00\x00");
        out.extend_from_slice(&0u64.to_le_bytes()); // tensor count
        out.extend_from_slice(&(entries.len() as u64).to_le_bytes());
        for (key, value) in entries {
            push_string(&mut out, key);
            match value {
                Value::U32(value) => {
                    out.extend_from_slice(&4u32.to_le_bytes());
                    out.extend_from_slice(&value.to_le_bytes());
                }
                Value::Bool(value) => {
                    out.extend_from_slice(&7u32.to_le_bytes());
                    out.push(*value as u8);
                }
                Value::F32(value) => {
                    out.extend_from_slice(&6u32.to_le_bytes());
                    out.extend_from_slice(&value.to_le_bytes());
                }
                Value::Str(value) => {
                    out.extend_from_slice(&8u32.to_le_bytes());
                    push_string(&mut out, value);
                }
                Value::StrArray(values) => {
                    out.extend_from_slice(&9u32.to_le_bytes());
                    out.extend_from_slice(&8u32.to_le_bytes());
                    out.extend_from_slice(&(values.len() as u64).to_le_bytes());
                    for value in values {
                        push_string(&mut out, value);
                    }
                }
            }
        }
        std::fs::write(&path, out).unwrap();
        path
    }

    /// Every key `read_info` reads, in the published schema.
    pub fn gigaam_entries(head_kind: &'static str, architecture: &'static str) -> Vec<(&'static str, Value)> {
        vec![
            ("general.architecture", Value::Str(architecture)),
            ("stt.variant", Value::Str("gigaam-fixture")),
            ("stt.gigaam.head_kind", Value::Str(head_kind)),
            ("stt.gigaam.encoder.self_attention_model", Value::Str("rotary")),
            ("stt.gigaam.encoder.n_layers", Value::U32(1)),
            ("stt.gigaam.encoder.d_model", Value::U32(768)),
            ("stt.gigaam.encoder.n_heads", Value::U32(16)),
            ("stt.gigaam.encoder.d_ff", Value::U32(3072)),
            ("stt.gigaam.encoder.conv_kernel", Value::U32(5)),
            ("stt.gigaam.encoder.subsampling_factor", Value::U32(4)),
            ("stt.gigaam.encoder.subs_kernel_size", Value::U32(5)),
            ("stt.gigaam.encoder.pos_emb_max_len", Value::U32(5000)),
            ("stt.gigaam.head.num_classes", Value::U32(34)),
            ("stt.frontend.sample_rate", Value::U32(16_000)),
            ("stt.frontend.num_mels", Value::U32(64)),
            ("stt.frontend.n_fft", Value::U32(320)),
            ("stt.frontend.win_length", Value::U32(320)),
            ("stt.frontend.hop_length", Value::U32(160)),
            ("stt.frontend.center", Value::Bool(false)),
            ("stt.frontend.log_clamp_min", Value::F32(1e-9)),
            ("stt.frontend.log_clamp_max", Value::F32(1e9)),
            ("general.languages", Value::StrArray(vec!["ru"])),
            ("tokenizer.ggml.model", Value::Str("char")),
            ("tokenizer.ggml.tokens", Value::StrArray(vec!["<blank>", "а"])),
            ("tokenizer.ggml.blank_token_id", Value::U32(0)),
        ]
    }
}

fn model_path() -> Option<String> {
    std::env::var("GIGAAM_MODEL").ok().filter(|path| Path::new(path).exists())
}

fn audio_path() -> Option<String> {
    std::env::var("GIGAAM_AUDIO").ok().filter(|path| Path::new(path).exists())
}

fn vad_path() -> Option<String> {
    std::env::var("GIGAAM_VAD").ok().filter(|path| Path::new(path).exists())
}

fn read_samples(path: &str) -> Vec<f32> {
    let mut reader = hound::WavReader::open(path).unwrap();
    assert_eq!(reader.spec().sample_rate, 16_000);
    assert_eq!(reader.spec().channels, 1);
    reader
        .samples::<i16>()
        .map(|sample| sample.unwrap() as f32 / 32768.0)
        .collect()
}

fn published_variants() -> Vec<PathBuf> {
    std::env::var("GIGAAM_MODELS")
        .ok()
        .map(|directory| {
            let mut paths = std::fs::read_dir(directory)
                .map(|entries| {
                    entries
                        .filter_map(|entry| entry.ok().map(|entry| entry.path()))
                        .filter(|path| path.extension().is_some_and(|extension| extension == "gguf"))
                        .collect::<Vec<_>>()
                })
                .unwrap_or_default();
            paths.sort();
            paths
        })
        .unwrap_or_default()
}

/// Case- and punctuation-insensitive form used to compare the charwise base
/// variants with the punctuating end-to-end variants.
fn normalize(text: &str) -> String {
    text.to_lowercase()
        .chars()
        .map(|character| if character.is_alphanumeric() { character } else { ' ' })
        .collect::<String>()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

const EXPECTED_RU: &str = "важно различать глаголы и дополнения";

#[test]
fn reads_published_metadata() {
    let Some(path) = model_path() else { return };
    let info = Model::metadata(&path).unwrap();
    assert_eq!(info.architecture, "gigaam");
    assert!(info.head_kind == "rnnt" || info.head_kind == "ctc");
    assert_eq!(info.encoder_layers, 16);
    assert_eq!(info.encoder_dimension, 768);
    assert_eq!(info.encoder_heads, 16);
    assert_eq!(info.frontend.num_mels, 64);
    assert_eq!(info.frontend.hop_length, 160);
    assert!(!info.frontend.center);
    assert_eq!(info.languages, vec!["ru".to_string()]);
}

#[test]
fn malformed_gguf_fails_without_aborting() {
    let directory = std::env::temp_dir().join("gigaam-malformed-test");
    std::fs::create_dir_all(&directory).unwrap();
    let path = directory.join("truncated.gguf");
    std::fs::write(&path, b"GGUF\x03\x00\x00\x00not-a-real-tensor-table").unwrap();
    assert!(Model::metadata(&path).is_err());
    assert!(Model::load(&path).is_err());
    std::fs::remove_file(&path).ok();
}

#[test]
fn transcribes_russian_sample() {
    let Some(path) = model_path() else { return };
    let audio = audio_path().expect("GIGAAM_AUDIO");
    let expected = std::env::var("GIGAAM_EXPECTED").expect("GIGAAM_EXPECTED");
    let samples = read_samples(&audio);
    let model = Model::load(&path).unwrap();
    let transcription = model.transcribe_chunk(&samples, "ru").unwrap();
    eprintln!("transcript: {:?}", transcription.text);
    assert!(!transcription.tokens.is_empty());
    assert!(
        transcription.text.eq_ignore_ascii_case(&expected),
        "expected {expected:?}, got {:?}",
        transcription.text
    );
}

/// Golden test over the four published variants. Both heads and both
/// vocabulary styles must produce the same normalized sentence.
#[test]
fn every_published_variant_matches_the_reference_transcript() {
    let variants = published_variants();
    if variants.is_empty() {
        return;
    }
    let audio = audio_path().expect("GIGAAM_AUDIO");
    let samples = read_samples(&audio);
    for path in variants {
        let model = Model::load(&path).unwrap();
        let transcription = model.transcribe_chunk(&samples, "ru").unwrap();
        let normalized = normalize(&transcription.text);
        eprintln!(
            "{}: head={} text={:?}",
            path.file_name().unwrap().to_string_lossy(),
            model.info().head_kind,
            transcription.text
        );
        assert!(!transcription.tokens.is_empty(), "{} produced no tokens", path.display());
        assert_eq!(normalized, EXPECTED_RU, "{}", path.display());
        // The end-to-end vocabularies add sentence punctuation and casing; the
        // base vocabularies are charwise and stay lowercase.
        if model.info().variant.contains("e2e") {
            assert!(
                transcription.text.ends_with('.'),
                "{}: {:?}",
                path.display(),
                transcription.text
            );
            assert!(
                transcription.text.chars().any(char::is_uppercase),
                "{}: {:?}",
                path.display(),
                transcription.text
            );
        } else {
            assert_eq!(transcription.text, transcription.text.to_lowercase(), "{}", path.display());
            assert!(
                !transcription.text.chars().any(|character| ",.!?".contains(character)),
                "{}: {:?}",
                path.display(),
                transcription.text
            );
        }
    }
}

#[test]
fn rejects_unsupported_language() {
    let Some(path) = model_path() else { return };
    let model = Model::load(&path).unwrap();
    for language in ["en", "de-DE", "ru-RU"] {
        assert!(model.transcribe_chunk(&[0.0; 16_000], language).is_err());
    }
    for language in ["", "auto", "ru"] {
        assert!(model.transcribe_chunk(&[0.0; 16_000], language).is_ok());
    }
}

#[test]
fn rejects_non_gigaam_models_with_a_named_error() {
    let entries = fixture::gigaam_entries("ctc", "whisper");
    let path = fixture::write("whisper.gguf", &entries);
    let error = match Model::load(&path) {
        Ok(_) => panic!("a whisper GGUF must not load as GigaAM"),
        Err(error) => error,
    };
    assert!(matches!(
        error,
        Error::UnsupportedArchitecture(architecture) if architecture == "whisper"
    ));
    // The metadata probe still reports what the file claims to be, so the
    // server's detection path can name the architecture it saw.
    assert_eq!(Model::metadata(&path).unwrap().architecture, "whisper");
}

#[test]
fn rejects_an_unknown_head_with_a_named_error() {
    let path = fixture::write(
        "unknown-head.gguf",
        &[("stt.gigaam.head_kind", fixture::Value::Str("transducer"))],
    );
    assert!(matches!(
        Model::metadata(&path).unwrap_err(),
        Error::UnsupportedHead(head) if head == "transducer"
    ));
}

#[test]
fn encoder_output_is_sane() {
    let Some(path) = model_path() else { return };
    let audio = audio_path().expect("GIGAAM_AUDIO");
    let samples = read_samples(&audio);
    let model = Model::load(&path).unwrap();
    let features = model.mel().compute(&samples).unwrap();
    let (encoded, shape) = model.encode(&features).unwrap();
    let mean = encoded.iter().sum::<f32>() / encoded.len() as f32;
    let rms = (encoded.iter().map(|value| value * value).sum::<f32>() / encoded.len() as f32).sqrt();
    let min = encoded.iter().copied().fold(f32::INFINITY, f32::min);
    let max = encoded.iter().copied().fold(f32::NEG_INFINITY, f32::max);
    eprintln!(
        "features {}x{} shape {:?} mean {mean:.4} rms {rms:.4} min {min:.4} max {max:.4}",
        features.num_mels, features.num_frames, shape
    );
    assert!(encoded.iter().all(|value| value.is_finite()));
    // One encoder frame per four mel frames after two stride-2 convolutions.
    assert_eq!(shape[0], model.info().encoder_dimension as i64);
    assert_eq!(shape[1] as usize, features.num_frames.div_ceil(4));
}

/// The mel frontend is compared against a NumPy transcription of
/// `torchaudio.transforms.MelSpectrogram` using the same baked window and
/// filterbank (`plans/add-gigaam-engine`).
#[test]
fn mel_matches_reference_frames() {
    let Some(path) = model_path() else { return };
    let audio = audio_path().expect("GIGAAM_AUDIO");
    let samples = read_samples(&audio);
    let model = Model::load(&path).unwrap();
    let features = model.mel().compute(&samples).unwrap();
    let expected_frames = (samples.len() - 320) / 160 + 1;
    assert_eq!(features.num_frames, expected_frames);
    // Mel bins are the slow axis: `data[mel * num_frames + frame]`.
    let value = |mel: usize, frame: usize| features.data[mel * features.num_frames + frame];
    for (mel, expected) in [-10.66989f32, -9.424013, -8.934465, -9.174357, -8.93359, -11.692286]
        .into_iter()
        .enumerate()
    {
        assert!(
            (value(mel, 0) - expected).abs() < 1e-3,
            "mel {mel}: {} != {expected}",
            value(mel, 0)
        );
    }
    let mean = |frame: usize| (0..features.num_mels).map(|mel| value(mel, frame)).sum::<f32>() / features.num_mels as f32;
    assert!((mean(0) - -10.8565).abs() < 1e-3);
    assert!((mean(50) - -10.2342).abs() < 1e-3);
}

/// Writes the mel and encoder stages as little-endian f32 when
/// `GIGAAM_DUMP_STAGES` names a directory, for comparison with the PyTorch
/// reference dump from `plans/add-gigaam-engine`.
#[test]
fn dumps_stages_for_reference_comparison() {
    let (Some(path), Ok(directory)) = (model_path(), std::env::var("GIGAAM_DUMP_STAGES")) else {
        return;
    };
    let audio = audio_path().expect("GIGAAM_AUDIO");
    let samples = read_samples(&audio);
    let model = Model::load(&path).unwrap();
    let features = model.mel().compute(&samples).unwrap();
    let (encoded, shape) = model.encode(&features).unwrap();
    std::fs::create_dir_all(&directory).unwrap();
    let write = |name: &str, values: &[f32]| {
        let bytes = values.iter().flat_map(|value| value.to_le_bytes()).collect::<Vec<_>>();
        std::fs::write(format!("{directory}/{name}.f32"), bytes).unwrap();
    };
    write("feats", &features.data);
    write("enc", &encoded);
    // `feats` is mel-major (`mel * frames + frame`); `enc` follows GGML memory
    // order (d_model fastest), so read it back as `(frames, d_model).T`.
    std::fs::write(
        format!("{directory}/shapes.txt"),
        format!(
            "feats {} {} mel-major\nenc {} {} time-major\n",
            features.num_mels, features.num_frames, shape[0], shape[1]
        ),
    )
    .unwrap();
}

fn synthesize_long(samples: &[f32], repeats: usize) -> Vec<f32> {
    let mut long = Vec::with_capacity(samples.len() * repeats + 16_000 * repeats);
    for _ in 0..repeats {
        long.extend_from_slice(samples);
        long.extend(std::iter::repeat_n(0.0, 16_000));
    }
    long
}

#[test]
fn long_form_splits_at_vad_boundaries() {
    let (Some(path), Some(vad_path), Some(audio)) = (model_path(), vad_path(), audio_path()) else {
        return;
    };
    let samples = synthesize_long(&read_samples(&audio), 6);
    let model = Model::load(&path).unwrap();
    let mut vad = vad_rs::Vad::new(
        &vad_path,
        vad_rs::Options {
            max_chunk_ms: 24_000,
            overlap_ms: 0,
            ..vad_rs::Options::default()
        },
    )
    .unwrap();
    let mut checked = 0;
    let result = model
        .transcribe_with(
            &mut vad,
            &samples,
            "ru",
            || false,
            |_| {},
            |progress| {
                assert!((0..=100).contains(&progress));
                checked += 1;
            },
        )
        .unwrap();
    eprintln!("segments {} progress callbacks {checked}", result.segments.len());
    assert!(!result.segments.is_empty());
    assert!(result.segments.iter().all(|segment| !segment.text.trim().is_empty()));
    assert!(!result.text().is_empty());
    // Progress ends at 100% because every VAD range was processed.
    assert!(checked > 0);
}

#[test]
fn long_form_returns_nothing_for_silence() {
    let (Some(path), Some(vad_path)) = (model_path(), vad_path()) else {
        return;
    };
    let model = Model::load(&path).unwrap();
    let mut vad = vad_rs::Vad::new(&vad_path, vad_rs::Options::default()).unwrap();
    let result: LongFormTranscription = model.transcribe(&mut vad, &vec![0.0; 16_000 * 5], "ru").unwrap();
    assert!(result.segments.is_empty());
    assert!(result.text().is_empty());
}

#[test]
fn long_form_aborts_when_asked() {
    let (Some(path), Some(vad_path), Some(audio)) = (model_path(), vad_path(), audio_path()) else {
        return;
    };
    let samples = read_samples(&audio);
    let model = Model::load(&path).unwrap();
    let mut vad = vad_rs::Vad::new(&vad_path, vad_rs::Options::default()).unwrap();
    let error = model
        .transcribe_with(&mut vad, &samples, "ru", || true, |_| {}, |_| {})
        .unwrap_err();
    assert!(matches!(error, gigaam_rs::Error::Aborted));
}
