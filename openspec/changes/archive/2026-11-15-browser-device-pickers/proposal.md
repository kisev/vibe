# Proposal

## Why

The embedded browser can start a recording, but the microphone and speaker are only selectable in the main window's settings. On a call the user has to leave the meeting window, change devices and come back — and the current device choice is invisible in the browser, which is exactly where the mistake is noticed.

## What Changes

- The browser chrome gains microphone and speaker pickers, reading and writing the same configuration the main window uses, with the currently selected devices named.
- The pickers are disabled while a recording runs and show the sources that will be captured.
- Optional per-source preview: a short level check before recording, so the choice is confirmed by sound, not by a label.

## Capabilities

- `meeting-browser` (existing): the embedded browser and its chrome.

## Impact

- `desktop/src/windows/browser-window.tsx`, `desktop/src/lib/meeting-browser.ts`, `desktop/src-tauri/src/meeting_browser.rs` (device lists for a chrome-only webview: either events from the main window or a small command), config keys, tests, docs.
