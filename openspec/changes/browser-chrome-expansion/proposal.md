# Proposal

## Why

The blocked-hosts popover is drawn inside the chrome webview, which is 104 pixels tall by design; anything taller is clipped by the page webview below it, so the list the user is meant to act on is unreadable. Two more defects surfaced in the same pass: a policy change only takes effect in windows opened afterwards — the user has to close and reopen the browser — and a freshly opened page sometimes keeps a larger size than the window until the window is toggled fullscreen, because the child webviews are sized once from logical values while the window reports physical ones.

## What Changes

- The blocked list is not a popup: pressing the shield grows the chrome to fit the list (the page shrinks below it), and pressing again restores the toolbar height. No part of the control is ever outside the chrome webview.
- The policy is read from a cached value updated by the settings command, and the resource filter is always installed for the page webview; its handler consults the cached policy, so switching to `trusted-site` or back applies to the window that is already open on the next request.
- The page webview is resized to the window's physical bounds right after creation and on a scale-factor change, not only on window resize events.

## Capabilities

- `meeting-browser` (existing).

## Impact

- `desktop/src-tauri/src/meeting_browser.rs`, `browser_policy.rs`, `desktop/src/windows/browser-window.tsx`, tests, docs.
