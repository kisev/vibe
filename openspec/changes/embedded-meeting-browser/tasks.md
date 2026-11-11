# Tasks

## 1. Meeting window

- [ ] 1.1 Create the meeting window manager: open a URL in an app-chrome window with a child webview (Windows), a standalone webview window fallback, or the system browser; verify each rung of the fallback ladder manually
- [ ] 1.2 Implement navigation controls (address, back, forward, reload) and external-host handling on every navigation and redirect; verify an off-allowlist hop opens externally and the meeting window stays put
- [ ] 1.3 Use a separate webview data directory for meeting content and add a settings action to clear it; verify cookies from the meeting partition do not appear in the app partition

## 2. Host allowlist

- [ ] 2.1 Implement the host entries (`{host, autoRecord}`, exact or `*.` suffix, https only) with defaults for telemost and stream.wb.ru; verify matching and non-https rejection with unit tests
- [ ] 2.2 Add the settings surface to add, remove, and toggle auto-record per host; verify component tests and that removing a host stops routing to the window

## 3. Deep-link handoff

- [ ] 3.1 Route `vibe://open/?url=` through Rust validation, existing-window focus, and the meeting window; verify an allowed URL opens/focuses and a second invocation does not spawn a duplicate
- [ ] 3.2 Confirm non-allowed hosts and non-https schemes before any load, defaulting to the system browser; verify declining leaves the app untouched
- [ ] 3.3 Add the "Open in Vibe" action inside the app for pasted links; verify it uses the same validation path

## 4. Recording lifecycle

- [ ] 4.1 Start recording for a session on an auto-record host after the one-time per-host confirmation, and refuse when a recording already runs; verify with a fake recorder and a second session attempt
- [ ] 4.2 Show the recording indicator in the meeting window and the main window; verify the indicator appears, names the meeting, and clears on stop
- [ ] 4.3 Stop recording when the window closes or the session leaves the host past the grace period, producing a normal transcript; verify both endings

## 5. Detection integration

- [ ] 5.1 Suppress the external meeting prompt while an in-app session runs and restore detection when it closes; verify an in-app call does not double-prompt and an external call still prompts

## 6. Security, docs, strings

- [ ] 6.1 Verify the meeting webview receives no injected scripts, the URL is validated before creation, and camera/microphone permissions come only from the page's own prompts
- [ ] 6.2 Document the interception limits (no default-browser takeover in this change), local recording, and host configuration; add the UI strings in en-US and translate them; verify `task i18n:audit` passes

## 7. Validation

- [ ] 7.1 Windows end-to-end on telemost.yandex.ru: open a link, join a call, verify auto-record with indicator, stop on close, transcript produced
- [ ] 7.2 Windows end-to-end on stream.wb.ru with a second host added by the user; verify the allowlist is what routes it
- [ ] 7.3 Fallback checks: a host that cannot be hosted opens externally with a notice, and an external call still triggers the existing prompt
