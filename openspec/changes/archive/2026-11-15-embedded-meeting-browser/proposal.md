# Proposal

## Why

Meeting links (telemost.yandex.ru, stream.wb.ru, and whatever the user adds) open in the system browser, so Vibe can only guess from running browser processes that a call is happening and then ask to record. Hosting the meeting page inside Vibe makes the call a first-class app session: the app knows the meeting started, the window belongs to it, and recording can start with it.

## What Changes

- An in-app browser window built on the platform webview (WebView2 on Windows, the same engine as Chrome and Edge) that opens an accepted link — a meeting URL, a service dashboard, anything the user pastes or the system hands it. Its chrome (address/back/forward/reload, open in system browser, close) sits above the page in the same window.
- Hosts the user allows in the browser's host list get a browser chrome with a prominent **Record this call** action, so joining a call in Vibe makes pressing record the obvious next step instead of something to remember after switching windows. Recording stays manual in this iteration.
- A configurable host list in settings (later the browser's allowlist, `browser-allowlist`), plus a handoff through the schemes meeting apps already invoke: an installed desktop app cannot take over `https` links from a browser unless it is the default browser or the site itself invokes the app's scheme (that is exactly how Zoom (`zoommtg://`), Teams (`msteams://`), Mattermost (`mattermost://`) and the Telemost desktop app work — their own pages or installers call their scheme). This change therefore ships the mechanisms Vibe can honestly own: other applications' meeting schemes behind an opt-in switch, an `https` launch argument, and an in-app browser. Becoming the default browser is left out of scope.
- Meeting detection integration: an open in-app browser window suppresses the duplicate external-browser prompt; detection of calls in other browsers keeps working unchanged.
- Security and privacy: the page shares the app's webview environment (WebView2 allows no second data directory in one process) but has no app capabilities, never captures credentials, receives no injected scripts, and grants camera/microphone permissions only through the page's own prompts.

## Capabilities

### New Capabilities

- `meeting-browser`: in-app meeting windows, the host list and its settings, the meeting-scheme and launch-argument handoff and its validation, the recording lifecycle, isolation, and interaction with existing meeting detection.

### Modified Capabilities

## Impact

- Desktop Rust: a webview-window manager, single-instance and meeting-scheme routing, host-list config, meeting lifecycle events, recorder start/stop integration, and platform capability fallbacks.
- Desktop UI: browser chrome, settings surface for the host list, recording indicator, stop-or-keep prompt, i18n.
- Platform constraints: WebView2 on Windows, WKWebView on macOS, WebKitGTK on Linux; Windows is validated first, other platforms fall back to the system browser if the window cannot host the call.
- No server change; recording uses the existing pipeline and devices.
