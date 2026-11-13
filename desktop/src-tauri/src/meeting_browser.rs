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

const HOSTS_KEY: &str = "meeting.browserHosts";
/// Opt-in registration as the system handler for other applications' meeting schemes.
const SCHEMES_KEY: &str = "meeting.schemesEnabled";
const DEFAULT_HOSTS: [&str; 2] = ["telemost.yandex.ru", "stream.wb.ru"];
const SESSION_EVENT: &str = "meeting-browser-session";
const CLOSED_EVENT: &str = "meeting-browser-closed";
const CLOSE_REQUESTED_EVENT: &str = "meeting-browser-close-requested";
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
    pub is_meeting: bool,
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
    fn meeting_count(&self) -> usize {
        self.sessions.values().filter(|session| session.info.is_meeting).count()
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

fn default_hosts() -> Vec<String> {
    DEFAULT_HOSTS.iter().map(|host| (*host).to_string()).collect()
}

/// Accepts a bare host name or a pasted URL and returns a lowercase host name.
fn normalize_host(raw: &str) -> Option<String> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return None;
    }
    let candidate = if trimmed.contains("://") {
        trimmed.to_string()
    } else {
        format!("https://{trimmed}")
    };
    let parsed = Url::parse(&candidate).ok()?;
    let host = parsed.host_str()?.trim_end_matches('.').to_ascii_lowercase();
    (!host.is_empty()).then_some(host)
}

fn normalize_hosts(hosts: impl IntoIterator<Item = String>) -> Vec<String> {
    let mut normalized: Vec<String> = Vec::new();
    for raw in hosts {
        let Some(host) = normalize_host(&raw) else {
            continue;
        };
        if !normalized.contains(&host) {
            normalized.push(host);
        }
    }
    normalized
}

fn load_hosts(app: &AppHandle) -> Vec<String> {
    let Ok(store) = app.store(STORE_FILENAME) else {
        return default_hosts();
    };
    let Some(value) = store.get(HOSTS_KEY) else {
        return default_hosts();
    };
    let Some(items) = value.as_array() else {
        return default_hosts();
    };
    normalize_hosts(items.iter().filter_map(|item| item.as_str().map(str::to_string)))
}

fn host_of(url: &str) -> String {
    Url::parse(url)
        .ok()
        .and_then(|parsed| parsed.host_str().map(|host| host.trim_end_matches('.').to_ascii_lowercase()))
        .unwrap_or_default()
}

/// Meeting hosts only match over https, on the exact host or one of its subdomains.
fn is_meeting_url(url: &str, hosts: &[String]) -> bool {
    let Ok(parsed) = Url::parse(url) else {
        return false;
    };
    if parsed.scheme() != "https" {
        return false;
    }
    let Some(host) = parsed.host_str() else {
        return false;
    };
    let host = host.trim_end_matches('.').to_ascii_lowercase();
    hosts
        .iter()
        .any(|entry| host == *entry || host.ends_with(&format!(".{entry}")))
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
    let hosts = load_hosts(app);
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
            state.info.host = host_of(&state.info.url);
            state.info.is_meeting = is_meeting_url(&state.info.url, &hosts);
            state.info.can_back = state.index > 0;
            state.info.can_forward = state.index + 1 < state.history.len();
            (state.info != previous).then(|| state.info.clone())
        };
        (changed, runtime.meeting_count())
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
        (removed, runtime.meeting_count())
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
    window
        .add_child(
            WebviewBuilder::new(page_label(session), WebviewUrl::External(parsed)).on_page_load(move |webview, payload| {
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

    Ok(())
}

/// macOS fallback: keep the page embedded but with no chrome bar. WKWebView in this Tauri
/// version has no reliable multi-webview embedding, so the page gets an ordinary
/// `WebviewWindow`; recording stays reachable from the main window, and the system browser
/// remains the escape hatch. This deliberately has no panic path.
#[cfg(target_os = "macos")]
fn build_session_window(app: &AppHandle, session: u64, info: &BrowserSessionInfo, parsed: Url) -> Result<(), String> {
    tauri::WebviewWindowBuilder::new(app, page_label(session), WebviewUrl::External(parsed))
        .title(info.host.clone())
        .inner_size(CONTENT_WIDTH, CONTENT_HEIGHT)
        .focused(true)
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

    let hosts = load_hosts(&app);
    let session = NEXT_SESSION.fetch_add(1, Ordering::Relaxed);
    let info = BrowserSessionInfo {
        session,
        url: normalized.clone(),
        host,
        is_meeting: is_meeting_url(&normalized, &hosts),
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
    tracing::info!(session, url = %info.url, host = %info.host, meeting = info.is_meeting, "opening meeting browser");
    tracing::info!(session, "creating the browser window");
    // Suppress external detection as soon as the meeting session exists, before the webview
    // has loaded enough to fire its first page event.
    let initial_count = lock_runtime()?.meeting_count();
    sync_meeting_suppression(initial_count);
    tracing::info!(session, "meeting suppression updated");

    if let Err(error) = build_session_window(&app, session, &info, parsed) {
        let count = if let Ok(mut runtime) = RUNTIME.lock() {
            runtime.sessions.remove(&session);
            Some(runtime.meeting_count())
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
        (info, runtime.meeting_count())
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
    let hosts = load_hosts(&app);
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
                let host = host_of(&state.info.url);
                state.info.host = host;
                state.info.is_meeting = is_meeting_url(&state.info.url, &hosts);
                state.info.can_back = state.index > 0;
                state.info.can_forward = state.index + 1 < state.history.len();
                (state.info != previous).then(|| state.info.clone())
            };
            (changed, runtime.meeting_count())
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
    let page = app
        .get_webview(&page_label(session))
        .ok_or_else(|| format!("Browser page for session {session} is not open"))?;
    let hosts = load_hosts(&app);
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
        state.info.host = host_of(&state.info.url);
        state.info.is_meeting = is_meeting_url(&state.info.url, &hosts);
        state.info.can_back = state.index > 0;
        state.info.can_forward = false;
        (state.info.clone(), runtime.meeting_count())
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
    let hosts = load_hosts(&app);
    if is_meeting_url(&url, &hosts) {
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
pub fn meeting_hosts(app: AppHandle) -> Result<Vec<String>, String> {
    Ok(load_hosts(&app))
}

#[tauri::command]
pub fn set_meeting_hosts(app: AppHandle, hosts: Vec<String>) -> Result<(), String> {
    let hosts = normalize_hosts(hosts);
    let store = app.store(STORE_FILENAME).map_err(|error| error.to_string())?;
    store.set(HOSTS_KEY, serde_json::json!(hosts));
    store.save().map_err(|error| error.to_string())?;

    let (changed, count) = {
        let mut runtime = lock_runtime()?;
        let changed = {
            let mut changed = Vec::new();
            for state in runtime.sessions.values_mut() {
                let is_meeting = is_meeting_url(&state.info.url, &hosts);
                if state.info.is_meeting != is_meeting {
                    state.info.is_meeting = is_meeting;
                    changed.push(state.info.clone());
                }
            }
            changed
        };
        (changed, runtime.meeting_count())
    };
    for info in changed {
        emit_session(&app, &info);
    }
    sync_meeting_suppression(count);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn meeting_matching_is_https_exact_host_or_subdomain() {
        let hosts = vec!["telemost.yandex.ru".to_string()];
        assert!(is_meeting_url("https://telemost.yandex.ru/rooms/1", &hosts));
        assert!(is_meeting_url("https://sub.telemost.yandex.ru/x", &hosts));
        assert!(is_meeting_url("https://TELEMOST.YANDEX.RU/", &hosts));
        assert!(!is_meeting_url("http://telemost.yandex.ru/rooms/1", &hosts));
        assert!(!is_meeting_url("https://nottelemost.yandex.ru/x", &hosts));
        assert!(!is_meeting_url("https://yandex.ru/x", &hosts));
    }

    #[test]
    fn host_normalization_accepts_urls_and_dedupes() {
        let hosts = normalize_hosts(vec![
            " Telemost.Yandex.RU ".to_string(),
            "https://stream.wb.ru/path".to_string(),
            "telemost.yandex.ru".to_string(),
            "   ".to_string(),
        ]);
        assert_eq!(hosts, vec!["telemost.yandex.ru", "stream.wb.ru"]);
    }
}
