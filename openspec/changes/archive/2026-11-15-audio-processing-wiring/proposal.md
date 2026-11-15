# Proposal

## Why

The audio-processing settings are inert. `normalize_loudness` and `custom_command` are persisted and shown with a switch and a field, `TranscribeOptions` even defines an `FfmpegOptions` struct, but no code path reads the settings or sends them with a transcription: the struct is `#[allow(dead_code)]`, the server converts to WAV without a filter, and the UI never includes the values. A user who trusts "better accuracy" turns the switch on and gets exactly the same audio, while the hint, the default and the reset button all describe work that never happens.

## What Changes

- The transcription request carries the audio-processing settings, and the desktop applies them before upload with the bundled ffmpeg: `normalize_loudness` applies `loudnorm=I=-16:TP=-1.5:LRA=11`, and `custom_command` appends the user's arguments.
- The processed WAV is temporary, used only for that transcription, and removed however the run ends.
- Comparison runs use the same treatment, so the two surfaces cannot disagree.
- Processing stays opt-in: with the switch off and no custom command, the file goes to the server untouched.

## Capabilities

- `audio-processing` (new): how the audio preprocessing settings change what is transcribed.

## Impact

- `desktop/src-tauri/src/cmd/transcribe.rs`, `desktop/src-tauri/src/ffmpeg.rs` (reuse `normalize`), `desktop/src/pages/main/hooks/use-transcribe-queue.ts`, `desktop/src/lib/model-comparison.ts`, tests.
- Transcription time grows when normalization is on, which is what the hint already says.
