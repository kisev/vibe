# Use the meeting browser

Vibe can host a call in its own window with an always-on-top bar whose main action is **Record this call**. The window uses the platform webview; [Why the meeting browser works this way](/vibe/docs#meeting-browser) covers the isolation and the limits.

## Open a call in Vibe

Use one of these paths:

- Open **Settings → Recording → Open in Vibe**, paste the link, and open it.
- From another app, script, or shortcut, call `vibe://open/?url=https://…`. Vibe accepts only well-formed https URLs and refuses anything else with a dialog.
- Turn on **Open meeting links in Vibe** under **Settings → Recording** to register Zoom, Teams, and Webex links. This is available on Windows and Linux, not macOS.

Clicking an https link in Chrome, Edge, or Firefox still opens that browser. Vibe does not register as the default browser.

## Get the recording bar

**Settings → Recording → Meeting hosts** lists the hosts that get the meeting bar. The defaults are `telemost.yandex.ru` and `stream.wb.ru`.

- Add a host to make its links recordable sessions.
- Remove a host to lose the bar; its links still open in the browser window.

Matching is by host name over https, so `sub.telemost.yandex.ru` matches a `telemost.yandex.ru` entry while an `http` URL does not. The list is a convenience filter, not a security boundary: every https link opens in the window, but only listed hosts get the bar.

## Record a call

1. Open the meeting in Vibe.
1. Press **Record this call** before or during the call.
1. Stop from the bar or from the main window.

Recording is manual; a meeting window never starts recording on its own. The recorder captures the configured microphone and, when enabled, the system-audio loopback, so both sides of the call are recorded.

Closing the window while recording asks whether to stop or keep recording in the background.

## Fall back to the system browser

If a service refuses to run in the embedded webview, use **Open in system browser** in the bar. It is the supported fallback for DRM-heavy or WebRTC-hostile sites.

## Next steps

- [Why the meeting browser works this way](/vibe/docs#meeting-browser) explains the URL scheme, the isolated webview, and the manual recording rule.
- [Record microphone and system audio](/vibe/docs#record-audio) covers recording outside a call.
