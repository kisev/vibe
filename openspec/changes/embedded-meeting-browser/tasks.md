# Tasks

## 1. Browser windows

- [ ] 1.1 Create the content window manager: open any https URL in a standalone `WebviewWindow` with its own data directory, focus an existing window for the same URL, and close cleanly; verify each on Windows and that a failed creation falls back to the system browser with a notice
- [ ] 1.2 Build the always-on-top meeting bar window (pattern: `meeting_prompt.rs`) with address, back, forward, reload, and close; verify it drives the content window through commands/events and follows its navigation
- [ ] 1.3 Verify the content webview receives no injected scripts, keeps cookies in its own partition, and that camera/microphone prompts come only from the page

## 2. Meeting hosts

- [ ] 2.1 Implement the meeting-host list (defaults `telemost.yandex.ru`, `stream.wb.ru`) with https-only host matching and add/remove in settings; verify matching unit tests and that a removed host keeps the link openable without meeting affordances
- [ ] 2.2 Add the settings surface for the list; verify component tests for add, remove, and persistence

## 3. Deep-link handoff

- [ ] 3.1 Route `vibe://open/?url=` through Rust validation (https, well-formed), existing-window focus, and the content window; verify an allowed URL opens once and a second invocation focuses instead of duplicating
- [ ] 3.2 Ask before loading anything invalid or non-https; verify declining leaves the app untouched
- [ ] 3.3 Add "Open in Vibe" for a pasted link inside the app; verify it uses the same validation path

## 4. Recording from the meeting bar

- [ ] 4.1 Add the record action: start the existing recorder with the configured devices, show the indicator in the bar and the main window, and stop from either; verify with a fake recorder and an already-running recording
- [ ] 4.2 On closing the content window while its recording runs, ask stop-or-keep and verify both outcomes
- [ ] 4.3 Show the meeting state in the bar only for hosts on the list; verify a non-meeting link shows plain navigation

## 5. Detection integration

- [ ] 5.1 Suppress the external meeting prompt while an in-app session runs and restore detection when the window closes; verify an in-app call does not double-prompt and an external call still prompts

## 6. Docs, strings, and limits

- [ ] 6.1 Document the interception mechanism and its limit (custom scheme vs https clicks; default browser out of scope), local recording, and host configuration; verify the doc matches the implementation
- [ ] 6.2 Add the new UI strings in en-US and translate them through the normal flow; verify `task i18n:audit` passes

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
