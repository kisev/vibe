# Design

## Context

The app already registers the `vibe` URL scheme, forwards second-instance invocations (`use-single-instance.tsx`, `use-deep-links.tsx`), creates auxiliary windows with `WebviewWindowBuilder` (`meeting_prompt.rs`, `dictation_indicator.rs`), detects external meetings from browser processes, and records several devices at once — input and loopback streams are merged by ffmpeg in `start_record` (`cmd/audio.rs`), so both sides of a call are available in one recording. Tauri is v2.10 with the `unstable` feature, so one window can hold several child webviews; `meeting-browser-rework` replaced the first two-window layout with that single-window one.

See `proposal.md` and `specs/meeting-browser/spec.md`. The browser's allowlist and blocked-host policy live in `browser_policy.rs` and are specified by `browser-allowlist`.

## How link interception actually works

Desktop apps that appear to "own" their links register their own URL scheme, and their own web pages or installers invoke it: Zoom uses `zoommtg://`/`zoomus://`, Teams `msteams://`, Mattermost `mattermost://`, Telegram `tg://`; the Telemost desktop client does the same with its own scheme. When a page calls such a scheme, the browser asks to open the app — which is why the result feels like an OS-level integration. Windows' "Apps for websites" association is the other route, but it requires the website to declare the app, which a third party cannot do for telemost.yandex.ru or stream.wb.ru.

A browser never hands an `https://` link to an installed app unless that app is the default browser. Vibe therefore owns two honest mechanisms: it registers other applications' meeting schemes behind an opt-in switch and maps each to its web URL (`meeting_schemes.rs`, `dev75-fixes`), and it accepts an `https` launch argument from another app, script or shortcut. The `vibe://open/?url=` handoff this change first shipped was removed in `dev75-fixes`: no real meeting page emits a Vibe-specific link, and the meeting schemes are what those pages already call. Direct link clicks from a browser remain out of reach unless Vibe is made the default browser, which is deliberately out of scope.

## Goals / Non-Goals

**Goals:**

- A link Vibe accepts opens in a real platform-webview window inside Vibe, with ordinary browser controls.
- A meeting room turns the window into a record-ready session with one visible action.
- No new trust surface: the page gets no injected scripts and no app capabilities, and the allowlist bounds what loads.

**Non-Goals:**

- Capturing `https` clicks from the system browser.
- Automatic recording; recording stays one click in this iteration.
- Extensions, default-browser takeover, or per-site scraping to detect call state.
- Script injection or automatic logins.

## Decisions

- **One window, two webviews: chrome and page.** The window is a `Window` with two children: the app-owned chrome (`index.html?window=browser`) across the top, which holds address, back, forward, reload, open in system browser, close and the recording controls, and the remote page (`WebviewUrl::External`) below it. Rust computes both children's bounds and re-applies them on resize, scale change and chrome expansion, so neither webview can cover the other. The first implementation used a separate always-on-top bar window because child webviews needed `tauri/unstable`; `meeting-browser-rework` rejected that layout once it shipped and replaced it with the single window. On macOS, where this Tauri version cannot embed the page beside the chrome, the page opens in a page-only `WebviewWindow` and recording stays on the main window.

- **The host list is the browser's allowlist.** Settings lists the hosts the browser may load; matching is by host name over https, an entry covering its subdomains, with no seeded defaults and the old `meeting.browserHosts` value migrated once (`browser-allowlist`). A host that is not listed is refused on navigation and recorded as blocked, and an allowed page's resources are checked too (strict policy by default). The earlier "any URL, the list only classifies meetings" model was replaced: the list is a boundary, and the chrome's recording controls are simply present on every page.

- **Recording is a manual action in the chrome.** "Record this call" asks the main window — the owner of the recorder — to start with the user's configured devices (microphone and, when enabled, the system-audio loopback), the indicator appears in both windows, and a second action stops. A chrome that opens while a recording already runs asks for the current state instead of offering a second start. Closing the window while recording asks whether to stop or keep recording; both answers are honored. Automatic start is a separate, later decision.

- **Deep links are validated before any window opens.** A handed link is mapped in Rust (a registered meeting scheme to its https URL) or taken as an https launch argument; `open_meeting_link` checks the allowlist and either opens the browser window or hands the URL to the system browser. `open_meeting_browser` parses the URL, requires `https`, and focuses an existing window for the same URL instead of spawning duplicates. A malformed or non-https link is reported in a dialog and nothing is auto-recorded from a link.

- **Isolation is capability isolation, within what WebView2 allows.** `capabilities/main.json` grants the app's permissions only to `browser-chrome-*`; the page webview has none and gets no init scripts. A second WebView2 environment with its own data directory is not supported in one process: the attempt left the window blank and the app unresponsive on Windows, so the page shares the app's environment (`meeting-browser-rework`). Vibe never reads page credentials; camera and microphone permissions are the platform webview's own prompts.

- **Meeting detection suppression is state-driven.** While at least one browser session is open, `meeting_prompt.rs` suppresses the external prompt; when the last window closes, detection resumes. External-browser calls behave exactly as they do today.

## Risks / Trade-offs

- [Strict allowlisting breaks pages whose assets come from a CDN] → The blocked list records each refused origin and offers Allow in place; `trusted-site` remains available for a page that needs its CDN.
- [Sites refuse embedded webviews or degrade WebRTC] → The window is a normal platform webview; if a service still fails, the chrome offers "Open in system browser" as an escape hatch.
- [Direct https clicks still open in the system browser] → Documented plainly, with the meeting-scheme handoff, the https launch argument and the in-app browser as the supported paths; default-browser takeover stays a future, explicit decision.
- [A recording keeps running after the call ends] → The indicator is visible in both windows and closing the window prompts; stopping is one click.
- [Platform differences] → Windows is validated first; macOS opens a page-only window, and the system browser remains the fallback everywhere.

## Migration Plan

1. Ship the single browser window with the chrome and the allowlist; recording stays manual.
1. Register other applications' meeting schemes behind the opt-in switch and keep the in-app "Open in Vibe" path.
1. Wire the in-app session state into meeting detection.
1. Validate on Windows with Telemost and stream.wb.ru; other platforms fall back gracefully.

## Open Questions

- Whether a later iteration should offer optional auto-record per host, now explicitly out of scope.
