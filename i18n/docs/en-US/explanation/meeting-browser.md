# Why the meeting browser works this way

A call is easier to record when Vibe hosts the page itself: the app controls the window, knows when a recording is underway, and can show a bar with one action. The design is shaped by what the operating system actually allows.

## Why a URL scheme instead of https clicks

A browser never hands an `https://` link to an installed app unless that app is the default browser. Meeting apps work the other way around: they register their own scheme, and their pages or installers invoke it.

Vibe does the same:

- `vibe://open/?url=https://…` opens the target in Vibe's browser window. Any app, script, or shortcut can call it. Vibe validates the URL in Rust and refuses anything that is not https and well formed.
- **Settings → Recording → Open in Vibe** pastes a link into the same path.

Clicking an `https` link in Chrome, Edge, or Firefox still opens that browser. Making Vibe the default browser is deliberately out of scope: it would take over every link on the machine to serve one feature.

## Why the content view is isolated

The content window is an ordinary webview with its own data directory. Service cookies never mix with the app's storage, no scripts are injected into the page, and camera and microphone prompts come from the page itself rather than from Vibe granting them on the user's behalf. The embedded page is treated as untrusted web content, not as part of the app.

The bar offers address, back, forward, reload, close, and **Open in system browser**. That last action is the escape hatch for a service that refuses to run in the embedded webview.

## Why the browser is an allowlist

The embedded browser originally loaded whatever a page asked for; the meeting-host list only decided which links got the record bar. It is now a real boundary. Only domains the user allowed, and their subdomains over https, may load — top-level pages and every resource the page requests. A refused resource is answered with an error response so the page treats that origin as unavailable instead of retrying forever.

Strictness is the point, and it has a cost: a page pulling fonts or scripts from a CDN breaks until that CDN is allowed. The blocked list is the remedy — unique hosts, newest first, each with an **Allow** action that adds the domain and reloads the page. The chrome makes the same offer when it refuses a navigation.

## Why recording stays manual

Every page in the browser window shows **Record this call**, and while any browser window is open Vibe suppresses its own external-call prompt. Recording is still manual — press the button before or during the call, stop from the chrome or the main window. Automatic start would record calls the user did not ask to record, and would make the microphone indicator appear without an explicit action.

Closing the window while recording asks whether to stop or keep recording in the background, so leaving a call cannot silently discard or continue a recording.

## Limits

- Only `vibe://open/` links open automatically. An `https` click needs the default-browser decision Vibe does not take.
- DRM-heavy or WebRTC-hostile sites may work better in the system browser; **Open in system browser** is the supported fallback.
- Windows is validated first. Resource blocking uses each engine's own mechanism: WebView2 `WebResourceRequested` on Windows; Linux and macOS currently block top-level navigation only and are being finished.
- Registering Zoom, Teams, and Webex schemes is opt-in and available on Windows and Linux, not macOS.

## Related pages

- [Use the meeting browser](/vibe/docs#use-the-meeting-browser) for the steps.
- [Record microphone and system audio](/vibe/docs#record-audio) for the recorder itself.
