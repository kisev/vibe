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
const TOOLBAR_H: f64 = 104.0;
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
            state.info.url = normalized;
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
        window
            .close()
            .map_err(|error| format!("Could not close the browser window: {error}"))?;
    } else {
        finalize_session(app, session);
    }
    Ok(())
}

/// Keep the chrome and the page filling the window: the chrome spans the whole surface, and the
/// page starts below the toolbar, so its top edge never covers the controls.
#[cfg(not(target_os = "macos"))]
fn resize_children(app: &AppHandle, session: u64, size: PhysicalSize<u32>) {
    let scale = app
        .get_window(&browser_label(session))
        .and_then(|window| window.scale_factor().ok())
        .unwrap_or(1.0);
    let toolbar = (TOOLBAR_H * scale).round() as u32;
    let page_height = size.height.saturating_sub(toolbar);
    if let Some(chrome) = app.get_webview(&chrome_label(session)) {
        if let Err(error) = chrome.set_size(PhysicalSize::new(size.width, size.height)) {
            tracing::warn!(session, "could not resize the browser chrome: {error}");
        }
        if let Err(error) = chrome.set_position(PhysicalPosition::new(0, 0)) {
            tracing::warn!(session, "could not place the browser chrome: {error}");
        }
    }
    if let Some(page) = app.get_webview(&page_label(session)) {
        if let Err(error) = page.set_size(PhysicalSize::new(size.width, page_height)) {
            tracing::warn!(session, "could not resize the browser page: {error}");
        }
        if let Err(error) = page.set_position(PhysicalPosition::new(0, toolbar)) {
            tracing::warn!(session, "could not place the browser page: {error}");
        }
    }
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

    let chrome_url = format!("index.html?window=browser&session={session}");
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
                        url = %payload.url(),
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

    // Windows intercepts every resource request; other platforms are navigation-only for now.
    // The policy is read here, once per window: changing it in Settings applies to windows
    // opened afterwards, never to a page that is already loaded.
    #[cfg(windows)]
    if browser_policy::load_policy(app).filters_resources() {
        install_resource_interceptor(&page, app.clone());
    }
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
    let policy = browser_policy::load_policy(app);
    if !policy.blocks_navigation(url, &allowed) {
        return false;
    }
    let host = browser_policy::host_of(url);
    if !host.is_empty() {
        browser_policy::record_blocked_host(app, &host);
    }
    if let Err(error) = app.emit(
        NAVIGATION_BLOCKED_EVENT,
        serde_json::json!({ "session": session, "host": host }),
    ) {
        tracing::warn!("could not emit the blocked navigation: {error}");
    }
    true
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
                url = %payload.url(),
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

    let existing = {
        let runtime = lock_runtime()?;
        runtime
            .sessions
            .values()
            .find(|state| state.info.url == normalized)
            .map(|state| state.info.clone())
    };
    if let Some(info) = existing {
        if let Some(window) = app.get_window(&browser_label(info.session)) {
            let _ = window.show();
            let _ = window.set_focus();
        }
        return Ok(info);
    }

    let session = NEXT_SESSION.fetch_add(1, Ordering::Relaxed);
    let info = BrowserSessionInfo {
        session,
        url: normalized.clone(),
        host,
        can_back: false,
        can_forward: false,
    };
    {
        let mut runtime = lock_runtime()?;
        runtime.sessions.insert(
            session,
            BrowserSession {
                info: info.clone(),
                history: vec![normalized],
                index: 0,
                force_close: false,
                loaded: false,
            },
        );
    }
    tracing::info!(session, url = %info.url, host = %info.host, "opening meeting browser");
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

    let window = app
        .get_window(&browser_label(session))
        .ok_or_else(|| format!("Browser window for session {session} is not open"))?;
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
        _ => {}
    });

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
            tracing::warn!(session, url = %watchdog_url, "meeting browser page did not finish loading");
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
    let (info, count) = {
        let mut runtime = lock_runtime()?;
        let state = runtime
            .sessions
            .get_mut(&session)
            .ok_or_else(|| format!("Unknown browser session {session}"))?;
        state.history.truncate(state.index + 1);
        state.history.push(parsed.as_str().to_string());
        state.index = state.history.len() - 1;
        state.info.url = parsed.as_str().to_string();
        state.info.host = browser_policy::host_of(&state.info.url);
        state.info.can_back = state.index > 0;
        state.info.can_forward = false;
        (state.info.clone(), runtime.session_count())
    };
    page.navigate(parsed)
        .map_err(|error| format!("Could not navigate the browser page: {error}"))?;
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
    if enabled {
        crate::custom_protocol::register_meeting_schemes()
    } else {
        crate::custom_protocol::unregister_meeting_schemes()
    }
    .map_err(|error| format!("Could not update the system link handlers: {error}"))?;
    let store = app.store(STORE_FILENAME).map_err(|error| error.to_string())?;
    store.set(SCHEMES_KEY, serde_json::json!(enabled));
    store.save().map_err(|error| error.to_string())?;
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

/// Add a host to the allowlist and reload the open pages so their refused assets retry.
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

/// Persist the strictness mode; anything but the two known values is refused.
#[tauri::command]
pub fn set_browser_policy(app: AppHandle, policy: String) -> Result<String, String> {
    browser_policy::save_policy(&app, &policy).map(|policy| policy.as_str().to_string())
}

/// Reload every page webview that is open, on the main thread where the engine expects it.
fn reload_browser_pages(app: &AppHandle) {
    let sessions: Vec<u64> = match RUNTIME.lock() {
        Ok(runtime) => runtime.sessions.keys().copied().collect(),
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
fn install_resource_interceptor(page: &tauri::Webview, app: AppHandle) {
    // `with_webview` runs the closure on the UI thread, where WebView2 expects its COM calls.
    // Any failure must leave the window usable: navigation blocking is already installed.
    if let Err(error) = page.with_webview(move |platform| {
        // SAFETY: the closure runs on the main thread; every COM result is checked below.
        if let Err(error) = unsafe { attach_resource_filter(&platform, &app) } {
            tracing::warn!("could not attach the WebView2 resource filter ({error}); falling back to navigation-only blocking");
        }
    }) {
        tracing::warn!("could not reach the WebView2 handle: {error}; falling back to navigation-only blocking");
    }
}

#[cfg(windows)]
unsafe fn attach_resource_filter(platform: &tauri::webview::PlatformWebview, app: &AppHandle) -> Result<(), String> {
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
            if let Err(error) = block_resource_request(&handler_app, &handler_environment, &args) {
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
#[cfg(windows)]
unsafe fn block_resource_request(
    app: &AppHandle,
    environment: &webview2_com::Microsoft::Web::WebView2::Win32::ICoreWebView2Environment,
    args: &webview2_com::Microsoft::Web::WebView2::Win32::ICoreWebView2WebResourceRequestedEventArgs,
) -> Result<(), String> {
    use windows061::core::{HSTRING, PWSTR};
    use windows061::Win32::System::Com::IStream;

    let request = args.Request().map_err(|error| error.to_string())?;
    let mut uri = PWSTR::null();
    request.Uri(&mut uri).map_err(|error| error.to_string())?;
    let uri = webview2_com::take_pwstr(uri);
    if !browser_policy::should_block(&uri, &browser_policy::allowed()) {
        return Ok(());
    }
    let host = browser_policy::host_of(&uri);
    if !host.is_empty() {
        browser_policy::record_blocked_host(app, &host);
    }
    let reason = HSTRING::from("Blocked by Vibe");
    let headers = HSTRING::from("");
    let response = environment
        .CreateWebResourceResponse(None::<&IStream>, 403, &reason, &headers)
        .map_err(|error| error.to_string())?;
    args.SetResponse(&response).map_err(|error| error.to_string())?;
    Ok(())
}
