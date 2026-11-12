use crate::error::CommandResult;
use crate::error::LogError;
use crate::setup::ServerState;
use eyre::{Context, ContextCompat, Result};
use std::path::PathBuf;
use tauri::{Manager, State};
use tokio::sync::Mutex;

pub fn resolve_server_binary(app_handle: &tauri::AppHandle) -> Result<PathBuf> {
    // Try to find server binary in the app's resource directory (sidecar)
    let resource_dir = app_handle.path().resource_dir().context("get resource dir")?;

    #[cfg(target_os = "windows")]
    let binary_name = "vibe-server.exe";
    #[cfg(not(target_os = "windows"))]
    let binary_name = "vibe-server";

    // Check resource dir (Tauri externalBin places them here)
    let sidecar_path = resource_dir.join(binary_name);
    if sidecar_path.exists() {
        return Ok(sidecar_path);
    }

    // Check in same directory as the executable
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            let path = exe_dir.join(binary_name);
            if path.exists() {
                return Ok(path);
            }
        }
    }

    // Common Linux install paths (deb/rpm/AUR packages)
    #[cfg(target_os = "linux")]
    {
        let linux_paths = [
            PathBuf::from("/usr/lib/vibe").join(binary_name),
            PathBuf::from("/usr/lib/vibe/binaries").join(binary_name),
            PathBuf::from("/opt/vibe").join(binary_name),
            PathBuf::from("/opt/vibe/binaries").join(binary_name),
        ];
        for path in &linux_paths {
            if path.exists() {
                return Ok(path.clone());
            }
        }
    }

    // Fallback: check PATH
    if let Ok(path) = which::which(binary_name) {
        return Ok(path);
    }

    Err(eyre::eyre!("vibe-server binary not found"))
}

pub fn resolve_ffmpeg_path(app_handle: &tauri::AppHandle) -> Option<PathBuf> {
    let resource_dir = app_handle.path().resource_dir().ok()?;

    #[cfg(target_os = "windows")]
    let binary_name = "ffmpeg.exe";
    #[cfg(not(target_os = "windows"))]
    let binary_name = "ffmpeg";

    let sidecar_path = resource_dir.join(binary_name);
    if sidecar_path.exists() {
        return Some(sidecar_path);
    }

    None
}

fn spawn_process(
    app_handle: &tauri::AppHandle,
    unload_timeout_minutes: u32,
    cpu_variant: crate::cmd::config::CpuVariant,
) -> Result<crate::server::ServerProcess> {
    let binary_path = resolve_server_binary(app_handle)?;
    let ffmpeg_path = resolve_ffmpeg_path(app_handle);
    let cache_dir = transcription_cache_dir(app_handle);
    crate::server::ServerProcess::spawn(
        &binary_path,
        ffmpeg_path.as_deref(),
        unload_timeout_minutes,
        cpu_variant,
        cache_dir.as_deref(),
    )
}

#[tauri::command]
pub async fn load_model(
    app_handle: tauri::AppHandle,
    model_path: String,
    gpu_device: Option<i32>,
    unload_timeout_minutes: u32,
    no_gpu: Option<bool>,
) -> CommandResult<String> {
    // Absent means "use the GPU": the setting is opt-in, and older callers do not send it.
    let no_gpu = no_gpu.unwrap_or(false);
    let server_state: State<'_, Mutex<ServerState>> = app_handle.state();
    let mut state_guard = server_state.lock().await;

    let process_is_alive = state_guard
        .process
        .as_mut()
        .is_some_and(crate::server::ServerProcess::is_alive);
    if !process_is_alive {
        if state_guard.process.is_some() {
            tracing::warn!("cached server process is no longer running; restarting it");
        }
        state_guard.process = None;
    }

    let cpu_variant = crate::cmd::config::cpu_variant(&app_handle);
    if state_guard
        .process
        .as_ref()
        .is_some_and(|process| process.unload_timeout_minutes() != unload_timeout_minutes || process.cpu_variant() != cpu_variant)
    {
        tracing::debug!(unload_timeout_minutes, ?cpu_variant, "restarting server to apply settings");
        // Dropping ServerProcess kills and waits for its child process via its Drop implementation.
        state_guard.process = None;
    }

    let spawn_server =
        |cpu_variant: crate::cmd::config::CpuVariant| spawn_process(&app_handle, unload_timeout_minutes, cpu_variant);

    // Spawn server if not running
    if state_guard.process.is_none() {
        match spawn_server(cpu_variant) {
            Ok(process) => state_guard.process = Some(process),
            Err(e) => {
                let error_msg = format!("{:#}", e);
                crate::analytics::track_event_handle_with_props(
                    &app_handle,
                    crate::analytics::events::SERVER_SPAWN_FAILED,
                    Some(serde_json::json!({"error_message": error_msg})),
                );
                return Err(e.into());
            }
        }
    }

    // Load model via HTTP
    let mut load_result = {
        let server = state_guard.process.as_mut().unwrap();
        server.load_model(&model_path, gpu_device, no_gpu).await
    };

    // A CPU that advertises AVX2 it cannot execute kills the engine on the first AVX2
    // instruction, while the model loads. Once is enough to know: relaunch on the baseline
    // build, and keep that choice so the next launch does not die again first (#1499).
    if load_result.is_err()
        && cpu_variant == crate::cmd::config::CpuVariant::Auto
        && state_guard
            .process
            .as_mut()
            .is_some_and(crate::server::ServerProcess::died_with_illegal_instruction)
    {
        tracing::warn!("server died with an illegal instruction while loading the model; retrying on the baseline CPU build");
        crate::analytics::track_event_handle_with_props(
            &app_handle,
            crate::analytics::events::SERVER_CPU_BASELINE_FALLBACK,
            None,
        );
        state_guard.process = None;
        let process = spawn_server(crate::cmd::config::CpuVariant::Baseline)
            .context("failed to respawn server on the baseline CPU build")?;
        state_guard.process = Some(process);
        load_result = state_guard
            .process
            .as_mut()
            .unwrap()
            .load_model(&model_path, gpu_device, no_gpu)
            .await;
        if load_result.is_ok() {
            crate::cmd::config::set_cpu_variant(&app_handle, crate::cmd::config::CpuVariant::Baseline).log_error();
        }
    }

    // Asking for the CPU is a choice rather than a failure, so there is nothing to fall back to.
    let gpu_fallback = match load_result {
        Ok(()) => false,
        Err(e) if no_gpu => return Err(e.into()),
        Err(e) => {
            tracing::warn!("model load failed with GPU enabled, falling back to CPU: {:#}", e);

            // Kill existing process and respawn, then reload with no_gpu
            if let Some(mut old) = state_guard.process.take() {
                old.kill();
            }
            let process = spawn_server(crate::cmd::config::cpu_variant(&app_handle)).context("failed to respawn server")?;
            state_guard.process = Some(process);

            let server = state_guard.process.as_mut().unwrap();
            server.load_model(&model_path, gpu_device, true).await?;
            true
        }
    };
    if gpu_fallback {
        Ok("gpu_fallback".to_string())
    } else {
        Ok(model_path)
    }
}

#[tauri::command]
pub async fn get_gpu_devices(app_handle: tauri::AppHandle) -> CommandResult<Vec<crate::server::GpuDevice>> {
    let binary_path = resolve_server_binary(&app_handle)?;
    let devices = crate::server::list_gpu_devices(&binary_path)?;
    Ok(devices)
}

/// The cache lives beside the app's other local data so it is removed with the
/// app and never mixes with user files.
pub(crate) fn transcription_cache_dir(app_handle: &tauri::AppHandle) -> Option<std::path::PathBuf> {
    use tauri::Manager as _;
    Some(cache_dir_under(app_handle.path().app_local_data_dir().ok()?))
}

/// Where the cache sits inside the app's local data directory.
fn cache_dir_under(root: std::path::PathBuf) -> std::path::PathBuf {
    root.join("transcribe-cache")
}

#[tauri::command]
pub async fn get_model_metadata(app_handle: tauri::AppHandle, model_path: String) -> CommandResult<crate::server::ModelMetadata> {
    let server_state: State<'_, Mutex<ServerState>> = app_handle.state();
    let mut state = server_state.lock().await;
    // A server that is already up (the API was asked for, or a transcription is running) serves
    // the read and keeps running.
    if state.process.as_mut().is_some_and(|process| process.is_alive()) {
        return Ok(state.process.as_ref().unwrap().model_metadata(&model_path).await?);
    }
    state.process = None;
    // Otherwise read through a short-lived process. The model is read whenever the app starts, and
    // leaving the shared server up for that would make the API run behind the user's back.
    let mut probe = spawn_process(
        &app_handle,
        crate::cmd::config::unload_timeout_minutes(&app_handle),
        crate::cmd::config::cpu_variant(&app_handle),
    )?;
    let metadata = probe.model_metadata(&model_path).await;
    probe.kill();
    Ok(metadata?)
}

#[tauri::command]
pub async fn get_api_base_url(server_state: State<'_, Mutex<ServerState>>) -> CommandResult<Option<String>> {
    let mut state = server_state.lock().await;
    // A cached process that has died must not keep advertising a port that no longer answers.
    if !state.process.as_mut().is_some_and(|process| process.is_alive()) {
        return Ok(None);
    }
    Ok(state.process.as_ref().map(|process| process.base_url()))
}

/// Whether the user wants the local API server running. This is the intent the Settings
/// switch reads; [`get_api_base_url`] only reports whether a shared process is alive.
#[tauri::command]
pub fn api_server_enabled(app_handle: tauri::AppHandle) -> bool {
    crate::cmd::config::api_server_enabled(&app_handle)
}

/// Bring the shared server up with the current settings and publish its URL.
///
/// This never records the user's intent: startup calls it when the intent is already on, and a
/// model load for transcription has its own spawn path. Only the commands below change the intent.
pub fn start_process(app_handle: &tauri::AppHandle, state: &mut ServerState, unload_timeout_minutes: u32) -> Result<String> {
    let cpu_variant = crate::cmd::config::cpu_variant(app_handle);
    let process_is_alive = state.process.as_mut().is_some_and(|process| process.is_alive());
    if !process_is_alive {
        state.process = None;
    }
    if state
        .process
        .as_ref()
        .is_some_and(|process| process.unload_timeout_minutes() != unload_timeout_minutes || process.cpu_variant() != cpu_variant)
    {
        tracing::debug!(unload_timeout_minutes, ?cpu_variant, "restarting server to apply settings");
        // Dropping ServerProcess kills and waits for its child process via its Drop implementation.
        state.process = None;
    }
    if state.process.is_none() {
        state.process = Some(spawn_process(app_handle, unload_timeout_minutes, cpu_variant)?);
    }
    let base_url = state.process.as_ref().context("API server process missing")?.base_url();
    // Best-effort: an agent losing the hint is not a reason to fail starting the server.
    crate::cmd::config::set_api_base_url(app_handle, Some(&base_url)).log_error();
    Ok(base_url)
}

/// Stop the shared process and clear the published URL, leaving the user's intent alone.
pub fn stop_process(app_handle: &tauri::AppHandle, state: &mut ServerState) -> bool {
    // The port dies with the process, so the hint in the config file has to go with it.
    crate::cmd::config::set_api_base_url(app_handle, None).log_error();
    if let Some(mut process) = state.process.take() {
        process.kill();
        true
    } else {
        false
    }
}

#[tauri::command]
pub async fn start_api_server(
    app_handle: tauri::AppHandle,
    server_state: State<'_, Mutex<ServerState>>,
    unload_timeout_minutes: u32,
) -> CommandResult<String> {
    let mut state_guard = server_state.lock().await;
    let base_url = start_process(&app_handle, &mut state_guard, unload_timeout_minutes)?;
    // Record the intent only once the server is up, so a failed start leaves the switch off
    // rather than promising a server that is not there.
    crate::cmd::config::set_api_server_enabled(&app_handle, true).log_error();
    Ok(base_url)
}

#[tauri::command]
pub async fn stop_api_server(app_handle: tauri::AppHandle, server_state: State<'_, Mutex<ServerState>>) -> CommandResult<bool> {
    let mut state_guard = server_state.lock().await;
    crate::cmd::config::set_api_server_enabled(&app_handle, false).log_error();
    Ok(stop_process(&app_handle, &mut state_guard))
}

/// Release the server binary for an update install without recording it as the user turning the
/// API off: the intent stays on, so the server comes back after the relaunch.
#[tauri::command]
pub async fn stop_api_server_process(
    app_handle: tauri::AppHandle,
    server_state: State<'_, Mutex<ServerState>>,
) -> CommandResult<bool> {
    let mut state_guard = server_state.lock().await;
    Ok(stop_process(&app_handle, &mut state_guard))
}

#[cfg(test)]
mod tests {
    use super::cache_dir_under;

    #[test]
    fn the_cache_sits_under_the_app_local_data_directory() {
        let dir = cache_dir_under(std::path::PathBuf::from("/data/app"));
        assert_eq!(dir, std::path::Path::new("/data/app/transcribe-cache"));
    }
}
