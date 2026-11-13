# Proposal

## Why

On Windows 11 the embedded meeting browser opens a white window that never renders, and neither the window nor Vibe can be closed afterwards. The app log ends at "opening meeting browser" with no page-load event, and the WebView2 profile keeps writing: the content webview is created with its own `data_directory`, which WebView2 does not support as a second environment in the same process, so the window is created but never loads. The window's only controls are a native menu that never appears; with the window unusable, there is no way out but the task manager.

## What Changes

- The content webview is created in the process's existing WebView2 environment (no `data_directory`); the meeting window gets a real close button from its own titlebar and a bar with address, back, forward, reload, open-external and close.
- The bar is app UI in its own small always-on-top window (the design in `embedded-meeting-browser` already called for it), driven by the existing session commands and events.
- A page that never loads is reported to the bar within the timeout and offers retry/close; the window can always be closed.
- The address bar accepts a URL and navigates the content webview (new `meeting_browser_load` command).

## Capabilities

- `meeting-browser` (existing): the app's embedded browser.

## Impact

- `desktop/src-tauri/src/meeting_browser.rs`, `desktop/src/pages/meeting-bar*`, `desktop/src/lib/meeting-browser.ts`, capabilities, tests, docs.
