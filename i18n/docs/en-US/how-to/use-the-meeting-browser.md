# Use the meeting browser

Vibe can host a call in its own Chromium-based window: the app's chrome (address, back, forward, reload, open-external, close and **Record this call**) sits at the top, and the page fills the rest of that same window. There is no separate bar window. See [Meeting browser reference](../reference/meeting-browser.md) for the URL schemes and the allowlist, and [the explanation](../explanation/meeting-browser.md) for why the mechanism works this way.

## Open a call in Vibe

Use one of these paths:

- From another app or the system: turn on **Open meeting links in Vibe** under **Settings → Recording** to register Zoom, Teams, and Webex links (Windows and Linux, not macOS). The app validates the mapped URL and opens it in the browser window when its host may load, the system browser otherwise.
- Inside Vibe: the home page's **Meeting browser** source, or **Settings → Recording → Open in Vibe**; paste the link and press **Open in Vibe**.
- The link's host must be in the allowlist; top-level navigation and cross-origin resources outside it are refused. The chrome's recording controls are present on every allowed page.

Clicking an https link in Chrome, Edge, or Firefox still opens that browser. Vibe does not register as the default browser.

## Record a call

1. Open the meeting in Vibe.
1. Press **Record this call** in the window's chrome before or during the call.
1. Stop from the chrome or from the main window.

Recording is manual; a meeting window never starts recording on its own. The recorder captures the configured microphone and, when enabled, the system-audio loopback, so both sides of the call are recorded.

The microphone and speaker pickers in the chrome change the same devices the main window uses, so a call can be routed without leaving it. While a recording runs they are disabled and name the devices it is capturing; a source the run does not capture reads **None**.

Closing the window while recording asks whether to stop or keep recording in the background.

## Allow the sites you use

**Settings → Recording → Allowed domains** is the browser's allowlist; it starts empty. Add each domain you need and its subdomains are included over https.

Only listed domains may load. A link to another host is refused, and so is any script, font, or image an allowed page pulls from an unlisted origin. Refused hosts appear under **Blocked** with an **Allow** action that adds the domain and reloads the page. The chrome shows the same offer when it refuses a navigation.

The strict list can break a page whose assets come from a CDN until that CDN is allowed; that is the intended trade-off, and the Blocked list makes the fix one click.

## Fall back to the system browser

If a service refuses to run in the embedded webview, use **Open in system browser** in the chrome. The system browser is the supported fallback for DRM-heavy or WebRTC-hostile sites.

On macOS the embedded browser has no in-window chrome: the page opens in a page-only window, recording stays available from the main window, and the system browser is the fallback for the whole call.
