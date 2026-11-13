# Meeting browser

The meeting browser is a single Vibe-hosted window: Vibe's chrome (address, back, forward, reload, open-external, close and the record action) fills the top strip, and the page occupies the rest of the same window underneath it. There is no separate always-on-top bar. This page lists the schemes, the allowlist and settings paths; [the explanation](../explanation/meeting-browser.md) covers why it works this way, and [the how-to](../how-to/use-the-meeting-browser.md) covers the steps.

## URL schemes

| Scheme | Effect |
| --- | --- |
| `vibe://open/?url=<https-url>` | Open the URL in the Vibe browser window. The URL must be https and well formed; anything else is refused with a dialog |
| `vibe://download/?url=<model-url>` | Import a model from a custom URL |

## Platform webviews

| Platform | Webview |
| --- | --- |
| Windows | WebView2 (Chromium) |
| macOS | WKWebView |
| Linux | WebKitGTK |

The page shares the app's WebView2 environment; WebView2 does not support a second data directory in one process, and an attempt to use one is what used to leave the window blank and the app unresponsive. No scripts are injected into the page.

The window holds two child webviews: the app-owned chrome, which has the app's capabilities, and the remote page, which has none. This multi-webview layout is supported on desktop Windows and Linux only. On macOS Vibe falls back to a plain page-only `WebviewWindow` with no in-window chrome (the page still loads in Vibe; recording stays on the main window, and **Open in system browser** remains the escape hatch).

## Allowed domains

The embedded browser is an allowlist. Only hosts in `browser.allowedHosts` (edited in **Settings → Recording → Allowed domains**) may load, and a host covers its subdomains over https; an `http` URL never loads. There are no seeded defaults: the list starts empty and the previous `meeting.browserHosts` value is migrated into it once on startup.

Every top-level navigation and every resource request from an unlisted origin is refused and the origin is recorded once under **Blocked**, newest first. Allowing a blocked host adds it to the list and reloads the open pages. Windows enforces resource blocking through WebView2's `WebResourceRequested`; Linux and macOS currently enforce top-level navigation only.

## Settings and actions

| Where | What |
| --- | --- |
| Settings → Recording → **Open in Vibe** | Paste a link and open it in the single browser window |
| Settings → Recording → **Allowed domains** | Add or remove the domains the browser may load |
| Settings → Recording → **Blocked** | Allow a host the browser refused; the page reloads |
| Browser chrome (top of the window) | Address, back, forward, reload, close, **Open in system browser** |
| Browser chrome (top of the window) | **Record this call**, and stop while recording |

The recorder captures the configured microphone and, when enabled, the system-audio loopback. Closing the window while recording asks whether to stop or keep recording in the background.

## Limits

- Only `vibe://open/` links arrive automatically. `https` clicks stay in the browser because Vibe is not the default browser.
- DRM-heavy or WebRTC-hostile sites may work better in the system browser; **Open in system browser** is the supported fallback.
- Windows is the validated platform first. Windows and Linux get the full single-window layout; macOS falls back to a page-only window without the in-window chrome, so use the main window to record or the system browser for the call.
