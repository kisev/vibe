# Proposal

## Why

Every desktop regression so far was found by the maintainer installing a dev build and clicking through it. The React surfaces already run in a browser against the mock Tauri layer (`src/mock-tauri`), so the same checks can run in CI and on an agent's machine without a native webview.

## What Changes

- A Playwright suite drives the app in browser mode: boot, settings sections, and the flows that previously broke (update channels, comparison results, meeting settings).
- `task ci:e2e` installs the browsers and runs the suite; `e2e.yml` calls it on desktop pull requests and on dispatch.
- The suite is excluded from vitest's collection so unit and browser tests cannot mix.

## Capabilities

### New Capabilities

- `desktop-e2e`: browser-mode end-to-end checks for the desktop UI.

## Assumptions

- Browser mode with the mock backend is representative for pure UI behaviour; native webview behaviour (meeting window, menus) stays a manual check until a tauri-driver job exists.
