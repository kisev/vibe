# Design

## Context

The browser window hosts two webviews: our chrome (`browser-chrome-*`) and the remote page (`browser-page-*`). Tauri exposes top-level navigation checks (`on_navigation`) cross-platform, but no resource interception. Each engine has its own mechanism:

| Engine | Top-level | Every request |
| --- | --- | --- |
| WebView2 (Windows) | `NavigationStarting` / `on_navigation` | `AddWebResourceRequestedFilter("*", ALL)` + `WebResourceRequested` handler, answered with `CreateWebErrorResponse` |
| WebKitGTK (Linux) | `decide-policy` / `on_navigation` | `WebKitUserContentFilter` (Safari content-blocker JSON) or `send-request` |
| WKWebView (macOS) | `decidePolicyFor` / `on_navigation` | `WKContentRuleList` with `block` + `ignore-previous-rules` for allowed hosts |

Tauri's `with_webview` gives the platform handle, so each engine can be wired without forking wry.

## Decisions

- **One policy in Rust, one mechanism per engine.** `browser_policy` owns the allowlist parsing (`host` matches `host` and `*.host`, https only) and the blocked-host registry; each platform segment only translates a request into a decision. Windows ships first (WebView2 `WebResourceRequested`); Linux uses a generated content-blocker JSON; macOS a `WKContentRuleList` compiled from the same JSON.
- **Blocked requests are answered, not cancelled.** A response with an HTTP error is returned so the engine does not retry forever; the page sees a failed resource exactly as if the origin were down.
- **The blocked list is per app, not per download attempt.** Unique hosts, newest first, cleared by the user; the list is an event plus a command so both the chrome and the settings surface can show it.
- **The allowlist replaces the meeting hosts.** Migrating `meeting.browserHosts` into `browser.allowedHosts` keeps what the user already added; the "meeting" flag disappears and the external prompt is suppressed while any browser window is open.
- **Strictness is the point, and has a cost.** Pages pulling fonts or scripts from CDNs break until those origins are allowed; the design accepts this because the user asked for "resources from other addresses must not load", and the blocked list makes the fix one click.

## Risks / Trade-offs

- A page can be unusable until its CDN origins are allowed; the blocked list must be easy to find and act on.
- The Windows implementation touches raw COM; a failure there must fall back to navigation-only blocking rather than leaving the page unloadable.
- Linux and macOS mechanisms behave slightly differently under redirects; the tests pin the decision function, and each platform segment is verified on its own.
