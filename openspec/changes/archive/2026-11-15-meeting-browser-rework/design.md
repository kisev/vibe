# Design

## Context

The first pass shipped the page in its own `WebviewWindow` created with a second WebView2 environment (`.data_directory(profile)`) and a separate always-on-top bar window for the app's controls. On Windows 11 the window opened white and never loaded, and neither the window nor the app could be closed, because WebView2 supports one environment per process and the window-creation path pumped the message loop synchronously. See `proposal.md` — Why.

The tree already has what this design needs: Tauri 2.10 with the `unstable` feature enabled (`desktop/src-tauri/Cargo.toml`), so one `Window` can hold several child webviews; a chrome-only bootstrap surface (`?window=browser` in `desktop/src/bootstrap.tsx`); capability files that select windows and webviews by label (`desktop/src-tauri/capabilities/main.json`); and the main window as the owner of the recorder and of every modal decision (`meeting_browser.rs`, `components/meeting-browser-close-gate.tsx`). Requirements are in `specs/meeting-browser/spec.md`; the allowlist and policy are specified by `browser-allowlist` and implemented in `browser_policy.rs`.

## Goals / Non-Goals

**Goals:**

- One window that always paints and always closes: the app chrome above a remote page in the same window, on Windows and Linux.
- Window creation cannot block the app, and a page that never loads offers retry or close instead of a blank surface.
- The page webview has no app capabilities; only the chrome webview does.
- macOS degrades to a page-only window instead of panicking or shipping a dead chrome.
- The address bar, history, record action and close keep working from the chrome alone.

**Non-Goals:**

- In-window chrome on macOS in this Tauri version.
- A second WebView2 environment or data directory per window.
- Turning Vibe into a general-purpose browser or the default browser.
- Automatic recording; the chrome only asks the main window to start one.

## Decisions

- **One `Window` with two child webviews, not a bar window plus a page window.** `Window::builder` creates `browser-{session}`; `add_child` places `browser-chrome-{session}` across the top and `browser-page-{session}` below it. The bar window was rejected after it shipped: it left the page in its own WebView2 environment, the native menu never appeared, and a second top-level window adds focus and lifetime state that the single-window layout does not need.

- **Window creation runs in an async command.** WebView2 creates its environment by pumping the message loop, and a synchronous command runs on the main thread — pumping there from inside Tauri's event loop is what froze the app. `open_meeting_browser` is `async`, so Tauri marshals the window creation to the main loop while the command itself runs on the async runtime.

- **The page shares the process's WebView2 environment.** `.data_directory(profile)` is gone. One environment per process is a WebView2 rule, not a preference; the second environment was the white-window failure. The chrome and the page therefore share a process, which is acceptable because isolation is enforced by capabilities and the allowlist rather than by a separate environment.

- **The chrome is a chrome-only bootstrap branch.** `bootstrap.tsx` loads the config store and applies theme and language before the first paint, then renders `BrowserWindow`; it never runs migrations, device enumeration or server supervision. Booting the whole app in the chrome made it behave like a second app and duplicated work the main window already owns. The chrome asks the main window for recording state and toggle through events.

- **One bounds helper decides both webviews' geometry.** `child_bounds` turns the window's physical size, the scale factor and the blocked-list state into the chrome height (full width) and the page's `y`/height, and the same helper is re-applied on create, resize, scale-factor change and blocked-list expansion. The two logical heights (`TOOLBAR_H`, `BLOCKED_LIST_H`) travel in the chrome URL (`index.html?window=browser&session=N&toolbar=…&blocked=…`), so the Rust and React constants cannot drift silently; the React side keeps the same values as a fallback for unit tests and a stale backend.

- **Capabilities are selected by webview label.** `capabilities/main.json` grants the app's permissions to `windows: ["main", "meeting-prompt"]` plus `webviews: ["browser-chrome-*"]`; the page webview matches no capability and gets no init scripts. Labels are defined in one place in `meeting_browser.rs` (`browser_label`, `chrome_label`, `page_label`).

- **A failed page is the main window's decision.** A 20-second watchdog emits `meeting-browser-load-failed`; `MeetingBrowserCloseGate` asks Retry (reload the tracked URL) or Close. Closing while a recording runs is deferred the same way: `CloseRequested` prevents the close and emits `meeting-browser-close-requested` unless the session is being force-closed, so `close_session` and the user's close cannot double-prompt. `meeting_browser_load` navigates first and only then appends to the session history, so a refused engine navigation leaves the address bar and back/forward state on the page that is still shown.

- **macOS falls back to a page-only `WebviewWindow`.** WKWebView in this Tauri version has no reliable multi-webview embedding, so `build_session_window` is `cfg`-split: non-macOS builds the two-child window, macOS builds one `WebviewWindow` whose webview label equals the window label (`page_label`), so the same commands address it. `browser_set_chrome_expanded` becomes a no-op there. Recording stays on the main window and the system browser remains the escape hatch.

- **The home page is a first-class entry point.** `BrowserPanel` in the main page's idle hero takes a link, normalizes a bare domain to `https`, upgrades `http`, and routes meeting schemes through `open_meeting_link`; no Settings visit is required.

## Risks / Trade-offs

- \[`tauri/unstable`'s multi-webview API may change between 2.x minors\] → `Cargo.toml` carries a comment to re-verify the browser window when Renovate bumps the minor, and `child_bounds` is unit-tested so a changed physical/logical contract shows up as a test failure.
- [The chrome and the page share a process] → the page has no capabilities and no injected scripts; every navigation and (on Windows) every resource request goes through the allowlist.
- [Toolbar height is duplicated between Rust and the chrome] → it travels in the chrome URL and falls back to the same literal in React; any drift is visible as a misplaced page edge.
- [Slow pages trip the load watchdog] → the timeouts are 20 seconds and the user chooses retry or close; a false alarm costs one dialog, a silent white window costs the app.
- [macOS loses the in-window chrome] → the reference and how-to state the fallback; recording stays reachable and the system browser is supported.
- [Resource blocking is Windows-only] → Linux and macOS enforce top-level navigation only; documented in the reference. The empty-window failure this change fixes was Windows-specific and is fixed on its own platform.
- [Windows is validated first] → the single-window path is compiled and unit-tested on Linux; the maintainer's Windows acceptance is recorded in `tasks.md`.

## Migration Plan

No data migration: sessions and history are in-memory, and the window layout is not persisted.

1. Land the single-window build; the old bar-window code path is deleted rather than feature-flagged, so there is no runtime switch to keep coherent.
1. Windows acceptance: a Telemost call renders, the chrome's controls work, the window closes, and Vibe stays usable (recorded in `tasks.md`).
1. Rollback, if needed, is a code revert of the desktop changes; no stored state depends on the layout.
