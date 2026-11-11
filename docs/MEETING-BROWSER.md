# Meeting browser

Vibe can host a call in its own Chromium window (WebView2 on Windows, WKWebView on macOS,
WebKitGTK on Linux) with a small always-on-top bar that has one job: **Record this call**.

## How a link reaches Vibe

A browser never hands an `https://` link to an installed app unless that app is the default
browser. Desktop meeting apps work the other way around: they register their own scheme
(`zoommtg://`, `msteams://`, `mattermost://`) and their own pages or installers invoke it. Vibe
owns the same honest mechanism:

- `vibe://open/?url=https://…` opens the target in Vibe's browser window. Any app, script, or
  shortcut can call it; the app validates the URL (https only, well formed) in Rust and refuses
  anything else with a dialog.
- Inside the app, Settings → Recording → **Open in Vibe** pastes a link into the same path.
- Clicking an `https` link in Chrome/Edge/Firefox still opens that browser. Vibe becoming the
  default browser is deliberately out of scope.

## What the bar does

The content window is an ordinary webview with its own data directory: service cookies never mix
with the app's storage, no scripts are injected into the page, and camera/microphone prompts come
from the page itself. The bar offers address, back, forward, reload, close, and "Open in system
browser" as an escape hatch if a service refuses to run in the embedded webview.

Hosts in the meeting list make the window a meeting session: the bar shows **Record this call**,
and while that session is open the external-browser meeting prompt is suppressed. Recording is
manual — press the button before or during the call; stop it from the bar or from the main window,
and closing the window while recording asks whether to stop or keep recording in the background.
The recorder captures the configured microphone and, when enabled, the system-audio loopback, so
both sides of the call are in the recording.

The default hosts are `telemost.yandex.ru` and `stream.wb.ru`; the list is editable in
Settings → Recording → Meeting hosts. Removing a host keeps its links openable — they just lose the
meeting bar.

## Limits

- Only `vibe://open/` links open automatically; `https` clicks need the default-browser decision.
- DRM-heavy or WebRTC-hostile sites may still work better in the system browser; the bar's escape
  hatch is the supported fallback.
- Windows is validated first; the other platforms use their own webviews and fall back to the
  system browser if the window cannot host the call.
