# Design

## Context

See `proposal.md` — Why. The existing detector (`crates/meeting-detect`) polls a platform signal and classifies the owner: Zoom and Teams by process identity, Meet by browser window title. The prompt is a separate window in `meeting_prompt.rs`, started only when `recording.meetingDetectionEnabled` is on, and suppressed while the embedded browser holds a session.

## Decision: the audio stack names the process, the app map names the service

Asking the operating system who holds a capture device is the only signal that follows the product requirement ("if a supported app starts using the microphone"). Window titles alone miss an app whose call window is hidden or titled unusually; a registry entry only exists on Windows and only when the consent broker writes one.

| Platform | Signal | Notes |
|---|---|---|
| Windows | Core Audio capture sessions on the input device: `IAudioSessionManager2` → `IAudioSessionEnumerator` → `IAudioSessionControl2::GetProcessId` | The registry consent store stays as a fallback when no session reports a pid |
| Linux | PipeWire/PulseAudio `source-outputs`: `application.process.binary`, `application.name` | Works for both backends through `pactl`/`pw-dump`; no privileges needed |
| macOS | CoreAudio process taps where available (14.4+); otherwise `kAudioDevicePropertyDeviceIsRunningSomewhere` for "the microphone is live" | The fallback cannot name the process; the frontmost app is used for attribution and the settings say the signal is approximate |

Attribution is a table from process identity to service (Zoom, Teams, Telegram, Telemost, Stream) plus, for a browser owner, a window-title scan as today.

## Decision: the prompt waits, and the wait is a setting

A meeting that starts with a five-second "can you hear me" should not pull the window forward. The worker reports the onset immediately, but the prompt appears only after `recording.meetingPromptDelaySeconds` (default 10, 0–120) has passed with the same attribution; losing the attribution or the microphone cancels the pending prompt. The delay is part of the detection state machine, not a UI timer, so a re-detected meeting does not restart it twice.

## Decision: what suppresses the prompt

- A running Vibe recording: the microphone belongs to Vibe, and offering to record again is noise.
- A meeting open in the embedded browser: Vibe already knows, and that is the second user type.
- The person dismissed this meeting: until the call ends.

## Diagnostics

The settings section shows: whether the detector is running, the last observation (service and time, or "nothing yet"), and a button that reveals the current log file. Logs stay local.

A separate follow-up change should add a "prepare a debug bundle" action (logs, settings with secrets removed, versions, platform) that the person attaches to a GitHub issue themselves. It is deliberately not part of this change: it is generic to every bug report and deserves its own spec.

## Alternatives considered

- **Window presence only.** Cheap and cross-platform, but a docked call window that never takes the microphone would trigger, and a full-screen call with an odd title would not.
- **"Any app holds the microphone".** Rejected by the maintainer: dictation, voice chat and recorders would constantly offer a recording.
- **Polling the registry on Linux/macOS equivalents.** There is no equivalent; the audio stack is the portable answer.

## Risks

- macOS before 14.4 cannot name the process; detection there is "microphone is live" plus the frontmost app, which can misattribute. The settings must say so rather than pretend.
- A service that opens the microphone in a helper process (Telegram calls, some Teams builds) needs its helper in the app map; the map is data, so adding one is cheap.
- Reading capture sessions has cost; the poll cadence keeps the cheap signal first and the expensive enumeration only when something changed.
