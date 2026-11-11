# Design

## Context

The app already registers the `vibe` deep-link scheme and forwards a second-instance invocation (`use-deep-links.tsx`, `use-single-instance.tsx`), detects external meetings from browser processes and prompts to record (`meeting_prompt.rs`), and records system audio plus microphone through the existing recorder. Tauri 2 with WebView2 on Windows is the primary target. See `proposal.md` and `specs/meeting-browser/spec.md`.

## Goals / Non-Goals

**Goals:**

- A meeting window that is unmistakably Vibe's, isolated from the app's own webview storage.
- Predictable recording: start with the call, stop with the window, never two recordings.
- Link handoff that works today without hijacking the user's default browser.

**Non-Goals:**

- Becoming the default browser or per-domain OS handler for `https` links.
- Injecting scripts into third-party meeting pages.
- Detecting call state through the services' internal APIs.
- Supporting every meeting platform; hosts are user-configured.

## Decisions

- **A window per meeting, app chrome where the platform allows it.** The meeting window is a Tauri window hosting a child webview of the meeting URL on platforms with multi-webview support (Windows first), so Vibe can draw an address bar, back/forward/reload, and the recording indicator around the page. Where a child webview cannot host the site, the fallback is a standalone `WebviewWindow` with native chrome and navigation shortcuts; if even that fails, the URL opens in the system browser with a notice. This keeps the feature honest per platform instead of pretending parity.

- **Allowlist by host, https only.** Each entry is `{host, autoRecord}`; matching is exact host or a `*.` suffix, lowercased, on `https`. No wildcards across unrelated domains. Navigation events are checked on every hop, including redirects; a non-allowed target is handed to the system browser and the meeting webview does not follow it. This is also the injection direction: nothing is ever injected into the page, so the allowlist is not a script boundary, only a navigation one.

- **The deep link is a routing hint, not a trust boundary.** `vibe://open/?url=` parses and validates the URL in Rust before any window is created, focuses an existing window for the same URL, and only auto-opens allowed hosts. Anything else asks first and defaults to the system browser. Unknown callers cannot make Vibe load arbitrary content without confirmation; auto-record additionally requires a stored per-host confirmation.

- **Call lifecycle is window-and-navigation based.** A session starts when the meeting window opens on an allowed host and ends when it closes or navigates away from the host for a grace period. Service-specific call-state detection is a non-goal: it would require scraping each service and would break silently. The consequence — a window left open on the meeting page keeps recording — is mitigated by the visible indicator and the window's own stop control; the consent copy says recording follows the window.

- **Auto-record is per host, consented once.** The first automatic recording on a host asks; the answer is stored with the host entry. Starting uses the existing recorder and refuses when a recording already runs (shows the active indicator instead). The indicator is a small always-on-top overlay in the meeting window plus the main window state, so recording is never invisible.

- **Separate webview data directory.** The meeting webview gets its own data partition, so service cookies and logins never mix with the app's own webview. No credential capture by Vibe; logins happen in the page as in a browser.

- **Detection suppression is state-driven.** `meeting_prompt.rs` gains an "in-app session active" input: while a meeting window runs, the external prompt for that same browser process/window is suppressed; when the window closes, detection resumes. External calls are otherwise untouched.

## Risks / Trade-offs

- [Services refuse embedded webviews or degrade WebRTC] → Fallback to the system browser per platform and per host; the host list documents which are validated.
- [Child webviews are platform-uneven] → Explicit fallback ladder (child webview → standalone webview window → system browser) and Windows-first validation.
- [A window left open records a silent room] → Recording indicator, stop control, and consent copy that recording follows the meeting window.
- \[Deep-link abuse (any app can invoke `vibe://`)\] → Rust-side validation, confirmation for non-allowed URLs, no auto-record without a stored consent.
- [Legal/consent exposure when recording meetings] → The one-time per-host confirmation, a visible indicator, and no automatic upload; transcripts stay local.
- [Data partition growth] → The meeting profile is a normal browser profile under app data; a settings action clears it.

## Migration Plan

1. Ship the window manager and allowlist with auto-record off by default; links still work externally.
1. Add the deep-link route and the handoff action.
1. Enable per-host auto-record after Windows validation on telemost and stream.wb.ru.
1. Rollback: remove hosts or disable the feature; deep links fall back to the system browser and existing detection remains.

## Open Questions

- Whether the macOS/Linux fallback should attempt a standalone webview or go straight to the system browser.
- Whether a per-host meeting-path pattern is needed to distinguish "on the site" from "in a call"; the first version treats any navigation on the host as a session.
