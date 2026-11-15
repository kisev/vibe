# Tasks

## 1. Browser windows

- [x] 1.1 Create the browser window manager: open an accepted https URL in a browser window, focus the existing window for the same URL, and close cleanly; verify each on Windows and that a failed creation reports to the caller — 2026-11-11: `meeting_browser.rs` opens a window per session, focuses the existing session for the same URL, finalizes the session on `Destroyed`, and returns a creation error to the caller (a toast from Settings, a dialog on a handed link). 2026-11-13: the per-session data directory was removed by `meeting-browser-rework` (see 1.4). 2026-11-15: Windows validated on the installed build in 7.x
- [x] 1.2 Build the app-owned chrome for the browser window with address, back, forward, reload, open-in-system-browser and close; verify it drives the page through commands/events and follows its navigation — 2026-11-11: `browser-chrome-<session>` loads `index.html?window=browser&session=…&toolbar=…&blocked=…`; address, back/forward/reload, open-external and close drive the page through the fixed command/event contract. 2026-11-13: the separate always-on-top bar window was rejected and replaced by this chrome webview above the page in the same window (`meeting-browser-rework`)
- [x] 1.3 Verify the page webview receives no injected scripts, has no app capabilities, and that camera/microphone prompts come only from the page — 2026-11-11: the page is built with `WebviewUrl::External` and never `eval`ed; permission prompts are the platform webview's own. 2026-11-13: `capabilities/main.json` grants the app's permissions only to `browser-chrome-*`, and the page shares the app's WebView2 environment because a second data directory is not supported in one process

## 2. Browser hosts

- [x] 2.1 Implement the host list with https-only host matching and add/remove in settings; verify matching unit tests and that a removed host is refused on its next navigation — 2026-11-11: normalization and https-only exact/subdomain matching implemented in Rust. 2026-11-14: `browser-allowlist` replaced the meeting-host list with `browser.allowedHosts` — no seeded defaults, the legacy `meeting.browserHosts` value migrated once, refused hosts recorded — and this allowlist is the gate that refuses a removed host
- [x] 2.2 Add the settings surface for the list; verify component tests for add, remove, and persistence — 2026-11-11: a Settings group in Recording with add/remove and validation. 2026-11-14: the group is **Allowed domains**, with **Blocked** and **Blocking policy** beside it; tests cover add, remove, invalid host, allowing a blocked host, policy save, and Open in Vibe

## 3. Deep-link handoff

- [x] 3.1 Route a meeting link handed over by the system through Rust validation, existing-window focus, and the browser window; verify an accepted URL opens once and a second invocation focuses instead of duplicating — 2026-11-11: `open_meeting_browser` validates https, parses the URL, and focuses an existing session for the same URL. 2026-11-15: `vibe://open/?url=` and its single-instance plumbing were dropped by `dev75-fixes`; an https launch argument and a registered meeting scheme now go through `open_meeting_link`, which opens the window for a host the browser may load and the system browser otherwise
- [x] 3.2 Report anything invalid or non-https instead of loading it; verify a failed handoff opens nothing — 2026-11-11: Rust rejects malformed/non-https with a message; the handoff path (`handOffMeetingLink`) shows it in a dialog and opens nothing. 2026-11-15: covered by `meeting-browser.test.ts`
- [x] 3.3 Add "Open in Vibe" for a pasted link inside the app; verify it uses the same validation path — 2026-11-11: the `openInVibe` field in the meeting settings calls `open_meeting_browser` for https and `open_meeting_link` for a meeting scheme; both go through the same Rust validation

## 4. Recording from the meeting browser

- [x] 4.1 Add the record action: start the existing recorder with the configured devices, show the indicator in the browser window and the main window, and stop from either; verify with a fake recorder and an already-running recording — 2026-11-11: the bar resolved devices like the main recorder, started `start_record`, and stopped with `stop_record`. 2026-11-13: the chrome only emits `meeting-browser-recording-toggle` and mirrors `meeting-browser-recording-state`; the main window's `MeetingBrowserRecordGate` owns `useRecording`, answers a state request when a chrome opens mid-recording, and guards the already-running case with `recording_active`
- [x] 4.2 On closing the window while its recording runs, ask stop-or-keep and verify both outcomes — 2026-11-11: content-window `CloseRequested` is prevented while `recording_active`; the main window asks stop-or-keep and calls `meeting_browser_confirm_close`. 2026-11-15: both answers are covered by `meeting-browser-close-gate.test.tsx`
- [x] 4.3 Show the record action in the browser chrome; verify a non-meeting page keeps plain navigation — 2026-11-11: the record action rendered only for a meeting host. 2026-11-14: the meeting classification was removed by `browser-allowlist`; the chrome shows its recording controls on every page it accepts, and the allowlist alone decides what loads

## 5. Detection integration

- [x] 5.1 Suppress the external meeting prompt while an in-app browser window is open and restore detection when the last one closes; verify an in-app call does not double-prompt and an external call still prompts — 2026-11-11: `meeting_prompt::set_in_app_session` suppresses the external prompt while a browser session is open and re-evaluates when it closes; 2026-11-14: this is per open browser window, whatever its host. 2026-11-15: `PromptLogic` is tested with the in-app flag on and off in `meeting_prompt.rs`

## 6. Docs, strings, and limits

- [x] 6.1 Document the handoff mechanism and its limit (custom scheme vs https clicks; default browser out of scope), local recording, and host configuration; verify the doc matches the implementation — 2026-11-11: `docs/MEETING-BROWSER.md` documented the scheme handoff, the https-click limit, local recording, and the host list. 2026-11-15: the docs are `docs/reference/meeting-browser.md`, `docs/how-to/use-the-meeting-browser.md` and `docs/explanation/meeting-browser.md`; they document the meeting-scheme handoff and the allowlist
- [x] 6.2 Add the new UI strings in en-US and translate them through the normal flow; verify `task i18n:audit` passes — 2026-11-11: 33 keys in en-US plus all 21 desktop locales; parity 804/804, `task i18n:audit` passes

## 7. Validation

- [x] 7.1 Windows: open a Telemost link, join a call, press record in the chrome, verify the timer and per-source levels, stop, and check the transcript covers both sides (2026-11-15: confirmed by the maintainer on the installed local build — Telemost call recorded from the chrome; timer, levels and both sides in the transcript.)
- [x] 7.2 Windows: allow stream.wb.ru in the settings, open a call there, verify the chrome sits above the page; remove the domain and verify navigation to it is refused with the blocked notice and its Allow action (2026-11-15: confirmed by the maintainer on the installed local build — an allowlisted call opened with the chrome above the page; removing the domain blocked navigation with the notice (silence-marker timing filed separately).)
- [x] 7.3 Fallback checks: a host outside the allowlist is refused with the blocked-navigation notice, and the app's external-call prompt still appears for a call it does not host (2026-11-15: confirmed by the maintainer on the installed local build — the fallback checks behaved as described.)

## 8. Live acceptance (user checkpoints)

- [x] 8.1 The user opens a meeting link in Vibe, confirms the call itself works (audio/video), presses record in the chrome without switching windows, and reports whether the flow removes the "forgot to record" problem (2026-11-15: confirmed by the maintainer on the installed local build — the maintainer opened a call in Vibe and recorded without switching windows.)
- [x] 8.2 The user checks the chrome's controls and placement in a real call — device pickers, record, timer — and reports what should change (2026-11-15: confirmed by the maintainer on the installed local build — the chrome's controls and placement were used in a real call; the silence-marker remarks came from it.)
- [x] 8.3 The user verifies the recording contains both sides of the conversation and that closing the browser window ends the session cleanly; report findings before archiving (2026-11-15: confirmed by the maintainer on the installed local build — the recording held both sides and closing the window ended the session cleanly.)

## Workflow follow-up

- Optional auto-record per host is a separate future change; it is not part of this one.
- [x] 1.4 2026-11-13: the per-session data directory was removed by `meeting-browser-rework` — WebView2 does not support a second environment in one process, and the attempt left the content window blank with the app unresponsive; the content webview now shares the app's environment.
