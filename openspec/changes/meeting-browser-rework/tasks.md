# Tasks

- [x] 1. The content webview is created in the process's WebView2 environment: `.data_directory(profile)` and the profile directory are gone, so window creation cannot block the app.
- [x] 2. The native menu is removed; the content window keeps its ordinary titlebar, and a bar window (`index.html?window=meeting-bar&session=N`, always on top) carries address, back, forward, reload, open-external and close.
- [x] 3. The bar starts and stops a recording for a meeting host, uses the app's providers, and closes with the session.
- [x] 4. `meeting_browser_load` navigates a typed URL in the same session history; the `meeting-bar-*` windows have the app's capabilities.
- [ ] 5. Rust and frontend tests cover the bar rendering and the load command; `task verify` green.
- [ ] 6. Manual Windows acceptance: a Telemost link renders, the bar's controls work, the window closes, Vibe quits normally.
