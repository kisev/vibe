# Tasks

> Note: the separate always-on-top bar window from the first pass was rejected; tasks 2–5 now
> describe the single-window multi-webview implementation that replaced it.

- [x] 1. The page webview is created in the process's WebView2 environment: `.data_directory(profile)` and the profile directory are gone, so window creation cannot block the app.
- [x] 2. One window (`Window::builder`, `unstable` feature) holds two child webviews: the app chrome (`index.html?window=browser&session=N`) across the top and the remote page below it. The separate bar window is gone.
- [x] 3. The chrome starts and stops a recording for a meeting host, uses the app's providers, and closes with the session.
- [x] 4. `meeting_browser_load` navigates a typed URL in the same session history on the page webview; only `browser-chrome-*` has the app's capabilities, the page webview has none.
- [x] 5. Rust and frontend tests cover the chrome rendering and the load command (`browser-window.test.tsx`); `cargo check -p vibe`, clippy, rustfmt, `tsc --noEmit` and the full vitest suite are green on this revision.
- [x] 6. macOS fallback: the browser opens a page-only `WebviewWindow` with no chrome (no panic path), documented in the reference and how-to.
- [x] 7. Manual Windows acceptance: a Telemost link renders in one window, the chrome's controls work, the window closes, Vibe quits normally. (2026-11-15: confirmed by the maintainer on the installed local build — a Telemost call on Windows: render, chrome controls, window close, app stays alive.)
