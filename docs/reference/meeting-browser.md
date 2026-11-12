# Meeting browser

The meeting browser is a Vibe-hosted Chromium webview with a small always-on-top bar. This page lists the schemes, defaults, and settings paths; [the explanation](../explanation/meeting-browser.md) covers why it works this way, and [the how-to](../how-to/use-the-meeting-browser.md) covers the steps.

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

The content window uses its own data directory, so service cookies do not mix with the app's storage. No scripts are injected into the page.

## Meeting hosts

Default hosts:

- `telemost.yandex.ru`
- `stream.wb.ru`

Matching is by host name over https: a subdomain of a listed host matches, an `http` URL does not. The list is editable in **Settings → Recording → Meeting hosts**. Removing a host keeps its links openable; they just lose the meeting bar.

## Settings and actions

| Where | What |
| --- | --- |
| Settings → Recording → **Open in Vibe** | Paste a link and open it in the browser window |
| Settings → Recording → **Meeting hosts** | Add or remove recording hosts |
| Meeting bar | Address, back, forward, reload, close, **Open in system browser** |
| Meeting bar | **Record this call**, and stop while recording |

The recorder captures the configured microphone and, when enabled, the system-audio loopback. Closing the window while recording asks whether to stop or keep recording in the background.

## Limits

- Only `vibe://open/` links arrive automatically. `https` clicks stay in the browser because Vibe is not the default browser.
- DRM-heavy or WebRTC-hostile sites may work better in the system browser; **Open in system browser** is the supported fallback.
- Windows is the validated platform first; the other platforms use their own webviews and fall back to the system browser if the window cannot host the call.
