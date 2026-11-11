# Proposal

## Why

Meeting links (telemost.yandex.ru, stream.wb.ru, and whatever the user adds) open in the system browser, so Vibe can only guess from running browser processes that a call is happening and then ask to record. Hosting the meeting page inside Vibe makes the call a first-class app session: the app knows the meeting started, the window belongs to it, and recording can start with it.

## What Changes

- An in-app meeting browser: a Vibe window that loads a meeting URL in the platform webview with minimal chrome (address, back/forward/reload), an isolated browser profile, and navigation restricted to configured hosts. Links to other hosts open in the system browser.
- A configurable host list in settings (defaults: `telemost.yandex.ru`, `stream.wb.ru`), each entry optionally marked to start recording automatically.
- A `vibe://open/?url=…` handoff, reusing the app's existing `vibe://` registration and single-instance forwarding: the app validates the URL, opens an allowed meeting in the meeting window, and otherwise asks before handing it to the system browser. The same action is available as "Open in Vibe" from inside the app.
- Honest scope of interception: browsers only hand an `https` link to Vibe when Vibe is the default browser or a companion extension is installed. The desktop-app pattern the user described works for services that register their own protocol; Vibe cannot claim `telemost://` or an equivalent. This change ships the in-app window and the `vibe://` handoff; default-browser/extension interception is a documented follow-up, not part of this change.
- Auto-record with consent: entering a meeting on an allowed host with auto-record enabled starts the existing recorder (system audio + microphone), shows a recording indicator in the meeting window and the main window, and stops when the meeting ends or the window closes. The first automatic recording per host asks for confirmation once.
- Meeting detection integration: an in-app meeting session suppresses the duplicate external-browser prompt; detection of external calls keeps working unchanged.
- Security and privacy: the meeting webview uses its own data partition, never captures credentials, does not inject scripts into the page, and grants camera/microphone permissions only through the page's own prompts.

## Capabilities

### New Capabilities

- `meeting-browser`: in-app meeting windows, the host allowlist and its settings, deep-link handoff and validation, auto-record consent and lifecycle, isolation, and interaction with existing meeting detection.

### Modified Capabilities

## Impact

- Desktop Rust: a webview-window manager, deep-link and single-instance routing for `vibe://open/`, host allowlist config, meeting lifecycle events, recorder start/stop integration, and platform capability fallbacks.
- Desktop UI: meeting window chrome, settings surface for hosts and auto-record, recording indicator, consent prompts, i18n.
- Platform constraints: WebView2 on Windows, WKWebView on macOS, WebKitGTK on Linux; Windows is validated first, other platforms fall back to the system browser if the window cannot host the call.
- No server change; recording uses the existing pipeline and devices.
