# Proposal

## Why

The recording meter is five two-pixel bars over one mixed level: it neither shows how long the recording has run nor which source is producing sound. Users routinely start a call with the wrong device combination and only discover after the meeting that the file holds silence, a single side of the conversation, or only one participant — the log shows both devices opening while the meter gives no way to tell them apart before it is too late.

## What Changes

- The main window's recording surface shows a per-source meter: the microphone and the system-audio loopback each get their own clearly sized level, labelled with the device names actually in use.
- A recording indicator with elapsed time is visible wherever the recording runs, including the embedded browser's chrome.
- A source that is silent while recording is flagged (the log's per-device stream errors already exist to back this), so a wrong device choice is visible during the call, not after it.
- The browser chrome shows the same indicator and levels, driven by the main window's recording state through events.

## Capabilities

- `recording-feedback` (new): what the app shows about an active recording.

## Impact

- `desktop/src/pages/home/**` (meter, hero), `desktop/src/windows/browser-window.tsx`, events `record_level` (per device), `desktop/src-tauri/src/cmd/audio.rs` if the level event needs a device tag, locale catalogs, tests.
- No change to how audio is captured or transcribed.
