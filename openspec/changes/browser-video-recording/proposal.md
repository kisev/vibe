# Proposal

## Why

The embedded browser shows the meeting — including shared screens — but Vibe records only audio. When a call shares a slide deck or a demo, the recording keeps the voices and loses the content the user is looking at, and there is no way to capture it from the app.

## What Changes

- The bar gains a **record video** action beside the audio record action: it captures the content window's picture while the audio recorder runs (or on its own), and writes an MP4 next to the transcript.
- Capture is local: ffmpeg grabs the content window on the platform's own compositor (Windows: `gdigrab` with the window title; Linux X11: `x11grab`; macOS: `avfoundation` window capture), so no page code, no WebRTC permission and no upload is involved.
- The recording stops with the audio or when the window closes, and the file lands in the same folder as the transcript with a matching name.
- Failures (no capture backend, a DRM-protected surface) surface in the bar instead of producing an empty file.

## Capabilities

- `meeting-browser` (existing): the embedded browser and its bar.

## Impact

- `desktop/src-tauri/src/meeting_browser.rs` (or a `video_recorder` module), `desktop/src/windows/browser-window.tsx`, ffmpeg args, tests, docs.
- Nothing leaves the device; the feature is opt-in per call.

## Non-Goals

- Encoding changes to the audio recorder; the transcription path stays untouched.
- Capturing the whole desktop or other applications.
