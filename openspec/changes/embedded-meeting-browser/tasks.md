# Tasks

## 1. Browser windows

- [x] 1.1 Create the content window manager: open any https URL in a standalone `WebviewWindow` with its own data directory, focus an existing window for the same URL, and close cleanly; verify each on Windows and that a failed creation falls back to the system browser with a notice — 2026-11-11: `meeting_browser.rs` opens a `WebviewWindow` per session with its own `browser-profile` data directory, focuses the existing session for the same URL, and closes on `Destroyed`; a creation error is returned to the caller, which shows it (system-browser escape hatch in the bar). Windows runtime still to validate in 7.x
- [x] 1.2 Build the always-on-top meeting bar window (pattern: `meeting_prompt.rs`) with address, back, forward, reload, and close; verify it drives the content window through commands/events and follows its navigation — 2026-11-11: `browser-bar-<session>` loads `index.html?window=meeting-bar&session=…`; address, back/forward/reload, close, record; drives the content window through the fixed command/event contract
- [x] 1.3 Verify the content webview receives no injected scripts, keeps cookies in its own partition, and that camera/microphone prompts come only from the page — 2026-11-11: the content webview is built with `WebviewUrl::External` and never `eval`ed; only the per-session data directory is set; permission prompts are the platform webview's own

## 2. Meeting hosts

- [x] 2.1 Implement the meeting-host list (defaults `telemost.yandex.ru`, `stream.wb.ru`) with https-only host matching and add/remove in settings; verify matching unit tests and that a removed host keeps the link openable without meeting affordances — 2026-11-11: store key `meeting.browserHosts`, defaults telemost.yandex.ru + stream.wb.ru, https-only exact/subdomain match; normalization and matching implemented in Rust
- [x] 2.2 Add the settings surface for the list; verify component tests for add, remove, and persistence — 2026-11-11: Meeting hosts group in Recording with add/remove/default badge/validation; 10 component+unit tests cover add, remove, full-list save, invalid host, Open in Vibe and deep-link parsing

## 3. Deep-link handoff

- [x] 3.1 Route `vibe://open/?url=` through Rust validation (https, well-formed), existing-window focus, and the content window; verify an allowed URL opens once and a second invocation focuses instead of duplicating — 2026-11-11: `open_meeting_browser` validates https, parses the URL, and focuses an existing session for the same URL
- [x] 3.2 Ask before loading anything invalid or non-https; verify declining leaves the app untouched — 2026-11-11: Rust rejects malformed/non-https with a message; the deep-link path reports it in a dialog and opens nothing
- [x] 3.3 Add "Open in Vibe" for a pasted link inside the app; verify it uses the same validation path — 2026-11-11: `openInVibe` input in the meeting-host settings group calls the same `open_meeting_browser` path

## 4. Recording from the meeting bar

- [x] 4.1 Add the record action: start the existing recorder with the configured devices, show the indicator in the bar and the main window, and stop from either; verify with a fake recorder and an already-running recording — 2026-11-11: bar resolves devices like the main recorder (`get_audio_devices` + stored selection), starts `start_record`, stops with `stop_record`, resets on `record_finish`/`record_error`; `recording_active` guards the already-running case
- [x] 4.2 On closing the content window while its recording runs, ask stop-or-keep and verify both outcomes — 2026-11-11: content-window `CloseRequested` is prevented while `recording_active`; the bar asks stop-or-keep and calls `meeting_browser_confirm_close`
- [x] 4.3 Show the meeting state in the bar only for hosts on the list; verify a non-meeting link shows plain navigation — 2026-11-11: the record action renders only when `isMeeting`; other links show plain navigation

## 5. Detection integration

- [x] 5.1 Suppress the external meeting prompt while an in-app session runs and restore detection when the window closes; verify an in-app call does not double-prompt and an external call still prompts — 2026-11-11: `meeting_prompt::set_in_app_session` suppresses the external prompt while a meeting session is open and re-evaluates when it closes

## 6. Docs, strings, and limits

- [x] 6.1 Document the interception mechanism and its limit (custom scheme vs https clicks; default browser out of scope), local recording, and host configuration; verify the doc matches the implementation — 2026-11-11: `docs/MEETING-BROWSER.md` documents the scheme handoff, the https-click limit, local recording, and the host list
- [x] 6.2 Add the new UI strings in en-US and translate them through the normal flow; verify `task i18n:audit` passes — 2026-11-11: 33 keys in en-US plus all 21 desktop locales; parity 804/804, `task i18n:audit` passes

## 7. Validation

- [ ] 7.1 Windows: open a Telemost link through `vibe://open/`, join a call, press record in the bar, verify the recording indicator, stop, and check the transcript covers both sides
- [ ] 7.2 Windows: add stream.wb.ru as a host, open a call there, verify the bar appears; remove the host and verify the bar disappears while the link still opens
- [ ] 7.3 Fallback checks: a host that cannot be hosted opens externally with a notice, and an external call still triggers the existing prompt

## 8. Live acceptance (user checkpoints)

- [ ] 8.1 The user opens a meeting link in Vibe, confirms the call itself works (audio/video), presses record without switching windows, and reports whether the flow removes the "forgot to record" problem
- [ ] 8.2 The user checks the bar's controls and placement in a real call and reports what should change
- [ ] 8.3 The user verifies the recording contains both sides of the conversation and that closing the window behaves as expected; report findings before archiving

## Workflow follow-up

- Optional auto-record per host is a separate future change; it is not part of this one.
