# Design

## Context

The app already registers the `vibe` URL scheme and forwards second-instance invocations (`use-deep-links.tsx`, `use-single-instance.tsx`), creates auxiliary windows with `WebviewWindowBuilder` (`meeting_prompt.rs`, `dictation_indicator.rs`), detects external meetings from browser processes, and records several devices at once — input and loopback streams are merged by ffmpeg in `start_record` (`cmd/audio.rs`), so both sides of a call are available in one recording. Tauri is v2.10 without the `unstable` feature, so child webviews are not available; a standalone `WebviewWindow` is.

See `proposal.md` and `specs/meeting-browser/spec.md`.

## How link interception actually works

Desktop apps that appear to "own" their links register their own URL scheme, and their own web pages or installers invoke it: Zoom uses `zoommtg://`/`zoomus://`, Teams `msteams://`, Mattermost `mattermost://`, Telegram `tg://`; the Telemost desktop client does the same with its own scheme. When a page calls such a scheme, the browser asks to open the app — which is why the result feels like an OS-level integration. Windows' "Apps for websites" association is the other route, but it requires the website to declare the app, which a third party cannot do for telemost.yandex.ru or stream.wb.ru.

A browser never hands an `https://` link to an installed app unless that app is the default browser. Vibe therefore owns exactly one honest mechanism here: `vibe://`. This change registers `vibe://open/?url=…`, accepts it from other apps and scripts, and opens the target in Vibe's own Chromium browser. Direct link clicks from a browser remain out of reach unless Vibe is made the default browser, which is deliberately out of scope.

## Goals / Non-Goals

**Goals:**

- Any link opens in a real Chromium window inside Vibe, with ordinary browser controls.
- A meeting host turns the window into a record-ready session with one visible action.
- No new trust surface: the content page gets no injected scripts and its own storage.

**Non-Goals:**

- Capturing `https` clicks from the system browser.
- Automatic recording; recording stays one click in this iteration.
- Extensions, default-browser takeover, or per-site scraping to detect call state.
- Script injection or automatic logins.

## Decisions

- **Two windows: content and a meeting bar.** The content is a standalone `WebviewWindow` loading the URL (WebView2 on Windows, the same Chromium engine as Chrome and Edge; WKWebView/WebKitGTK elsewhere). A small always-on-top "meeting bar" window, built like the existing meeting-prompt/dictation windows, holds the trusted app UI: address, back, forward, reload, record/stop, and the recording indicator. The bar drives the content window through Tauri commands and listens to its navigation events. Alternatives considered: enabling `tauri/unstable` for an embedded child webview (rejected for build risk and unstable API), and a bare OS window with no chrome (rejected: no address bar, no one-click record).

- **Any URL is allowed in the content window; the host list only decides what is a meeting.** Opening a random link behaves like a minimal browser. Hosts in the meeting list (defaults telemost.yandex.ru, stream.wb.ru) make the bar show "Record this call" and the in-app-session state that suppresses the external prompt. Removing a host keeps the link openable but drops the meeting affordances. This keeps the allowlist a UX filter, not a security boundary.

- **Recording is a manual action in the bar.** "Record this call" starts the existing recorder with the user's configured devices (microphone and, when enabled, the system-audio loopback), the indicator appears in both the bar and the main window, and a second action stops. If another recording is already running, the bar shows the active state instead. Closing the window while its recording runs asks whether to stop or keep recording. Automatic start is a separate, later decision.

- **Deep links are validated before any window opens.** `vibe://open/?url=` is parsed in Rust, the scheme must be `https`, the URL must be well formed, and the app focuses an existing window for the same URL instead of spawning duplicates. Invalid input asks before doing anything. Because any local process can invoke `vibe://`, validation is the only gate and nothing is auto-recorded from a link.

- **Isolation is per-window storage, within what WebView2 allows.** A second WebView2 environment with its own data directory is not supported in one process: the attempt left the window blank and the app unresponsive on Windows, so the content webview shares the app's environment (`meeting-browser-rework`). Vibe never reads page credentials. Camera and microphone permissions are the platform webview's own prompts. The bar is app UI and holds no page content.

- **Meeting detection suppression is state-driven.** While an in-app meeting window is open on a meeting host, `meeting_prompt.rs` suppresses the external prompt for that session; when the window closes, detection resumes. External-browser calls behave exactly as they do today.

## Risks / Trade-offs

- [Sites refuse embedded webviews or degrade WebRTC] → The window is a normal Chromium webview with its own storage; if a service still fails, the bar offers "Open in system browser" as an escape hatch.
- [Two windows are clumsier than a single app window] → The bar is small, always-on-top while the meeting window is focused, and can be collapsed; it is the price of not shipping an unstable embedded-webview API.
- [Direct https clicks still open in the system browser] → Documented plainly, with the `vibe://` handoff and the in-app browser as the supported paths; default-browser takeover stays a future, explicit decision.
- [A recording keeps running after the call ends] → The indicator is visible in both windows and closing the window prompts; stopping is one click.
- [Platform differences] → Windows is validated first; macOS/Linux create the window where the webview supports the site and otherwise fall back to the system browser.

## Migration Plan

1. Ship the browser window and bar with the default host list; recording stays manual.
1. Extend the deep-link and single-instance paths to `vibe://open/?url=`.
1. Wire the in-app session state into meeting detection.
1. Validate on Windows with Telemost and stream.wb.ru; other platforms fall back gracefully.

## Open Questions

- Whether the bar should be a separate window or a toolbar row rendered by the main window's frontend on top of the meeting window; the two-window approach is the least risky today.
- Whether a later iteration should offer optional auto-record per host, now explicitly out of scope.
