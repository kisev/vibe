use transcribe_cpp::{DiarizeOptions, Model};

/// The Nemotron-3-Diarization GGUF architecture, served by the native GGML
/// stack in the vibe-diarize-native helper. Everything else — Sortformer
/// today — stays on the transcribe.cpp engine.
const NATIVE_ARCHITECTURE: &str = "nemotron3_diar";

#[derive(Debug, Clone)]
pub struct Segment {
    pub start: f64,
    pub end: f64,
    pub speaker_id: usize,
}

/// Diarizes on whichever engine owns the model's architecture. Both engines
/// number speakers from 1 here: the planner's speaker ids are 1-based, and 0
/// marks an unattributed stretch.
pub fn diarize(model_path: &str, samples: &[f32]) -> Vec<Segment> {
    if native_diarization(model_path) {
        diarize_native(model_path, samples)
    } else {
        diarize_transcribe_cpp(model_path, samples)
    }
}

/// Whether the GGUF at `model_path` is a Nemotron-3-Diarization export, read
/// from the container header alone.
pub(crate) fn native_diarization(model_path: &str) -> bool {
    crate::engine::gguf_architecture(model_path).as_deref() == Some(NATIVE_ARCHITECTURE)
}

/// Sortformer GGUFs through the transcribe.cpp FFI, as before the native
/// stack arrived.
fn diarize_transcribe_cpp(model_path: &str, samples: &[f32]) -> Vec<Segment> {
    let result = (|| -> anyhow::Result<Vec<Segment>> {
        let model = Model::load(model_path)?;
        let mut session = model.diarize_session()?;
        let segments = session.run(samples, &DiarizeOptions::default())?;
        Ok(segments
            .into_iter()
            .map(|segment| Segment {
                start: segment.t0_ms as f64 / 1000.0,
                end: segment.t1_ms as f64 / 1000.0,
                speaker_id: segment.speaker_id.max(1) as usize,
            })
            .collect())
    })();
    match result {
        Ok(segments) => segments,
        Err(err) => {
            tracing::warn!("diarization failed, skipping speakers: {err:#}");
            Vec::new()
        }
    }
}

/// Nemotron-3-Diarization GGUFs on the native GGML stack, in the
/// vibe-diarize-native helper beside the executable. The helper numbers
/// speakers from 0; the shift to the planner's 1-based ids happens here.
fn diarize_native(model_path: &str, samples: &[f32]) -> Vec<Segment> {
    let result = native::run(model_path, samples);
    match result {
        Ok(mut segments) => {
            for segment in &mut segments {
                segment.speaker_id += 1;
            }
            segments
        }
        Err(err) => {
            tracing::warn!("diarization failed, skipping speakers: {err:#}");
            Vec::new()
        }
    }
}

/// The process boundary to vibe-diarize-native: samples go over as a mono
/// 16 kHz float WAV, segments come back as JSON. Kept in one place so the
/// helper's contract has exactly one description.
mod native {
    use anyhow::Context as _;

    use super::Segment;

    #[cfg(target_os = "windows")]
    const HELPER: &str = "vibe-diarize-native.exe";
    #[cfg(not(target_os = "windows"))]
    const HELPER: &str = "vibe-diarize-native";

    #[derive(serde::Deserialize)]
    struct NativeSegment {
        start: f64,
        end: f64,
        speaker: usize,
    }

    pub fn run(model_path: &str, samples: &[f32]) -> anyhow::Result<Vec<Segment>> {
        let helper = helper_path()?;
        let wav = tempfile::NamedTempFile::new()?;
        write_wav(wav.path(), samples)?;
        let output = std::process::Command::new(&helper)
            .arg(model_path)
            .arg(wav.path())
            .output()
            .with_context(|| format!("running {} failed", helper.display()))?;
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            anyhow::bail!("vibe-diarize-native exited {}: {}", output.status, stderr.trim());
        }
        let native: Vec<NativeSegment> = serde_json::from_slice(&output.stdout)?;
        Ok(native
            .into_iter()
            .map(|segment| Segment {
                start: segment.start,
                end: segment.end,
                speaker_id: segment.speaker,
            })
            .collect())
    }

    fn helper_path() -> anyhow::Result<std::path::PathBuf> {
        let dir = std::env::current_exe()
            .ok()
            .and_then(|exe| exe.parent().map(|dir| dir.to_owned()))
            .ok_or_else(|| anyhow::anyhow!("cannot resolve the executable directory"))?;
        Ok(dir.join(HELPER))
    }

    fn write_wav(path: &std::path::Path, samples: &[f32]) -> anyhow::Result<()> {
        let spec = hound::WavSpec {
            channels: 1,
            sample_rate: 16_000,
            bits_per_sample: 32,
            sample_format: hound::SampleFormat::Float,
        };
        let mut writer = hound::WavWriter::create(path, spec)?;
        for sample in samples {
            writer.write_sample(*sample)?;
        }
        writer.finalize()?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_architecture_picks_the_engine() {
        let dir = tempfile::tempdir().expect("tempdir");
        let nemotron = dir.path().join("nemotron.gguf");
        let sortformer = dir.path().join("sortformer.gguf");
        std::fs::write(&nemotron, gguf_header("nemotron3_diar")).expect("write");
        std::fs::write(&sortformer, gguf_header("sortformer")).expect("write");

        assert!(native_diarization(nemotron.to_str().expect("utf-8 path")));
        assert!(!native_diarization(sortformer.to_str().expect("utf-8 path")));
    }

    #[test]
    fn a_missing_helper_skips_speakers_without_panicking() {
        // A Nemotron file with no helper beside the test binary is the
        // packaging-failure path; it must warn and continue, not abort.
        let dir = tempfile::tempdir().expect("tempdir");
        let nemotron = dir.path().join("nemotron.gguf");
        std::fs::write(&nemotron, gguf_header("nemotron3_diar")).expect("write");
        assert!(diarize(nemotron.to_str().expect("utf-8 path"), &[]).is_empty());
    }

    /// A minimal GGUF container whose only metadata key is the architecture.
    fn gguf_header(architecture: &str) -> Vec<u8> {
        let mut out = Vec::new();
        out.extend_from_slice(b"GGUF");
        out.extend_from_slice(&3u32.to_le_bytes()); // version
        out.extend_from_slice(&0u64.to_le_bytes()); // tensor count
        out.extend_from_slice(&1u64.to_le_bytes()); // kv count
        let key = b"general.architecture";
        out.extend_from_slice(&(key.len() as u64).to_le_bytes());
        out.extend_from_slice(key);
        out.extend_from_slice(&8u32.to_le_bytes()); // string
        out.extend_from_slice(&(architecture.len() as u64).to_le_bytes());
        out.extend_from_slice(architecture.as_bytes());
        out
    }
}
