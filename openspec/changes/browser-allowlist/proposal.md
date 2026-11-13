# Proposal

## Why

The embedded browser loads whatever a page asks for. The meeting-host list only classified links; it was never a boundary. The maintainer wants a real allowlist: only domains the user approved may be opened, and resources from other origins must not load. What was blocked has to be visible, with a one-click way to allow it — otherwise a strict rule silently breaks pages.

## What Changes

- The meeting-host list is replaced by `browser.allowedHosts`: an allowlist of domains (host plus subdomains, https only). The old `meeting.browserHosts` key is migrated, and the "meeting" classification goes away; Vibe suppresses its external call prompt while any browser window is open.
- Top-level navigation to a host outside the list is blocked and reported instead of opening.
- Every resource request is checked: on Windows through WebView2's `WebResourceRequested`, on Linux through WebKitGTK's user content filter, on macOS through `WKContentRuleList`. A blocked request is answered with an error response and its host is recorded.
- Settings lists the allowed domains and, separately, the unique blocked hosts with an "Allow" action that adds the host and reloads the page.
- Special per-host protocol handling for telemost and stream is removed with the classification.

## Capabilities

- `meeting-browser` (existing): the embedded browser, its chrome and its settings.

## Impact

- `desktop/src-tauri/src/meeting_browser.rs` (or a new `browser_policy` module), the meeting-prompt suppression, `desktop/src/pages/settings/sections/meeting-browser.tsx`, `desktop/src/windows/browser-window.tsx`, catalogs, tests, docs.
- Strict blocking can break pages whose assets come from other origins until those are allowed; the blocked list is the remedy and must be prominent.

## Non-Goals

- Making Vibe a general-purpose browser with per-site policies.
- Blocking at the network layer outside this window.
