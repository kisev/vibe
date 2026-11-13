# Use the meeting browser

Vibe can host a call in its own window with an always-on-top bar whose main action is **Record this call**. The window uses the platform webview; [Why the meeting browser works this way](/vibe/docs#meeting-browser) covers the isolation and the limits.

## Open a call in Vibe

Use one of these paths:

- Open **Settings → Recording → Open in Vibe**, paste the link, and open it.
- From another app, script, or shortcut, call `vibe://open/?url=https://…`. Vibe accepts only well-formed https URLs and refuses anything else with a dialog.
- Turn on **Open meeting links in Vibe** under **Settings → Recording** to register Zoom, Teams, and Webex links. This is available on Windows and Linux, not macOS.

Clicking an https link in Chrome, Edge, or Firefox still opens that browser. Vibe does not register as the default browser.

## Allow the sites you use

**Settings → Recording → Allowed domains** is the browser's allowlist. It starts empty: add each domain you want to open, and its subdomains are included automatically. Matching is by host name over https — an `http` URL never loads.

The list is a boundary, not a filter. A link to a host outside it is refused, and so is any script, font, or image an allowed page requests from an unlisted origin. Every refused host appears under **Blocked** with an **Allow** action; allowing it adds the domain and reloads the page so the refused assets retry.

A strict list can break a page whose assets come from a CDN until that CDN is allowed. The Blocked list is the remedy, and the browser chrome shows the same offer when it refuses a navigation. While any browser window is open, Vibe suppresses its own call prompt.

## Record a call

The chrome's recording controls are present on every allowed page, not only on a host list.

1. Open the meeting in Vibe.
1. Press **Record this call** before or during the call.
1. Stop from the chrome or from the main window.

Recording is manual; a meeting window never starts recording on its own. The recorder captures the configured microphone and, when enabled, the system-audio loopback, so both sides of the call are recorded.

Closing the window while recording asks whether to stop or keep recording in the background.

## Fall back to the system browser

If a service refuses to run in the embedded webview, use **Open in system browser** in the bar. It is the supported fallback for DRM-heavy or WebRTC-hostile sites.

## Next steps

- [Why the meeting browser works this way](/vibe/docs#meeting-browser) explains the URL scheme, the isolated webview, the allowlist trade-off, and the manual recording rule.
- [Record microphone and system audio](/vibe/docs#record-audio) covers recording outside a call.
