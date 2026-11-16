# Tasks

- [x] 1. `browser_policy`: allowlist parsing (host + subdomains, https), decision per URL, blocked-host registry, migration from `meeting.browserHosts`. — 2026-11-13: new `desktop/src-tauri/src/browser_policy.rs`; store key `browser.allowedHosts`, startup migration merges and deletes the legacy key, no seeded defaults.
- [x] 2. Top-level navigation blocked through `on_navigation` and reported; the chrome shows a refused-navigation notice. — 2026-11-13: both builders gate `on_navigation`; `meeting-browser-navigation-blocked` plus the chrome Allow notice.
- [x] 3. Windows: WebView2 `WebResourceRequested` over `with_webview`, error response for blocked origins, blocked hosts emitted. — 2026-11-13: `AddWebResourceRequestedFilter("*", ALL)` and a handler that answers 403 "Blocked by Vibe"; cfg(windows), not compiled on the Linux development host. The installed webview2-com 0.38 bindings have `CreateWebResourceResponse`, not `CreateWebErrorResponse`, so the former is used.
- [ ] 4. Linux: content-blocker JSON compiled from the allowlist and applied to the page webview; blocked hosts reported. — not in this pass; top-level navigation is already blocked by the shared `on_navigation` gate.
- [ ] 5. macOS: `WKContentRuleList` from the same JSON; fallback to navigation-only blocking where unavailable. — not in this pass; top-level navigation is already blocked by the shared `on_navigation` gate.
- [x] 6. Settings: allowed domains list and blocked hosts list with Allow; allow adds to the list and reloads the page. — 2026-11-13.
- [x] 7. Remove the meeting classification and special protocol handling; suppress the external prompt while a browser window is open. — 2026-11-13: `is_meeting` and the telemost/stream defaults are gone; session count suppresses the prompt. Zoom/Teams/Webex scheme mapping is unchanged.
- [x] 8. Tests: decision function, migration, blocked-host dedupe, allow-then-reload. — 2026-11-13: Rust unit tests in `browser_policy`, TS tests for the settings list and the chrome's blocked notice.
- [x] 9. Docs: settings reference, how-to and the explanation of the trade-off. — 2026-11-13: brief updates in `docs/` and `i18n/docs/en-US/`.

## Notes

- New desktop strings (`browserAllowedHosts*`, `browserBlockedHosts*`, `browserNavigationBlocked`) exist only in `i18n/desktop/en-US.json`; another pass translates them with `/translate`.
- The Windows COM path (`desktop/src-tauri/src/meeting_browser.rs`, `install_resource_interceptor`) is `cfg(windows)` and was not compiled on the Linux host that implemented this change.
- [x] 10. Strictness setting `browser.policy` (`strict` default, `trusted-site` skips the per-origin resource filter, never the navigation gate) with a Settings selector.
- [x] 11. The chrome lists blocked hosts with Allow in a popover of its own, hidden when empty or off-policy.
- [x] 12. Windows: open a page whose assets come from another origin and verify the blocked-host registry fills from real `WebResourceRequested` traffic and that Allow reloads it in place. (2026-11-15: confirmed by the maintainer on the installed local build — a page with a cross-origin asset listed the blocked host and Allow reloaded it in place.)
- [ ] 13. When the per-platform resource filters (4 and 5) are written, split `desktop/src-tauri/src/meeting_browser.rs` along the platform seam first: window/session lifecycle and geometry, the commands, and the platform resource filter each in its own module. The file is ~1023 lines against the project's 700-line rule; the filter work is the natural place to take it under, and the maintainer chose that seam over a line-count split.
- [ ] 14. (#83) `strict` filters resources on Windows only, and the setting is offered on every platform, so on Linux and macOS it silently does nothing. Make the setting honest there until the filters from tasks 4 and 5 exist — either enforce it or do not offer it. Remediated in `review-remediation` (task 1.2); the filters themselves stay here.
