use crate::error::LogError;
use crate::server::ServerEvent;
use crate::setup::ServerState;
use crate::transcript::{Segment, Transcript};
use eyre::Result;
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc,
};
use tauri::{Emitter, Listener, State};
use tokio::sync::Mutex;

use super::{ui::set_progress_bar, CommandError};

#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct FfmpegOptions {
    pub normalize_loudness: bool,
    pub custom_command: Option<String>,
}

impl Default for FfmpegOptions {
    fn default() -> Self {
        Self {
            normalize_loudness: true,
            custom_command: None,
        }
    }
}

#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct TranscribeOptions {
    pub path: String,
    pub lang: Option<String>,
    pub verbose: Option<bool>,
    pub n_threads: Option<i32>,
    pub init_prompt: Option<String>,
    pub temperature: Option<f32>,
    pub translate: Option<bool>,
    pub max_text_ctx: Option<i32>,
    pub word_timestamps: Option<bool>,
    pub diarize_model: Option<String>,
    pub stable_timestamps: Option<bool>,
    pub vad_model: Option<String>,
    /// Upper bound per model input for long recordings; None uses the engine maximum.
    pub chunk_seconds: Option<f64>,
    /// Audio processing applied before upload; None sends the file untouched.
    pub ffmpeg_options: Option<FfmpegOptions>,
}

/// The loudness filter the settings field advertises, and the one that must survive merging.
const NORMALIZE: &str = "loudnorm=I=-16:TP=-1.5:LRA=11";

/// The ffmpeg arguments the saved settings ask for, or `None` when nothing is requested.
///
/// The filter mirrors the placeholder the settings field shows, so what the user reads is what
/// runs. When normalization is on, a custom `-af`/`-filter:a` chain joins it in one chain, because
/// ffmpeg keeps only the last `-af` and the default-on switch would otherwise silently do nothing.
/// When it is off there is nothing to merge, so the custom command passes through exactly as
/// written — including the forms this app cannot parse.
///
/// `Err` is a custom command ffmpeg would misread, never a silently rewritten one.
pub fn processing_args(options: &FfmpegOptions) -> Result<Option<Vec<String>>, String> {
    let mut filters: Vec<String> = Vec::new();
    let mut args: Vec<String> = Vec::new();
    match (options.normalize_loudness, options.custom_command.as_deref()) {
        (true, custom) => {
            filters.push(NORMALIZE.to_string());
            if let Some(custom) = custom {
                merge_custom(custom, &mut filters, &mut args)?;
            }
        }
        (false, Some(custom)) => {
            // Same shapes fail loudly, but nothing is rewritten: with no normalization there is
            // no chain to merge into, so the command reaches ffmpeg exactly as written.
            merge_custom(custom, &mut Vec::new(), &mut Vec::new())?;
            args.extend(custom.split_whitespace().map(str::to_string));
        }
        (false, None) => {}
    }
    if !filters.is_empty() {
        args.splice(0..0, ["-af".to_string(), filters.join(",")]);
    }
    Ok((!args.is_empty()).then_some(args))
}

/// Fold a custom command's audio filters into `filters`, leaving every other token in `args`.
fn merge_custom(custom: &str, filters: &mut Vec<String>, args: &mut Vec<String>) -> Result<(), String> {
    let mut tokens = custom.split_whitespace();
    while let Some(token) = tokens.next() {
        match filter_flag(token)? {
            None if token.starts_with(',') => {
                return Err(format!(
                    "`{token}` starts with a comma, so a space split it off the filter chain; \
                     write the whole chain without spaces"
                ))
            }
            None => args.push(token.to_string()),
            Some(FilterFlag::Inline(flag, chain)) => push_filter(filters, flag, chain)?,
            Some(FilterFlag::Separate(flag)) => {
                let chain = tokens
                    .next()
                    .ok_or_else(|| format!("the custom command ends with `{flag}`, which needs a filter chain after it"))?;
                push_filter(filters, flag, chain)?;
            }
        }
    }
    Ok(())
}

/// How a filter flag reached us, and which flag it was: `-af chain` takes its chain from the
/// next token, `-af=chain` carries it inline.
enum FilterFlag<'a> {
    Separate(&'a str),
    Inline(&'a str, &'a str),
}

/// Classify a token that could be an audio filter flag.
///
/// The match is deliberately exact. `-aframes` is a real ffmpeg option that merely starts with
/// `-af`, and `-filter:v`/`-vf` are video filters that never collide with `-af`, so a prefix test
/// would reject innocent flags. An audio stream selector (`-af:0`, `-filter:a:0`, `-filter:0`) is
/// different: it would sit beside the merged `-af`, ffmpeg keeps the last one for that stream, and
/// the normalization would silently do nothing again — the bug this merge exists to prevent.
fn filter_flag(token: &str) -> Result<Option<FilterFlag<'_>>, String> {
    for flag in ["-af", "-filter:a"] {
        if token == flag {
            return Ok(Some(FilterFlag::Separate(flag)));
        }
        if let Some(chain) = token.strip_prefix(flag).and_then(|rest| rest.strip_prefix('=')) {
            return Ok(Some(FilterFlag::Inline(flag, chain)));
        }
        if token.starts_with(&format!("{flag}:")) {
            return Err(stream_selector_error(token));
        }
    }
    if let Some(rest) = token.strip_prefix("-filter:") {
        // `-filter:v` is the video side and harmless here; anything else picks an audio stream.
        if !rest.starts_with('v') {
            return Err(stream_selector_error(token));
        }
    }
    Ok(None)
}

fn stream_selector_error(token: &str) -> String {
    format!(
        "`{token}` targets one stream, which this app cannot merge into its normalization \
         chain; for audio filters write `-af <chain>`"
    )
}

/// Reject a chain this app cannot apply faithfully: a dangling `-af` (`-af -ar 44100` would bury
/// `-ar` in the filter list and lose the sample rate), a quoted chain (`split_whitespace` has
/// already broken `-af "volume=2dB, atempo=2"` into two tokens, one of which would reach ffmpeg
/// as a stray output filename), and an unquoted chain split the same way (`volume=2dB,` leaves a
/// dangling comma and `atempo=2` becomes that stray filename).
fn push_filter(filters: &mut Vec<String>, flag: &str, chain: &str) -> Result<(), String> {
    if chain.is_empty() || chain.starts_with('-') {
        return Err(format!(
            "`{flag}` needs a filter chain after it, got `{chain}`; run the command without it if no filter is wanted"
        ));
    }
    let quoted = |c: char| c == '"' || c == '\'';
    if chain.starts_with(quoted) || chain.ends_with(quoted) {
        // A quote at either edge means a space split the chain: `"volume=2dB,` lost its tail.
        // Quotes inside one token (`enable='between(t,1,2)'`) are fine and reach ffmpeg intact.
        return Err(format!(
            "`{flag}` chain `{chain}` starts or ends with a quote, so a space split it; write the chain without spaces"
        ));
    }
    if chain.starts_with(',') || chain.ends_with(',') {
        return Err(format!(
            "`{flag}` chain `{chain}` ends on a comma, so part of it was split off; write the whole chain without spaces"
        ));
    }
    filters.push(chain.to_string());
    Ok(())
}

/// The error a failed preprocessing becomes: ffmpeg's own message, never a silent fallback to
/// the original file.
fn processing_error(error: eyre::Error) -> CommandError {
    CommandError {
        code: "ffmpeg_failed".to_string(),
        message: format!("Audio processing failed: {error}"),
    }
}

/// Deletes the preprocessed copy however the run ends, including an early error.
struct TempAudio(Option<PathBuf>);

impl Drop for TempAudio {
    fn drop(&mut self) {
        if let Some(path) = self.0.take() {
            match std::fs::remove_file(&path) {
                // A run that failed before ffmpeg wrote anything has nothing to delete.
                Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
                Err(error) => tracing::warn!("could not remove the processed audio {}: {error}", path.display()),
                Ok(()) => {}
            }
        }
    }
}

/// The audio the engine receives, plus the temporary copy its guard deletes when dropped.
///
/// With nothing asked for the original path passes through untouched; otherwise the bundled
/// ffmpeg writes a fresh temporary WAV and that copy is what gets uploaded.
fn upload_audio(audio_path: &Path, options: Option<&FfmpegOptions>) -> Result<(PathBuf, TempAudio), CommandError> {
    let args = match options.map(processing_args) {
        None | Some(Ok(None)) => return Ok((audio_path.to_path_buf(), TempAudio(None))),
        Some(Ok(Some(args))) => args,
        Some(Err(message)) => {
            return Err(CommandError {
                code: "invalid_ffmpeg_options".to_string(),
                message: format!("Audio processing settings cannot run: {message}"),
            })
        }
    };
    let output = crate::ffmpeg::get_vibe_temp_folder().join(format!("{}.wav", crate::ffmpeg::random_string(10)));
    // The guard exists before ffmpeg runs, not after it succeeds: a pass that dies mid-encode
    // leaves a half-written WAV, and the temp folder only prunes earlier days' files.
    let guard = TempAudio(Some(output.clone()));
    crate::ffmpeg::normalize(audio_path.to_path_buf(), output.clone(), Some(args)).map_err(processing_error)?;
    Ok((output, guard))
}

pub(crate) const SERVER_DIED: &str = "vibe-server process died during transcription";

/// Turn a transcription failure into something diagnosable: a send failure or a
/// mid-stream decode error is usually the sidecar dying, and only the child
/// itself knows the exit code, the signal, and what it printed on the way out.
async fn transcribe_error(server_state: &State<'_, Mutex<ServerState>>, error: eyre::Error) -> CommandError {
    if let Some(api_error) = error.downcast_ref::<crate::server::ServerApiError>() {
        return CommandError {
            code: api_error.code.clone(),
            message: api_error.message.clone(),
        };
    }
    match crate::server::death_report(server_state, SERVER_DIED).await {
        Some(message) => CommandError {
            code: "internal_error".to_string(),
            message,
        },
        None => {
            let mut command_error = CommandError::from(error);
            let stderr = crate::server::recent_stderr(server_state).await;
            if !stderr.is_empty() {
                command_error.message.push_str(&format!("\n\nvibe-server stderr: {stderr}"));
            }
            command_error
        }
    }
}

#[tauri::command]
pub async fn transcribe(
    app_handle: tauri::AppHandle,
    mut options: TranscribeOptions,
    server_state: State<'_, Mutex<ServerState>>,
) -> Result<Transcript, CommandError> {
    // Validate file exists before attempting transcription
    let audio_path = PathBuf::from(&options.path);
    if !audio_path.exists() {
        return Err(CommandError {
            code: "invalid_request".to_string(),
            message: format!("Audio file not found: {}", options.path),
        });
    }
    if !audio_path.is_file() {
        return Err(CommandError {
            code: "invalid_request".to_string(),
            message: format!("Path is not a file: {}", options.path),
        });
    }

    // Listen for "abort" before the preprocessing pass: ffmpeg runs for nearly the length of the
    // recording, and an event nobody is listening for yet is an abort the user thinks landed.
    let abort_atomic = Arc::new(AtomicBool::new(false));
    let abort_atomic_c = abort_atomic.clone();
    let listener_handle = app_handle.clone();
    app_handle.listen("abort_transcribe", move |_| {
        let _ = set_progress_bar(&listener_handle, None);
        abort_atomic_c.store(true, Ordering::Relaxed);
    });

    // Audio processing happens on this side, before upload: the pinned server converts to WAV
    // without a filter, so a setting it never sees is a setting that does nothing. The guard
    // lives until this command returns, however it returns.
    // ffmpeg runs synchronously for as long as the recording is long, and this command runs on
    // an async worker: a long preprocessing pass must not hold that worker.
    let (upload_path, _processed) = {
        let processing = options.ffmpeg_options.clone();
        tauri::async_runtime::spawn_blocking(move || upload_audio(&audio_path, processing.as_ref()))
            .await
            .map_err(|error| CommandError {
                code: "audio_processing_failed".to_string(),
                message: format!("Audio processing task failed: {error}"),
            })??
    };
    if abort_atomic.load(Ordering::Relaxed) {
        tracing::debug!("transcription aborted by user during preprocessing");
        return Ok(Transcript {
            processing_time_sec: 0,
            segments: Vec::new(),
        });
    }
    options.path = upload_path.to_string_lossy().into_owned();

    let (client, base_url) = {
        let state = server_state.lock().await;
        let process = state.process.as_ref().ok_or_else(|| CommandError {
            code: "no_model".to_string(),
            message: "Please load model first".to_string(),
        })?;
        (process.client(), process.base_url())
    }; // lock released here, before any I/O

    let start = std::time::Instant::now();

    let stream = match crate::server::ServerProcess::transcribe_stream(&client, &base_url, &options).await {
        Ok(stream) => stream,
        Err(e) => return Err(transcribe_error(&server_state, e).await),
    };

    tokio::pin!(stream);

    let mut segments = Vec::new();
    let mut completed = false;

    while let Some(event_result) = stream.next().await {
        if abort_atomic.load(Ordering::Relaxed) {
            tracing::debug!("transcription aborted by user");
            break;
        }

        match event_result {
            Ok(event) => match event {
                ServerEvent::Progress { progress } => {
                    let _ = set_progress_bar(&app_handle, Some(progress.into()));
                }
                ServerEvent::Segment {
                    start,
                    end,
                    text,
                    speaker,
                    speakers,
                } => {
                    let segment = Segment {
                        start: (start * 100.0) as i64,
                        stop: (end * 100.0) as i64,
                        text,
                        speaker,
                        speakers,
                    };
                    app_handle.emit_to("main", "new_segment", segment.clone()).log_error();
                    segments.push(segment);
                }
                ServerEvent::Result { .. } => {
                    tracing::debug!("transcription complete");
                    completed = true;
                }
                ServerEvent::Error { code, message } => {
                    tracing::error!("vibe-server transcription error: {}", message);
                    let _ = set_progress_bar(&app_handle, None);
                    return Err(CommandError {
                        code: code.unwrap_or_else(|| "internal_error".to_string()),
                        message,
                    });
                }
            },
            Err(e) => {
                tracing::error!("stream error: {:?}", e);
                let _ = set_progress_bar(&app_handle, None);
                return Err(transcribe_error(&server_state, e).await);
            }
        }
    }

    let _ = set_progress_bar(&app_handle, None);

    if !abort_atomic.load(Ordering::Relaxed) && !completed {
        // A stream that just stops is almost always the sidecar dying under it;
        // say how it died rather than reporting a truncated stream.
        let message = crate::server::death_report(&server_state, SERVER_DIED)
            .await
            .unwrap_or_else(|| "vibe-server transcription stream ended before completion".to_string());
        return Err(CommandError {
            code: "internal_error".to_string(),
            message,
        });
    }

    let elapsed = start.elapsed();
    let transcript = Transcript {
        processing_time_sec: elapsed.as_secs(),
        segments,
    };

    Ok(transcript)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalization_alone_mirrors_the_field_placeholder() {
        let options = FfmpegOptions {
            normalize_loudness: true,
            custom_command: None,
        };
        assert_eq!(
            processing_args(&options),
            Ok(Some(vec!["-af".to_string(), "loudnorm=I=-16:TP=-1.5:LRA=11".to_string()]))
        );
    }

    #[test]
    fn a_custom_filter_joins_the_normalization_chain() {
        let options = FfmpegOptions {
            normalize_loudness: true,
            custom_command: Some("-af volume=2dB -ar 44100".to_string()),
        };
        // One `-af`: a second one would make ffmpeg drop the normalization entirely.
        assert_eq!(
            processing_args(&options),
            Ok(Some(vec![
                "-af".to_string(),
                "loudnorm=I=-16:TP=-1.5:LRA=11,volume=2dB".to_string(),
                "-ar".to_string(),
                "44100".to_string(),
            ]))
        );
    }

    #[test]
    fn a_custom_filter_alone_is_kept_when_normalization_is_off() {
        let options = FfmpegOptions {
            normalize_loudness: false,
            custom_command: Some("-filter:a volume=2dB".to_string()),
        };
        // Nothing is prepended, so the command passes through exactly as written.
        assert_eq!(
            processing_args(&options),
            Ok(Some(vec!["-filter:a".to_string(), "volume=2dB".to_string()]))
        );
    }

    #[test]
    fn nothing_asked_for_means_the_file_is_untouched() {
        let options = FfmpegOptions {
            normalize_loudness: false,
            custom_command: Some("   ".to_string()),
        };
        assert_eq!(processing_args(&options), Ok(None));
    }

    #[test]
    fn the_equals_form_of_the_custom_filter_joins_the_chain_too() {
        let options = FfmpegOptions {
            normalize_loudness: true,
            custom_command: Some("-af=volume=2dB -ar 44100".to_string()),
        };
        // ffmpeg accepts `-af=…`; leaving it as an ordinary token would put a second `-af` on
        // the command line and drop the normalization entirely.
        assert_eq!(
            processing_args(&options),
            Ok(Some(vec![
                "-af".to_string(),
                "loudnorm=I=-16:TP=-1.5:LRA=11,volume=2dB".to_string(),
                "-ar".to_string(),
                "44100".to_string(),
            ]))
        );
    }

    #[test]
    fn a_command_this_merge_cannot_apply_is_refused_with_its_own_reason() {
        // Each shape has its own diagnosis; a shared "something went wrong" would let a
        // regression in the classifier pass unnoticed.
        for (custom, fragment) in [
            ("-af", "needs a filter chain after it"),
            ("-af -ar 44100", "needs a filter chain after it"),
            ("-filter:a=", "needs a filter chain after it"),
            ("-filter:a:0 volume=2dB", "targets one stream"),
            ("-filter:0 volume=2dB", "targets one stream"),
            (r#"-af "volume=2dB, atempo=2""#, "starts or ends with a quote"),
            ("-af volume=2dB, atempo=2", "ends on a comma"),
        ] {
            let options = FfmpegOptions {
                normalize_loudness: true,
                custom_command: Some(custom.to_string()),
            };
            let error = processing_args(&options).expect_err(custom);
            assert!(error.contains(fragment), "{custom}: {error}");
        }
    }

    #[test]
    fn a_flag_that_only_looks_like_a_filter_flag_passes_through() {
        for custom in ["-aframes 100", "-filter:v fps=10"] {
            let options = FfmpegOptions {
                normalize_loudness: true,
                custom_command: Some(custom.to_string()),
            };
            // A real flag that merely starts like one: `-aframes` and the video-side
            // `-filter:v` neither collide with `-af`, so they stay ordinary arguments.
            assert_eq!(
                processing_args(&options),
                Ok(Some(
                    [
                        "-af".to_string(),
                        NORMALIZE.to_string(),
                        custom.split_whitespace().next().unwrap().to_string(),
                        custom.split_whitespace().nth(1).unwrap().to_string(),
                    ]
                    .to_vec()
                )),
                "{custom}"
            );
        }
    }

    /// A scratch directory of its own per test, so parallel runs cannot collide.
    fn scratch_dir(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("vibe-transcribe-test-{}-{name}", crate::ffmpeg::random_string(8)));
        std::fs::create_dir_all(&dir).unwrap();
        dir
    }

    /// A minimal 16 kHz mono WAV holding a quiet tone: enough for ffmpeg to normalize.
    fn write_tone_wav(path: &Path) {
        let sample_rate: u32 = 16_000;
        let samples: Vec<i16> = (0..sample_rate / 10)
            .map(|i| ((i as f32 / sample_rate as f32 * 440.0 * std::f32::consts::TAU).sin() * 3_000.0) as i16)
            .collect();
        let data_len = (samples.len() * 2) as u32;
        let mut bytes = Vec::with_capacity(44 + data_len as usize);
        bytes.extend_from_slice(b"RIFF");
        bytes.extend_from_slice(&(36 + data_len).to_le_bytes());
        bytes.extend_from_slice(b"WAVEfmt ");
        bytes.extend_from_slice(&16u32.to_le_bytes());
        bytes.extend_from_slice(&1u16.to_le_bytes());
        bytes.extend_from_slice(&1u16.to_le_bytes());
        bytes.extend_from_slice(&sample_rate.to_le_bytes());
        bytes.extend_from_slice(&(sample_rate * 2).to_le_bytes());
        bytes.extend_from_slice(&2u16.to_le_bytes());
        bytes.extend_from_slice(&16u16.to_le_bytes());
        bytes.extend_from_slice(b"data");
        bytes.extend_from_slice(&data_len.to_le_bytes());
        for sample in samples {
            bytes.extend_from_slice(&sample.to_le_bytes());
        }
        std::fs::write(path, bytes).unwrap();
    }

    #[test]
    fn nothing_asked_for_uploads_the_original() {
        let dir = scratch_dir("original");
        let original = dir.join("clip.wav");
        std::fs::write(&original, b"not really audio").unwrap();

        for options in [
            None,
            Some(&FfmpegOptions {
                normalize_loudness: false,
                custom_command: None,
            }),
        ] {
            let (upload, guard) = upload_audio(&original, options).unwrap();
            assert_eq!(upload, original);
            assert_eq!(std::fs::read(&original).unwrap(), b"not really audio");
            assert_eq!(guard.0, None);
        }
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn the_processed_copy_is_removed_when_the_guard_drops() {
        let dir = scratch_dir("cleanup");
        let copy = dir.join("copy.wav");
        std::fs::write(&copy, b"processed").unwrap();
        {
            let guard = TempAudio(Some(copy.clone()));
            assert!(copy.is_file());
            assert_eq!(guard.0.as_deref(), Some(copy.as_path()));
        }
        assert!(!copy.exists());
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn normalization_uploads_a_copy_and_leaves_the_original() {
        let dir = scratch_dir("normalized");
        let original = dir.join("clip.wav");
        write_tone_wav(&original);
        let before = std::fs::read(&original).unwrap();
        let options = FfmpegOptions {
            normalize_loudness: true,
            custom_command: None,
        };

        // A dev host without ffmpeg can only prove the failure is loud; the app ships ffmpeg.
        if crate::ffmpeg::find_ffmpeg_path().is_none() {
            let Err(error) = upload_audio(&original, Some(&options)) else {
                panic!("ffmpeg is missing, so preprocessing must fail rather than send the original");
            };
            assert_eq!(error.code, "ffmpeg_failed");
            assert!(error.message.starts_with("Audio processing failed"));
            assert!(original.is_file());
            std::fs::remove_dir_all(&dir).ok();
            return;
        }

        let (upload, guard) = upload_audio(&original, Some(&options)).unwrap();
        assert_ne!(upload, original);
        assert!(upload.is_file());
        assert_eq!(std::fs::read(&original).unwrap(), before);
        drop(guard);
        assert!(!upload.exists());
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn a_preprocessing_error_keeps_ffmpeg_s_message() {
        let error = processing_error(eyre::eyre!("unable to convert file: \"invalid data\""));
        assert_eq!(error.code, "ffmpeg_failed");
        assert_eq!(
            error.message,
            "Audio processing failed: unable to convert file: \"invalid data\""
        );
    }
}
