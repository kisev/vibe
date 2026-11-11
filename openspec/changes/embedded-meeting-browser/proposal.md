# Proposal

## Why

Meeting links (telemost.yandex.ru, stream.wb.ru, and whatever the user adds) open in the system browser, so Vibe can only guess from running browser processes that a call is happening and then ask to record. Hosting the meeting page inside Vibe makes the call a first-class app session: the app knows the meeting started, the window belongs to it, and recording can start with it.

## What Changes

- An in-app browser window built on the platform Chromium webview (WebView2 on Windows, the same engine as Chrome and Edge) that can open any link — a meeting URL, a service dashboard, anything the user pastes. It has address/back/forward/reload controls and an isolated browser profile.
- Hosts the user marks as meeting hosts (defaults: `telemost.yandex.ru`, `stream.wb.ru`) get a meeting bar with a prominent **Record this call** action, so joining a call in Vibe makes pressing record the obvious next step instead of something to remember after switching windows. Recording stays manual in this iteration.
- A configurable host list in settings, plus the app's existing `vibe://` deep-link scheme extended with `vibe://open/?url=…`: an installed desktop app cannot take over `https` links from a browser unless it is the default browser or the site itself invokes the app's scheme (that is exactly how Zoom (`zoommtg://`), Teams (`msteams://`), Mattermost (`mattermost://`) and the Telemost desktop app work — their own pages or installers call their scheme). This change therefore ships the mechanism Vibe can honestly own: a registered `vibe://` handoff plus an in-app Chromium browser that opens any link. Becoming the default browser is left out of scope.
- Meeting detection integration: an in-app meeting window suppresses the duplicate external-browser prompt; detection of calls in other browsers keeps working unchanged.
- Security and privacy: the browser window uses its own data partition, never captures credentials, does not inject scripts into pages, and grants camera/microphone permissions only through the page's own prompts.

## Capabilities

### New Capabilities

- `meeting-browser`: in-app meeting windows, the host allowlist and its settings, deep-link handoff and validation, auto-record consent and lifecycle, isolation, and interaction with existing meeting detection.

### Modified Capabilities

## Impact

- Desktop Rust: a webview-window manager, deep-link and single-instance routing for `vibe://open/`, host allowlist config, meeting lifecycle events, recorder start/stop integration, and platform capability fallbacks.
- Desktop UI: meeting window chrome, settings surface for hosts and auto-record, recording indicator, consent prompts, i18n.
- Platform constraints: WebView2 on Windows, WKWebView on macOS, WebKitGTK on Linux; Windows is validated first, other platforms fall back to the system browser if the window cannot host the call.
- No server change; recording uses the existing pipeline and devices.
