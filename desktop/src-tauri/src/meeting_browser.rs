use crate::browser_policy;
use crate::config::STORE_FILENAME;
use once_cell::sync::Lazy;
use serde::Serialize;
use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Mutex, MutexGuard};
use tauri::webview::PageLoadEvent;
#[cfg(not(target_os = "macos"))]
use tauri::webview::WebviewBuilder;
use tauri::{AppHandle, Emitter, Manager, Url, WebviewUrl, WindowEvent};
#[cfg(not(target_os = "macos"))]
use tauri::{PhysicalPosition, PhysicalSize, Window};
use tauri_plugin_store::StoreExt;

/// Opt-in registration as the system handler for other applications' meeting schemes.
const SCHEMES_KEY: &str = "meeting.schemesEnabled";
const SESSION_EVENT: &str = "meeting-browser-session";
const CLOSED_EVENT: &str = "meeting-browser-closed";
const CLOSE_REQUESTED_EVENT: &str = "meeting-browser-close-requested";
/// Emitted with `{ session, host }` when a top-level navigation is refused, so the chrome can
/// offer to allow the host in place.
const NAVIGATION_BLOCKED_EVENT: &str = "meeting-browser-navigation-blocked";
/// Emitted to the main window when a page never finished loading: a blank webview with no
/// explanation is the worst outcome, so the user gets a retry/close question instead.
const LOAD_FAILED_EVENT: &str = "meeting-browser-load-failed";
const CONTENT_WIDTH: f64 = 1100.0;
const CONTENT_HEIGHT: f64 = 760.0;
/// Height of the app-owned toolbar above the page, in logical pixels.
///
/// The two webviews share one window, so this must match the toolbar height in the chrome
/// component (`TOOLBAR_HEIGHT` in `desktop/src/windows/browser-window.tsx`).
// Wide enough for two rows (address and recording) without the page clipping the button.
// The multi-webview window exists on Windows and Linux only, so these three heights are
// compiled where that window is; on macOS they would be dead code under `-D warnings`.
#[cfg(not(target_os = "macos"))]
const TOOLBAR_H: f64 = 104.0;
/// Height of the blocked-hosts region that grows out of the toolbar, in logical pixels.
///
/// The list is part of the chrome webview rather than a portal, so the chrome grows by this
/// much while it is open and the page moves down; the region can never be clipped by the page.
/// Wide enough for a handful of hosts; the region scrolls past that.
/// This must match `BLOCKED_LIST_HEIGHT` in `desktop/src/windows/browser-window.tsx`.
#[cfg(not(target_os = "macos"))]
const BLOCKED_LIST_H: f64 = 200.0;
#[cfg(not(target_os = "macos"))]
const WINDOW_HEIGHT: f64 = CONTENT_HEIGHT + TOOLBAR_H;
/// How long a page may stay unloaded before the window offers a retry instead of white.
const LOAD_TIMEOUT: std::time::Duration = std::time::Duration::from_secs(20);

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BrowserSessionInfo {
    pub session: u64,
    pub url: String,
    pub host: String,
    pub can_back: bool,
    pub can_forward: bool,
}

struct BrowserSession {
    info: BrowserSessionInfo,
    /// URLs in visit order. `index` points at the entry the page webview currently shows.
    history: Vec<String>,
    index: usize,
    /// Set before a programmatic close so `CloseRequested` does not prompt a second time.
    force_close: bool,
    /// A page load finished in this window at least once.
    loaded: bool,
    /// The chrome is showing the blocked-hosts region, so the page sits lower.
    expanded: bool,
    /// A resource of this page was refused under the strict policy. Only such a page has
    /// anything to retry after a host is allowed, so only such a page is reloaded.
    blocked_requests: bool,
    /// The URL and history position of the last load that finished. A navigation updates the
    /// history before it lands; this is what the webview is actually showing, so a navigation
    /// the engine refuses can put the chrome back on it.
    loaded_url: String,
    loaded_index: usize,
}

#[derive(Default)]
struct BrowserRuntime {
    sessions: HashMap<u64, BrowserSession>,
}

impl BrowserRuntime {
    /// Every open browser window suppresses the external meeting prompt, whatever its host.
    fn session_count(&self) -> usize {
        self.sessions.len()
    }
}

static RUNTIME: Lazy<Mutex<BrowserRuntime>> = Lazy::new(|| Mutex::new(BrowserRuntime::default()));
static NEXT_SESSION: AtomicU64 = AtomicU64::new(1);

fn lock_runtime() -> Result<MutexGuard<'static, BrowserRuntime>, String> {
    RUNTIME.lock().map_err(|_| "meeting browser state is unavailable".to_string())
}

/// The one window both webviews live in.
fn browser_label(session: u64) -> String {
    format!("browser-{session}")
}

/// The app-owned chrome webview (address bar, controls); the only one with capabilities.
#[cfg(not(target_os = "macos"))]
fn chrome_label(session: u64) -> String {
    format!("browser-chrome-{session}")
}

/// The remote page webview. On macOS the page is a plain `WebviewWindow`, whose webview label
/// equals its window label, so the shared browser label addresses the page there.
#[cfg(not(target_os = "macos"))]
fn page_label(session: u64) -> String {
    format!("browser-page-{session}")
}

#[cfg(target_os = "macos")]
fn page_label(session: u64) -> String {
    browser_label(session)
}

fn emit_session(app: &AppHandle, info: &BrowserSessionInfo) {
    if let Err(error) = app.emit(SESSION_EVENT, info) {
        tracing::warn!("could not emit meeting browser session: {error}");
    }
}

fn sync_meeting_suppression(count: usize) {
    crate::meeting_prompt::set_in_app_session(count > 0);
}

/// A URL for logs: the query and fragment are dropped, because meeting links carry the meeting
/// password in `?pwd=…` and logs are routinely attached to bug reports.
fn redact_query(raw: &str) -> String {
    match Url::parse(raw) {
        Ok(mut url) => {
            url.set_query(None);
            url.set_fragment(None);
            url.to_string()
        }
        Err(_) => raw.split(['?', '#']).next().unwrap_or_default().to_string(),
    }
}

/// Fold a finished page load into the session's history and publish the new state.
fn handle_page_load(app: &AppHandle, session: u64, url: &Url) {
    // Only web pages belong in the browser history; about:/data: are webview internals.
    if !matches!(url.scheme(), "http" | "https") {
        return;
    }
    let normalized = url.as_str().to_string();
    let (changed, count) = {
        let Ok(mut runtime) = RUNTIME.lock() else {
            return;
        };
        let changed = {
            let Some(state) = runtime.sessions.get_mut(&session) else {
                return;
            };
            let previous = state.info.clone();
            if state.history.get(state.index).map(String::as_str) != Some(normalized.as_str()) {
                if state.history.get(state.index + 1).map(String::as_str) == Some(normalized.as_str()) {
                    // The page moved onto the entry our forward control would have used.
                    state.index += 1;
                } else {
                    state.history.truncate(state.index + 1);
                    state.history.push(normalized.clone());
                    state.index = state.history.len() - 1;
                }
            }
            state.info.url = normalized.clone();
            state.loaded_url = normalized;
            state.loaded_index = state.index;
            state.loaded = true;
            state.info.host = browser_policy::host_of(&state.info.url);
            state.info.can_back = state.index > 0;
            state.info.can_forward = state.index + 1 < state.history.len();
            (state.info != previous).then(|| state.info.clone())
        };
        (changed, runtime.session_count())
    };
    if let Some(info) = changed {
        emit_session(app, &info);
    }
    sync_meeting_suppression(count);
}

/// Remove a session after its browser window is gone and notify listeners.
fn finalize_session(app: &AppHandle, session: u64) {
    let (removed, count) = {
        let Ok(mut runtime) = RUNTIME.lock() else {
            return;
        };
        let removed = runtime.sessions.remove(&session).is_some();
        (removed, runtime.session_count())
    };
    if !removed {
        return;
    }
    sync_meeting_suppression(count);
    if let Err(error) = app.emit(CLOSED_EVENT, serde_json::json!({ "session": session })) {
        tracing::warn!("could not emit meeting browser closed: {error}");
    }
}

/// Close without asking. `CloseRequested` sees `force_close` and lets the window go.
fn close_session(app: &AppHandle, session: u64) -> Result<(), String> {
    {
        let mut runtime = lock_runtime()?;
        let state = runtime
            .sessions
            .get_mut(&session)
            .ok_or_else(|| format!("Unknown browser session {session}"))?;
        state.force_close = true;
    }
    if let Some(window) = app.get_window(&browser_label(session)) {
        if let Err(error) = window.close() {
            // The close failed, so the session lives on: clear the bypass, otherwise the next
            // manual close would skip the recording prompt without the user asking for that.
            if let Ok(mut runtime) = lock_runtime() {
                if let Some(state) = runtime.sessions.get_mut(&session) {
                    state.force_close = false;
                }
            }
            return Err(format!("Could not close the browser window: {error}"));
        }
    } else {
        finalize_session(app, session);
    }
    Ok(())
}

/// The child webview bounds for a window of `size`, in physical pixels.
///
/// One function decides both webviews' geometry so the window resize handler, a scale-factor
/// change and the blocked-list expansion can never drift apart.
#[cfg(not(target_os = "macos"))]
#[derive(Debug, PartialEq, Eq)]
struct ChildBounds {
    width: u32,
    /// Chrome spans the full width at the top and holds the toolbar, plus the list when open.
    chrome_height: u32,
    /// The page starts exactly where the chrome ends.
    page_y: u32,
    page_height: u32,
}

/// Compute the shared bounds. `scale` turns the logical heights into physical pixels, which is
/// what the window reports for both its size and its events.
#[cfg(not(target_os = "macos"))]
fn child_bounds(size: PhysicalSize<u32>, scale: f64, expanded: bool) -> ChildBounds {
    let chrome_logical = TOOLBAR_H + if expanded { BLOCKED_LIST_H } else { 0.0 };
    let chrome_height = ((chrome_logical * scale).round() as u32).min(size.height);
    ChildBounds {
        width: size.width,
        chrome_height,
        page_y: chrome_height,
        page_height: size.height.saturating_sub(chrome_height),
    }
}

/// Keep the chrome and the page filling the window: the chrome spans the whole surface, and the
/// page starts below the toolbar (or below the open blocked list), so its top edge never covers
/// the controls.
#[cfg(not(target_os = "macos"))]
fn resize_children(app: &AppHandle, session: u64, size: PhysicalSize<u32>) {
    let scale = app
        .get_window(&browser_label(session))
        .and_then(|window| window.scale_factor().ok())
        .unwrap_or(1.0);
    let expanded = RUNTIME
        .lock()
        .ok()
        .and_then(|runtime| runtime.sessions.get(&session).map(|state| state.expanded))
        .unwrap_or(false);
    let bounds = child_bounds(size, scale, expanded);
    if let Some(chrome) = app.get_webview(&chrome_label(session)) {
        if let Err(error) = chrome.set_size(PhysicalSize::new(bounds.width, bounds.chrome_height)) {
            tracing::warn!(session, "could not resize the browser chrome: {error}");
        }
        if let Err(error) = chrome.set_position(PhysicalPosition::new(0, 0)) {
            tracing::warn!(session, "could not place the browser chrome: {error}");
        }
    }
    if let Some(page) = app.get_webview(&page_label(session)) {
        if let Err(error) = page.set_size(PhysicalSize::new(bounds.width, bounds.page_height)) {
            tracing::warn!(session, "could not resize the browser page: {error}");
        }
        if let Err(error) = page.set_position(PhysicalPosition::new(0, bounds.page_y)) {
            tracing::warn!(session, "could not place the browser page: {error}");
        }
    }
}

/// Re-apply the shared bounds to an open window, reading its current physical size. Used when
/// the chrome expands or collapses, so no math is repeated outside [`child_bounds`].
#[cfg(not(target_os = "macos"))]
fn resize_to_window(app: &AppHandle, session: u64) -> Result<(), String> {
    let window = app
        .get_window(&browser_label(session))
        .ok_or_else(|| format!("Browser window for session {session} is not open"))?;
    let size = window
        .inner_size()
        .map_err(|error| format!("Could not read the browser window size: {error}"))?;
    resize_children(app, session, size);
    Ok(())
}

/// Build the single browser window: our chrome webview on top, the remote page below it.
///
/// Multi-webview (a window with several child webviews) is supported on Windows and Linux only.
#[cfg(not(target_os = "macos"))]
fn build_session_window(app: &AppHandle, session: u64, info: &BrowserSessionInfo, parsed: Url) -> Result<(), String> {
    let window = Window::builder(app, browser_label(session))
        .title(info.host.clone())
        .inner_size(CONTENT_WIDTH, WINDOW_HEIGHT)
        .focused(true)
        .build()
        .map_err(|error| format!("Could not open the browser window: {error}"))?;
    tracing::info!(session, "browser window created");

    // The chrome cannot import Rust constants, so the two heights it mirrors travel in the URL.
    // This keeps its toolbar/list region from drifting from the webview geometry computed here.
    let chrome_url = format!("index.html?window=browser&session={session}&toolbar={TOOLBAR_H}&blocked={BLOCKED_LIST_H}");
    tracing::info!(session, "creating the browser chrome webview");
    window
        .add_child(
            WebviewBuilder::new(chrome_label(session), WebviewUrl::App(chrome_url.into())).focused(true),
            tauri::LogicalPosition::new(0.0, 0.0),
            tauri::LogicalSize::new(CONTENT_WIDTH, WINDOW_HEIGHT),
        )
        .map_err(|error| format!("Could not open the browser chrome: {error}"))?;

    tracing::info!(session, "creating the browser page webview");
    let navigation_app = app.clone();
    let page = window
        .add_child(
            WebviewBuilder::new(page_label(session), WebviewUrl::External(parsed))
                .on_navigation(move |url| allow_navigation(&navigation_app, session, url))
                .on_page_load(move |webview, payload| {
                    tracing::info!(
                        session,
                        url = %redact_query(payload.url().as_str()),
                        event = ?payload.event(),
                        "meeting browser page load"
                    );
                    if payload.event() == PageLoadEvent::Finished {
                        handle_page_load(webview.app_handle(), session, payload.url());
                    }
                }),
            tauri::LogicalPosition::new(0.0, TOOLBAR_H),
            tauri::LogicalSize::new(CONTENT_WIDTH, CONTENT_HEIGHT),
        )
        .map_err(|error| format!("Could not open the browser page: {error}"))?;

    // The children were built from logical sizes, but events carry physical ones: apply the
    // shared bounds once here so a page opened on a scaled display never paints oversized.
    if let Ok(size) = window.inner_size() {
        resize_children(app, session, size);
    }

    // Windows intercepts every resource request; other platforms are navigation-only for now.
    // The filter is installed in every mode: its handler asks the cached policy, so switching
    // to trusted-site applies to this page on the next request instead of a new window.
    #[cfg(windows)]
    install_resource_interceptor(&page, app.clone(), session);
    #[cfg(not(windows))]
    let _ = page;

    Ok(())
}

/// The top-level navigation gate shared by the engine backends. A refused host is recorded and
/// published to the chrome, which can offer to allow it.
fn allow_navigation(app: &AppHandle, session: u64, url: &Url) -> bool {
    !refuse_if_blocked(app, session, url.as_str())
}

/// Record and report a top-level navigation that the allowlist refuses. Returns whether the
/// navigation must be stopped.
fn refuse_if_blocked(app: &AppHandle, session: u64, url: &str) -> bool {
    let allowed = browser_policy::allowed();
    // Navigation is gated the same way in every policy mode; trusted-site only skips resources.
    // The cached mode keeps the store off the navigation path and follows a Settings change.
    let policy = browser_policy::cached_policy();
    if !policy.blocks_navigation(url, &allowed) {
        return false;
    }
    let host = browser_policy::host_of(url);
    if !host.is_empty() {
        browser_policy::record_blocked_host(app, &host);
    }
    // A refused redirect arrives after the chrome already recorded the URL it was started for:
    // put the session back on the page the webview is still showing.
    restore_displayed(app, session);
    if let Err(error) = app.emit(
        NAVIGATION_BLOCKED_EVENT,
        serde_json::json!({ "session": session, "host": host }),
    ) {
        tracing::warn!("could not emit the blocked navigation: {error}");
    }
    true
}

/// Put the session back on the page the webview still shows after a navigation was refused.
///
/// History is updated when a navigation is issued, before it lands; a redirect the gate refuses
/// would otherwise leave the address bar on a URL that never loaded. When nothing was issued
/// since the last finished load this is a no-op.
fn restore_displayed(app: &AppHandle, session: u64) {
    let changed = {
        let Ok(mut runtime) = RUNTIME.lock() else {
            return;
        };
        let Some(state) = runtime.sessions.get_mut(&session) else {
            return;
        };
        if state.info.url == state.loaded_url {
            return;
        }
        let previous = state.info.clone();
        state.index = state.loaded_index;
        // Everything after the displayed entry was reached through the refused navigation.
        state.history.truncate(state.loaded_index + 1);
        state.info.url = state.loaded_url.clone();
        state.info.host = browser_policy::host_of(&state.info.url);
        state.info.can_back = state.index > 0;
        state.info.can_forward = state.index + 1 < state.history.len();
        (state.info != previous).then(|| state.info.clone())
    };
    if let Some(info) = changed {
        emit_session(app, &info);
    }
}

/// macOS fallback: keep the page embedded but with no chrome bar. WKWebView in this Tauri
/// version has no reliable multi-webview embedding, so the page gets an ordinary
/// `WebviewWindow`; recording stays reachable from the main window, and the system browser
/// remains the escape hatch. This deliberately has no panic path.
#[cfg(target_os = "macos")]
fn build_session_window(app: &AppHandle, session: u64, info: &BrowserSessionInfo, parsed: Url) -> Result<(), String> {
    let navigation_app = app.clone();
    tauri::WebviewWindowBuilder::new(app, page_label(session), WebviewUrl::External(parsed))
        .title(info.host.clone())
        .inner_size(CONTENT_WIDTH, CONTENT_HEIGHT)
        .focused(true)
        .on_navigation(move |url| allow_navigation(&navigation_app, session, url))
        .on_page_load(move |window, payload| {
            tracing::info!(
                session,
                url = %redact_query(payload.url().as_str()),
                event = ?payload.event(),
                "meeting browser page load"
            );
            if payload.event() == PageLoadEvent::Finished {
                handle_page_load(window.app_handle(), session, payload.url());
            }
        })
        .build()
        .map_err(|error| format!("Could not open the browser window: {error}"))?;
    Ok(())
}

// Async on purpose: WebView2 creates its environment by pumping the message loop, and a
// synchronous command runs on the main thread — pumping there from inside the event loop is
// what froze the app, leaving a white window and no way out. An async command runs on the
// async runtime, and Tauri marshals the window creation to the main loop itself.
#[tauri::command]
pub async fn open_meeting_browser(app: AppHandle, url: String) -> Result<BrowserSessionInfo, String> {
    let parsed = Url::parse(&url).map_err(|error| format!("Invalid URL {url:?}: {error}"))?;
    if parsed.scheme() != "https" {
        return Err(format!(
            "Only https URLs can be opened; {url:?} uses the {} scheme",
            parsed.scheme()
        ));
    }
    let host = parsed
        .host_str()
        .ok_or_else(|| format!("URL {url:?} has no host"))?
        .trim_end_matches('.')
        .to_ascii_lowercase();
    let normalized = parsed.as_str().to_string();

    let allowed = browser_policy::load_allowed(&app);
    if !browser_policy::is_allowed_url(&normalized, &allowed) {
        browser_policy::record_blocked_host(&app, &host);
        return Err(format!("{host} is not in the allowlist"));
    }

    // Look up and insert under one lock: two calls for the same link (a double click on the
    // meeting page, a repeated invoke from `open_meeting_link`) must not both miss and open a
    // second window.
    let (existing, created) = {
        let mut runtime = lock_runtime()?;
        let existing = runtime
            .sessions
            .values()
            .find(|state| state.info.url == normalized)
            .map(|state| state.info.clone());
        if existing.is_some() {
            (existing, None)
        } else {
            let session = NEXT_SESSION.fetch_add(1, Ordering::Relaxed);
            let info = BrowserSessionInfo {
                session,
                url: normalized.clone(),
                host,
                can_back: false,
                can_forward: false,
            };
            runtime.sessions.insert(
                session,
                BrowserSession {
                    info: info.clone(),
                    history: vec![normalized.clone()],
                    index: 0,
                    force_close: false,
                    loaded: false,
                    expanded: false,
                    blocked_requests: false,
                    // Nothing has loaded yet: the initial URL is what a refusal rolls back to.
                    loaded_url: normalized,
                    loaded_index: 0,
                },
            );
            (None, Some(info))
        }
    };
    if let Some(info) = existing {
        if let Some(window) = app.get_window(&browser_label(info.session)) {
            let _ = window.show();
            let _ = window.set_focus();
        }
        return Ok(info);
    }
    let Some(info) = created else {
        return Err("the meeting browser session was neither found nor created".to_string());
    };
    let session = info.session;
    tracing::info!(session, url = %redact_query(&info.url), host = %info.host, "opening meeting browser");
    tracing::info!(session, "creating the browser window");
    // Suppress external detection as soon as the browser session exists, before the webview
    // has loaded enough to fire its first page event.
    let initial_count = lock_runtime()?.session_count();
    sync_meeting_suppression(initial_count);
    tracing::info!(session, "meeting suppression updated");

    if let Err(error) = build_session_window(&app, session, &info, parsed) {
        let count = if let Ok(mut runtime) = RUNTIME.lock() {
            runtime.sessions.remove(&session);
            Some(runtime.session_count())
        } else {
            None
        };
        if let Some(count) = count {
            sync_meeting_suppression(count);
        }
        // A window may exist even if one of its webviews failed to attach.
        if let Some(window) = app.get_window(&browser_label(session)) {
            let _ = window.close();
        }
        return Err(error);
    }
    tracing::info!(session, "browser window is up");

    let Some(window) = app.get_window(&browser_label(session)) else {
        // The window went away between `build` and here; without the handler below its
        // `Destroyed` event would never finalize the session, which would keep suppressing the
        // external meeting prompt for the rest of the run.
        finalize_session(&app, session);
        return Err(format!("Browser window for session {session} is not open"));
    };
    let handler_app = app.clone();
    window.on_window_event(move |event| match event {
        WindowEvent::CloseRequested { api, .. } => {
            let force_close = RUNTIME
                .lock()
                .map(|runtime| runtime.sessions.get(&session).is_none_or(|state| state.force_close))
                .unwrap_or(true);
            // A recording somewhere in Vibe may cover this call: let the main window decide.
            if force_close || !crate::cmd::audio::recording_active() {
                return;
            }
            api.prevent_close();
            if let Err(error) = handler_app.emit_to("main", CLOSE_REQUESTED_EVENT, serde_json::json!({ "session": session })) {
                tracing::warn!("could not emit meeting browser close request: {error}");
            }
        }
        WindowEvent::Destroyed => finalize_session(&handler_app, session),
        #[cfg(not(target_os = "macos"))]
        WindowEvent::Resized(size) => resize_children(&handler_app, session, *size),
        // A display change reports the new physical inner size; the helper re-reads the
        // scale factor, so the children follow the new factor instead of the old one.
        #[cfg(not(target_os = "macos"))]
        WindowEvent::ScaleFactorChanged { new_inner_size, .. } => resize_children(&handler_app, session, *new_inner_size),
        _ => {}
    });

    // Tauri 2.10 has no builder-time window-event hook, so the handler is attached only after
    // `build`: a window destroyed in that gap reports nothing and would leak the session (and its
    // meeting-prompt suppression), so check that it is still there.
    if app.get_window(&browser_label(session)).is_none() {
        finalize_session(&app, session);
        return Err(format!("Browser window for session {session} closed while it was opening"));
    }

    // A webview that never finishes loading shows a blank surface with no explanation. Ask the
    // main window instead, so the user gets retry and close rather than a silent white window.
    {
        let watchdog_app = app.clone();
        let watchdog_url = info.url.clone();
        tauri::async_runtime::spawn(async move {
            tokio::time::sleep(LOAD_TIMEOUT).await;
            let unloaded = RUNTIME
                .lock()
                .ok()
                .and_then(|runtime| runtime.sessions.get(&session).map(|state| !state.loaded))
                .unwrap_or(false);
            if !unloaded {
                return;
            }
            tracing::warn!(session, url = %redact_query(&watchdog_url), "meeting browser page did not finish loading");
            if let Err(error) = watchdog_app.emit_to("main", LOAD_FAILED_EVENT, serde_json::json!({ "session": session })) {
                tracing::warn!("could not emit meeting browser load failure: {error}");
            }
        });
    }

    let (info, count) = {
        let runtime = lock_runtime()?;
        let info = runtime.sessions.get(&session).map(|state| state.info.clone()).unwrap_or(info);
        (info, runtime.session_count())
    };
    emit_session(&app, &info);
    sync_meeting_suppression(count);
    Ok(info)
}

#[tauri::command]
pub fn meeting_browser_session(session: u64) -> Result<Option<BrowserSessionInfo>, String> {
    let runtime = lock_runtime()?;
    Ok(runtime.sessions.get(&session).map(|state| state.info.clone()))
}

#[tauri::command]
pub fn meeting_browser_navigate(app: AppHandle, session: u64, action: String) -> Result<(), String> {
    let (target, new_index) = {
        let runtime = lock_runtime()?;
        let state = runtime
            .sessions
            .get(&session)
            .ok_or_else(|| format!("Unknown browser session {session}"))?;
        match action.as_str() {
            "back" => {
                if state.index == 0 {
                    return Ok(());
                }
                (state.history[state.index - 1].clone(), Some(state.index - 1))
            }
            "forward" => {
                if state.index + 1 >= state.history.len() {
                    return Ok(());
                }
                (state.history[state.index + 1].clone(), Some(state.index + 1))
            }
            "reload" => (
                state
                    .history
                    .get(state.index)
                    .cloned()
                    .ok_or_else(|| format!("Browser session {session} has no current page"))?,
                None,
            ),
            other => return Err(format!("Unsupported navigation action {other:?}")),
        }
    };

    // A reload of a host the user removed is a navigation too, so it is refused and reported.
    if refuse_if_blocked(&app, session, &target) {
        return Err(format!("{} is not in the allowlist", browser_policy::host_of(&target)));
    }
    let page = app
        .get_webview(&page_label(session))
        .ok_or_else(|| format!("Browser page for session {session} is not open"))?;
    let parsed = Url::parse(&target).map_err(|error| format!("Invalid tracked URL {target:?}: {error}"))?;
    page.navigate(parsed)
        .map_err(|error| format!("Could not navigate the browser page: {error}"))?;

    if let Some(index) = new_index {
        let (changed, count) = {
            let mut runtime = lock_runtime()?;
            let changed = {
                let Some(state) = runtime.sessions.get_mut(&session) else {
                    return Ok(());
                };
                let previous = state.info.clone();
                state.index = index;
                state.info.url = target;
                state.info.host = browser_policy::host_of(&state.info.url);
                state.info.can_back = state.index > 0;
                state.info.can_forward = state.index + 1 < state.history.len();
                (state.info != previous).then(|| state.info.clone())
            };
            (changed, runtime.session_count())
        };
        if let Some(info) = changed {
            emit_session(&app, &info);
        }
        sync_meeting_suppression(count);
    }
    Ok(())
}

/// Load a URL typed into the chrome: a fresh entry in the same session's history.
#[tauri::command]
pub fn meeting_browser_load(app: AppHandle, session: u64, url: String) -> Result<BrowserSessionInfo, String> {
    let parsed = Url::parse(&url).map_err(|error| format!("Invalid URL {url:?}: {error}"))?;
    if parsed.scheme() != "https" {
        return Err(format!(
            "Only https URLs can be opened; {url:?} uses the {} scheme",
            parsed.scheme()
        ));
    }
    if refuse_if_blocked(&app, session, parsed.as_str()) {
        return Err(format!(
            "{} is not in the allowlist",
            browser_policy::host_of(parsed.as_str())
        ));
    }
    let page = app
        .get_webview(&page_label(session))
        .ok_or_else(|| format!("Browser page for session {session} is not open"))?;
    // Navigate first: if the engine refuses, the session's history, address bar and back/forward
    // state must stay on the page that is still shown. `meeting_browser_navigate` has the same
    // order.
    let target = parsed.as_str().to_string();
    page.navigate(parsed)
        .map_err(|error| format!("Could not navigate the browser page: {error}"))?;
    let (info, count) = {
        let mut runtime = lock_runtime()?;
        let state = runtime
            .sessions
            .get_mut(&session)
            .ok_or_else(|| format!("Unknown browser session {session}"))?;
        state.history.truncate(state.index + 1);
        state.history.push(target.clone());
        state.index = state.history.len() - 1;
        state.info.url = target;
        state.info.host = browser_policy::host_of(&state.info.url);
        state.info.can_back = state.index > 0;
        state.info.can_forward = false;
        (state.info.clone(), runtime.session_count())
    };
    emit_session(&app, &info);
    sync_meeting_suppression(count);
    Ok(info)
}

#[tauri::command]
pub fn meeting_browser_open_external(session: u64) -> Result<(), String> {
    let url = {
        let runtime = lock_runtime()?;
        runtime
            .sessions
            .get(&session)
            .map(|state| state.info.url.clone())
            .ok_or_else(|| format!("Unknown browser session {session}"))?
    };
    tauri_plugin_opener::open_url(url, None::<&str>)
        .map_err(|error| format!("Could not open the URL in the system browser: {error}"))
}

#[tauri::command]
pub fn meeting_browser_close(app: AppHandle, session: u64) -> Result<(), String> {
    close_session(&app, session)
}

/// Grow or restore the chrome so the blocked-hosts region fits inside it; the page takes the
/// remaining height. Both webviews are repositioned through the same bounds helper as a resize.
#[tauri::command]
pub fn browser_set_chrome_expanded(app: AppHandle, session: u64, expanded: bool) -> Result<(), String> {
    {
        let mut runtime = lock_runtime()?;
        let state = runtime
            .sessions
            .get_mut(&session)
            .ok_or_else(|| format!("Unknown browser session {session}"))?;
        state.expanded = expanded;
    }
    // macOS has a single page window and no chrome webview to grow.
    #[cfg(not(target_os = "macos"))]
    resize_to_window(&app, session)?;
    #[cfg(target_os = "macos")]
    let _ = &app;
    Ok(())
}

#[tauri::command]
pub fn meeting_browser_confirm_close(app: AppHandle, session: u64, stop_recording: bool) -> Result<(), String> {
    if stop_recording {
        // The recorder listens for this event itself; the browser closes right after.
        if let Err(error) = app.emit("stop_record", serde_json::json!({})) {
            tracing::warn!("could not stop the recording before closing the browser: {error}");
        }
    }
    close_session(&app, session)
}

#[tauri::command]
pub fn meeting_schemes_supported() -> bool {
    crate::custom_protocol::MEETING_SCHEMES_SUPPORTED
}

#[tauri::command]
pub fn meeting_schemes_enabled(app: AppHandle) -> bool {
    schemes_enabled(&app)
}

pub(crate) fn schemes_enabled(app: &AppHandle) -> bool {
    app.store(STORE_FILENAME)
        .ok()
        .and_then(|store| store.get(SCHEMES_KEY))
        .and_then(|value| value.as_bool())
        .unwrap_or(false)
}

#[tauri::command]
pub fn set_meeting_schemes_enabled(app: AppHandle, enabled: bool) -> Result<(), String> {
    if enabled && !crate::custom_protocol::MEETING_SCHEMES_SUPPORTED {
        return Err("registering meeting schemes is not supported on this platform".to_string());
    }
    // Save the intent before touching the system: if the registration then fails, the flag is
    // rolled back, so a failure can never leave the setting on while nothing was registered.
    let store = app.store(STORE_FILENAME).map_err(|error| error.to_string())?;
    store.set(SCHEMES_KEY, serde_json::json!(enabled));
    store.save().map_err(|error| error.to_string())?;
    let registered = if enabled {
        crate::custom_protocol::register_meeting_schemes()
    } else {
        crate::custom_protocol::unregister_meeting_schemes()
    };
    if let Err(error) = registered {
        // Registration is idempotent, so toggling again retries whatever did not apply.
        store.set(SCHEMES_KEY, serde_json::json!(!enabled));
        if let Err(rollback) = store.save() {
            tracing::error!("could not roll back the meeting schemes setting: {rollback}");
        }
        return Err(format!("Could not update the system link handlers: {error}"));
    }
    Ok(())
}

/// A scheme or web link from the system: mapped to https, then either the meeting window
/// (configured host) or the system browser, so the handler never traps an ordinary link.
#[tauri::command]
pub async fn open_meeting_link(app: AppHandle, raw: String) -> Result<Option<BrowserSessionInfo>, String> {
    let url = if raw.starts_with("https://") {
        raw
    } else {
        crate::meeting_schemes::meeting_url(&raw)
            .ok_or_else(|| format!("This link is not a meeting link Vibe can open: {raw:?}"))?
    };
    let allowed = browser_policy::load_allowed(&app);
    if browser_policy::is_allowed_url(&url, &allowed) {
        open_meeting_browser(app, url).await.map(Some)
    } else {
        tauri_plugin_opener::open_url(url, None::<&str>)
            .map_err(|error| format!("Could not open the URL in the system browser: {error}"))?;
        Ok(None)
    }
}

#[tauri::command]
pub fn meeting_browser_retry(app: AppHandle, session: u64) -> Result<(), String> {
    meeting_browser_navigate(app, session, "reload".to_string())
}

#[tauri::command]
pub fn browser_allowed_hosts(app: AppHandle) -> Result<Vec<String>, String> {
    Ok(browser_policy::load_allowed(&app))
}

#[tauri::command]
pub fn browser_blocked_hosts() -> Vec<String> {
    browser_policy::blocked_hosts()
}

/// Add a host to the allowlist and reload the pages whose resources were refused, so they retry.
#[tauri::command]
pub fn browser_allow_host(app: AppHandle, host: String) -> Result<Vec<String>, String> {
    let allowed = browser_policy::allow_host(&app, &host)?;
    reload_browser_pages(&app);
    Ok(allowed)
}

#[tauri::command]
pub fn browser_remove_allowed_host(app: AppHandle, host: String) -> Result<Vec<String>, String> {
    browser_policy::remove_allowed_host(&app, &host)
}

/// The stored strictness mode (`strict` or `trusted-site`); missing means `strict`.
#[tauri::command]
pub fn get_browser_policy(app: AppHandle) -> String {
    browser_policy::load_policy(&app).as_str().to_string()
}

/// Whether `strict` mode really filters resources on this platform. Where it cannot, Settings
/// must offer the modes as the same navigation gate instead of a privacy difference that is not
/// there (`trusted-site` behaves identically).
#[tauri::command]
pub fn browser_resource_filter_supported() -> bool {
    browser_policy::RESOURCE_FILTER_SUPPORTED
}

/// Persist the strictness mode; anything but the two known values is refused.
#[tauri::command]
pub fn set_browser_policy(app: AppHandle, policy: String) -> Result<String, String> {
    browser_policy::save_policy(&app, &policy).map(|policy| policy.as_str().to_string())
}

/// Reload the page webviews that had a resource refused, so a host the user just allowed retries.
///
/// Only `strict` refuses resources and only a refused page has anything to retry; trusting-site
/// pages are reloaded never, so allowing a host there cannot tear down a live call for nothing.
fn reload_browser_pages(app: &AppHandle) {
    if browser_policy::cached_policy() != browser_policy::Policy::Strict {
        return;
    }
    let sessions: Vec<u64> = match RUNTIME.lock() {
        Ok(mut runtime) => {
            let mut sessions = Vec::new();
            for (session, state) in runtime.sessions.iter_mut() {
                if std::mem::take(&mut state.blocked_requests) {
                    sessions.push(*session);
                }
            }
            sessions
        }
        Err(_) => return,
    };
    for session in sessions {
        if let Some(page) = app.get_webview(&page_label(session)) {
            if let Err(error) = page.reload() {
                tracing::warn!(session, "could not reload the browser page: {error}");
            }
        }
    }
}

#[cfg(windows)]
fn install_resource_interceptor(page: &tauri::Webview, app: AppHandle, session: u64) {
    // `with_webview` runs the closure on the UI thread, where WebView2 expects its COM calls.
    // Any failure must leave the window usable: navigation blocking is already installed.
    if let Err(error) = page.with_webview(move |platform| {
        // SAFETY: the closure runs on the main thread; every COM result is checked below.
        if let Err(error) = unsafe { attach_resource_filter(&platform, &app, session) } {
            tracing::warn!("could not attach the WebView2 resource filter ({error}); falling back to navigation-only blocking");
        }
    }) {
        tracing::warn!("could not reach the WebView2 handle: {error}; falling back to navigation-only blocking");
    }
}

/// # Safety
///
/// Must run on the UI/main thread with the handle of the webview the filter belongs to: WebView2
/// COM objects are apartment-bound. The handler registered here captures clones of `app` and of
/// the webview's environment and lives at least as long as the webview, so both stay valid for
/// the handler's lifetime.
#[cfg(windows)]
unsafe fn attach_resource_filter(
    platform: &tauri::webview::PlatformWebview,
    app: &AppHandle,
    session: u64,
) -> Result<(), String> {
    use webview2_com::Microsoft::Web::WebView2::Win32::{
        ICoreWebView2, ICoreWebView2WebResourceRequestedEventArgs, COREWEBVIEW2_WEB_RESOURCE_CONTEXT_ALL,
    };
    use webview2_com::WebResourceRequestedEventHandler;
    use windows061::core::HSTRING;

    let controller = platform.controller();
    let core = controller.CoreWebView2().map_err(|error| error.to_string())?;
    let environment = platform.environment();
    core.AddWebResourceRequestedFilter(&HSTRING::from("*"), COREWEBVIEW2_WEB_RESOURCE_CONTEXT_ALL)
        .map_err(|error| error.to_string())?;

    let handler_app = app.clone();
    let handler_environment = environment.clone();
    let handler = WebResourceRequestedEventHandler::create(Box::new(
        move |_sender: Option<ICoreWebView2>, args: Option<ICoreWebView2WebResourceRequestedEventArgs>| {
            let Some(args) = args else { return Ok(()) };
            if let Err(error) = block_resource_request(&handler_app, &handler_environment, &args, session) {
                tracing::warn!("could not block a WebView2 resource request: {error}");
            }
            Ok(())
        },
    ));
    core.add_WebResourceRequested(&handler, std::ptr::null_mut())
        .map_err(|error| error.to_string())?;
    Ok(())
}

/// Answer a refused resource request with an error response, so the engine does not retry and
/// the page sees the origin as unavailable. Allowed requests are left to the engine.
///
/// # Safety
///
/// Called only from the resource handler of one live webview, on the UI thread: `environment`
/// and `args` belong to that webview and are valid only for the duration of the event. The
/// request's `PWSTR` is owned by the request and taken with `take_pwstr`; the response built from
/// `environment` is handed to `args`, which takes ownership.
#[cfg(windows)]
unsafe fn block_resource_request(
    app: &AppHandle,
    environment: &webview2_com::Microsoft::Web::WebView2::Win32::ICoreWebView2Environment,
    args: &webview2_com::Microsoft::Web::WebView2::Win32::ICoreWebView2WebResourceRequestedEventArgs,
    session: u64,
) -> Result<(), String> {
    use windows061::core::{HSTRING, PWSTR};
    use windows061::Win32::System::Com::IStream;

    let request = args.Request().map_err(|error| error.to_string())?;
    let mut uri = PWSTR::null();
    request.Uri(&mut uri).map_err(|error| error.to_string())?;
    let uri = webview2_com::take_pwstr(uri);
    // The filter is installed in every mode; the cached policy decides whether this request is
    // refused, so a Settings change applies without reopening the page and no store is read here.
    let allowed = browser_policy::allowed();
    if !browser_policy::blocks_resource(&uri, allowed.as_slice()) {
        return Ok(());
    }
    let host = browser_policy::host_of(&uri);
    if !host.is_empty() {
        browser_policy::record_blocked_host(app, &host);
        // Mark the page so allowing a host reloads this session and retries, and only this one.
        if let Ok(mut runtime) = RUNTIME.lock() {
            if let Some(state) = runtime.sessions.get_mut(&session) {
                state.blocked_requests = true;
            }
        }
    }
    let reason = HSTRING::from("Blocked by Vibe");
    let headers = HSTRING::from("");
    let response = environment
        .CreateWebResourceResponse(None::<&IStream>, 403, &reason, &headers)
        .map_err(|error| error.to_string())?;
    args.SetResponse(&response).map_err(|error| error.to_string())?;
    Ok(())
}

#[cfg(all(test, not(target_os = "macos")))]
mod tests {
    use super::*;

    #[test]
    fn initial_and_expanded_bounds_are_physical() {
        // A fresh window: the page starts under the toolbar at both scale factors.
        let size = PhysicalSize::new(1100, 864);
        assert_eq!(
            child_bounds(size, 1.0, false),
            ChildBounds {
                width: 1100,
                chrome_height: 104,
                page_y: 104,
                page_height: 760,
            }
        );
        // At 1.5 the events are physical, so the logical heights are scaled and rounded.
        assert_eq!(
            child_bounds(PhysicalSize::new(1650, 1296), 1.5, false),
            ChildBounds {
                width: 1650,
                chrome_height: 156,
                page_y: 156,
                page_height: 1140,
            }
        );
    }

    #[test]
    fn expansion_adds_the_blocked_list_height_and_shrinks_the_page() {
        let size = PhysicalSize::new(1100, 864);
        let collapsed = child_bounds(size, 1.0, false);
        let expanded = child_bounds(size, 1.0, true);

        assert_eq!(expanded.chrome_height, collapsed.chrome_height + BLOCKED_LIST_H as u32);
        assert_eq!(expanded.page_y, expanded.chrome_height);
        assert_eq!(expanded.page_height, collapsed.page_height - BLOCKED_LIST_H as u32);
        assert_eq!(expanded.width, collapsed.width);

        // 1.5 scale: the growth is scaled too, and the two heights still tile the window.
        let scaled = child_bounds(PhysicalSize::new(1650, 1296), 1.5, true);
        assert_eq!(scaled.chrome_height, 456);
        assert_eq!(scaled.page_y, 456);
        assert_eq!(scaled.page_height, 840);
        assert_eq!(scaled.chrome_height + scaled.page_height, 1296);
    }

    #[test]
    fn logged_urls_drop_the_query_that_carries_the_password() {
        assert_eq!(redact_query("https://zoom.us/j/1?pwd=s3cret#x"), "https://zoom.us/j/1");
        assert_eq!(redact_query("not a url?pwd=x"), "not a url");
    }

    #[test]
    fn bounds_never_overflow_a_window_shorter_than_the_chrome() {
        let bounds = child_bounds(PhysicalSize::new(800, 100), 1.0, true);
        assert_eq!(bounds.chrome_height, 100);
        assert_eq!(bounds.page_y, 100);
        assert_eq!(bounds.page_height, 0);
    }
}
