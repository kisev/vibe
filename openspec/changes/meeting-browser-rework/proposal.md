# Proposal

## Why

On Windows 11 the embedded meeting browser opens a white window that never renders, and neither the window nor Vibe can be closed afterwards. The app log ends at "opening meeting browser" with no page-load event, and the WebView2 profile keeps writing: the content webview is created with its own `data_directory`, which WebView2 does not support as a second environment in the same process, so the window is created but never loads. The window's only controls are a native menu that never appears; with the window unusable, there is no way out but the task manager.

## What Changes

- The page webview is created in the process's existing WebView2 environment (no `data_directory`), so window creation cannot block the app.
- The chrome (address, back, forward, reload, open-external, close, record) and the page live in ONE window: a plain Tauri window hosts our app chrome webview on top and the remote page webview below it, using multi-webview (`tauri`'s `unstable` feature). There is no separate always-on-top bar window.
- The chrome webview alone has the app's capabilities; the page webview has none.
- A page that never loads is reported to the main window within the timeout and offers retry/close; the window can always be closed.
- The address bar accepts a URL and navigates the page webview (new `meeting_browser_load` command).
- macOS has no multi-webview embed here, so the browser falls back to a page-only `WebviewWindow` with no chrome instead of panicking.

## Capabilities

- `meeting-browser` (existing): the app's embedded browser.

## Impact

- `desktop/src-tauri/src/meeting_browser.rs`, `desktop/src-tauri/Cargo.toml`, `desktop/src/windows/browser-window*`, `desktop/src/bootstrap.tsx`, `desktop/src/lib/meeting-browser.ts`, capabilities, tests, docs.
