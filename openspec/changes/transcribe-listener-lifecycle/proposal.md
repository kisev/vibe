# Proposal

## Why

`transcribe` registers an `abort_transcribe` listener on every call and never removes it. Tauri keeps that listener for the lifetime of the app, so each transcription leaves another one behind, all of them holding their own `AtomicBool` and clone of the handle. After a few transcriptions one "abort" click wakes every listener ever registered, and the app's listener list grows without bound.

The fix belongs next to the work that moved the registration before preprocessing, where the leak became easier to see: a guard that owns the listener and unlistens when the command ends, like the `TempAudio` guard already owns its temporary file.

## What Changes

- The abort listener is owned by a guard created in `transcribe`; dropping the guard calls `unlisten`, so it is removed on success, on error, and on an early return.
- The guard is constructed once per command, before preprocessing, and dropped when the command returns.

## Capabilities

- `transcription-control` (new): starting, aborting and finishing one transcription from the app's side.

## Impact

- `desktop/src-tauri/src/cmd/transcribe.rs` only: the listener registration block and a small guard type with its unit test.
- No behaviour change for a single transcription; what changes is that its listener disappears afterwards.

## Non-Goals

- Cancelling an ffmpeg preprocessing pass that is already running (the pass is blocking; the abort is honoured right after it returns).
- Any change to how the server reports progress or segments.
