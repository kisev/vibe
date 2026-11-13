# Use the meeting browser

Vibe can host a call in its own Chromium-based window: the app's chrome (address, back, forward, reload, open-external, close and **Record this call**) sits at the top, and the page fills the rest of that same window. There is no separate bar window. See [Meeting browser reference](../reference/meeting-browser.md) for the URL schemes and defaults, and [the explanation](../explanation/meeting-browser.md) for why the mechanism works this way.

## Open a call in Vibe

Use one of these paths:

- From another app, script, or shortcut: `vibe://open/?url=https://…`. Vibe validates that the URL is https and well formed and refuses anything else with a dialog.
- Inside Vibe: **Settings → Recording → Open in Vibe**, paste the link.
- Keep the link on a configured meeting host to get the **Record this call** action in the chrome. Any other https link opens in the same single browser window without the record action.

Clicking an https link in Chrome, Edge, or Firefox still opens that browser. Vibe does not register as the default browser.

## Record a call

1. Open the meeting in Vibe.
1. Press **Record this call** in the window's chrome before or during the call.
1. Stop from the chrome or from the main window.

Recording is manual; a meeting window never starts recording on its own. The recorder captures the configured microphone and, when enabled, the system-audio loopback, so both sides of the call are recorded.

Closing the window while recording asks whether to stop or keep recording in the background.

## Manage meeting hosts

**Settings → Recording → Meeting hosts** lists the hosts that get the **Record this call** action. The defaults are `telemost.yandex.ru` and `stream.wb.ru`.

- Add a host to make its links recordable sessions.
- Remove a host to lose the record action; its links still open in the browser window.

Host matching is by host name over https, so `sub.telemost.yandex.ru` matches a `telemost.yandex.ru` entry while an `http` URL does not.

## Fall back to the system browser

If a service refuses to run in the embedded webview, use **Open in system browser** in the chrome. The system browser is the supported fallback for DRM-heavy or WebRTC-hostile sites.

On macOS the embedded browser has no in-window chrome: the page opens in a page-only window, recording stays available from the main window, and the system browser is the fallback for the whole call.
