# Proposal

## Why

The meeting prompt is supposed to notice that a call started and offer to record it. In a real test it did not fire: Zoom's desktop client held the microphone for the whole call, detection was enabled and Vibe had just been restarted. The signal it relies on is narrow — on Windows a registry entry the consent store writes, on other platforms similarly indirect — and the supported set is three sources (Zoom, Teams, Meet in a browser). Nothing about the failure is visible to the person: no status in the settings, no log in reach, and the code's own diagnostics sit in a file nobody knows about.

The product has three kinds of people, and each needs a different thing from this feature:

- those who meet in the native app of the service (Zoom, Teams, Telegram, Telemost, Stream) — for them the feature must notice the app and offer the recording;
- those who want Vibe to be the place a meeting happens, in its embedded browser — for them the prompt must stay out of the way, because Vibe already knows;
- those who press record themselves — for them nothing may get in the way.

The first group is the one this change serves, and it needs a signal that is reliable on every platform we ship, a delay the person can tune, and enough visibility to trust it.

## What Changes

- The detector stops depending on a single indirect platform quirk: each platform reports which process currently holds a capture device, through the audio stack itself, and the app map attributes that process to a supported service.
- Supported services become Zoom, Teams, Telegram, Telemost and Stream, in their desktop clients; browser meetings are attributed by window title as today.
- A detected meeting brings Vibe forward and offers to record after a configurable delay (ten seconds by default), so a call that starts with a quick check-in does not interrupt the person.
- The settings section says what the option does and who it is for, shows whether detection is running and what it last saw, and offers the log path — so "it does not work" can be investigated without guessing.
- The suppressed-by-design cases are stated: Vibe's own recording, and a meeting opened in Vibe's embedded browser.

## Capabilities

- `meeting-detection` (new): noticing that a supported app started a call, and the prompt that follows.

## Impact

- `crates/meeting-detect` (platform signals, attribution, debouncing), `desktop/src-tauri/src/meeting_prompt.rs` (worker, prompt window, delay setting), the recording settings section and its catalogs, docs for the three user types.
- On macOS the per-process signal needs newer CoreAudio APIs; the fallback is the device-running flag plus the frontmost app, which is weaker and must say so.

## Non-Goals

- Detecting a call from "any application holds the microphone": too many false positives (dictation, voice chat, recorders) and the maintainer rejected it.
- Telemetry. Diagnostics are local and the person decides what to send.
- Recording itself: this change only decides when to offer it.
