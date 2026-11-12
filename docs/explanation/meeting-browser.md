# Meeting browser

The meeting browser exists because a call is easier to record when Vibe hosts the page itself: the app controls the window, knows when a recording is underway, and can show a bar with one action. The design is shaped by what the operating system actually allows.

## Why a URL scheme instead of https clicks

A browser never hands an `https://` link to an installed app unless that app is the default browser. Desktop meeting apps work the other way around: they register their own scheme (`zoommtg://`, `msteams://`, `mattermost://`), and their own pages or installers invoke it.

Vibe does the same honest thing:

- `vibe://open/?url=https://…` opens the target in Vibe's browser window. Any app, script, or shortcut can call it. The app validates the URL (https only, well formed) in Rust and refuses anything else with a dialog.
- Inside the app, **Settings → Recording → Open in Vibe** pastes a link into the same path.

Clicking an `https` link in Chrome, Edge, or Firefox still opens that browser. Making Vibe the default browser is deliberately out of scope: it would take over every link on the machine to serve one feature, and it would still be a user decision.

## Why the content view is isolated

The content window is an ordinary webview with its own data directory. Service cookies never mix with the app's storage, no scripts are injected into the page, and camera/microphone prompts come from the page itself rather than from Vibe granting them on the user's behalf. The embedded page is treated as untrusted web content, not as part of the app.

The bar offers address, back, forward, reload, close, and **Open in system browser**. That last action is the escape hatch for a service that refuses to run in the embedded webview.

## Why recording stays manual

Hosts in the meeting list make the window a meeting session: the bar shows **Record this call**, and while that session is open the external-browser meeting prompt is suppressed. Recording is still manual — press the button before or during the call, stop from the bar or the main window. Automatic start would record calls the user did not ask to record, and would make the app's microphone indicator appear without an explicit action.

Closing the window while recording asks whether to stop or keep recording in the background, so leaving a call cannot silently discard or continue a recording.

## Limits

- Only `vibe://open/` links open automatically. An `https` click needs the default-browser decision Vibe does not take.
- DRM-heavy or WebRTC-hostile sites may work better in the system browser; **Open in system browser** is the supported fallback.
- Windows is validated first. The other platforms use their own webviews and fall back to the system browser if the window cannot host the call.

Facts and defaults are in [Meeting browser reference](../reference/meeting-browser.md); the steps are in [Use the meeting browser](../how-to/use-the-meeting-browser.md).
