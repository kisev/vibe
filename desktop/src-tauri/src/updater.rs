//! Stable, beta, and dev update channels. See `docs/UPDATER.md`.
//!
//! The app reads `updater/<channel>.json` from the website rather than GitHub's latest release.
//! Each file is the `latest.json` a release build produced. The plugin's own `check()` can only use
//! the endpoint in `tauri.conf.json`, so picking the channel at runtime happens here.

use serde::{Deserialize, Serialize};
use std::time::Duration;
use tauri::{AppHandle, Emitter, State};
use tauri_plugin_updater::{Update, UpdaterExt};
use tokio::sync::Mutex;

const CHANNELS_URL: &str = "https://kisev.github.io/vibe/updater";

const PROGRESS_EVENT: &str = "updater-progress";

/// How long to wait when asking whether a channel file exists.
const PROBE_TIMEOUT: Duration = Duration::from_secs(15);

/// One manifest per line: release (`vX.Y.Z`), beta (`vX.Y.Z-rc.<n>`), dev (`dev.<n>`).
#[derive(Debug, Clone, Copy, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Channel {
    Stable,
    Beta,
    Dev,
}

impl Channel {
    fn url(self) -> String {
        let name = match self {
            Channel::Stable => "stable",
            Channel::Beta => "beta",
            Channel::Dev => "dev",
        };
        format!("{CHANNELS_URL}/{name}.json")
    }
}

/// The update `update_check` found, held until the user installs it.
#[derive(Default)]
pub struct PendingUpdate(Mutex<Option<(Update, Option<Vec<u8>>)>>);

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AvailableUpdate {
    version: String,
    current_version: String,
    body: Option<String>,
}

/// Whole percent downloaded. Sent only when it changes: one event per chunk floods the webview
/// and the bar lurches instead of moving.
#[derive(Clone, Serialize)]
struct Progress {
    percent: u64,
}

/// Only 404/410 mean the channel file was never published; every other failure is a real error.
fn absent_status(status: Option<reqwest::StatusCode>) -> bool {
    matches!(status, Some(status) if status == reqwest::StatusCode::NOT_FOUND || status == reqwest::StatusCode::GONE)
}

/// Ask the channel URL directly, because the updater plugin reports every non-2xx as the same
/// `ReleaseNotFound` error. A missing manifest means "nothing on this line", not a failed check.
async fn channel_absent(url: &str) -> bool {
    let status = reqwest::Client::new()
        .get(url)
        .timeout(PROBE_TIMEOUT)
        .send()
        .await
        .map(|response| response.status())
        .ok();
    absent_status(status)
}

#[tauri::command]
pub async fn update_check(
    app: AppHandle,
    pending: State<'_, PendingUpdate>,
    channel: Channel,
) -> Result<Option<AvailableUpdate>, String> {
    let url = channel.url().parse().map_err(|e| format!("{e:?}"))?;
    let found = app
        .updater_builder()
        .endpoints(vec![url.clone()])
        .map_err(|e| e.to_string())?
        .build()
        .map_err(|e| e.to_string())?
        .check()
        .await;

    let found = match found {
        Ok(found) => found,
        Err(err @ tauri_plugin_updater::Error::ReleaseNotFound) => {
            if channel_absent(url.as_str()).await {
                None
            } else {
                return Err(err.to_string());
            }
        }
        Err(err) => return Err(err.to_string()),
    };

    let mut guard = pending.0.lock().await;
    *guard = None;
    let Some(update) = found else {
        return Ok(None);
    };
    let available = AvailableUpdate {
        version: update.version.clone(),
        current_version: update.current_version.clone(),
        body: update.body.clone(),
    };
    *guard = Some((update, None));
    Ok(Some(available))
}

/// Downloads the pending update, reporting the percent done as `updater-progress`.
#[tauri::command]
pub async fn update_download(app: AppHandle, pending: State<'_, PendingUpdate>) -> Result<(), String> {
    let update = match pending.0.lock().await.as_ref() {
        Some((update, _)) => update.clone(),
        None => return Err("no update to download".into()),
    };
    let mut downloaded = 0u64;
    let mut last_percent = None;
    let bytes = update
        .download(
            |chunk, total| {
                downloaded += chunk as u64;
                let Some(total) = total.filter(|total| *total > 0) else {
                    return;
                };
                let percent = (downloaded * 100 / total).min(100);
                if last_percent != Some(percent) {
                    last_percent = Some(percent);
                    let _ = app.emit(PROGRESS_EVENT, Progress { percent });
                }
            },
            || {},
        )
        .await
        .map_err(|e| e.to_string())?;
    if let Some((_, slot)) = pending.0.lock().await.as_mut() {
        *slot = Some(bytes);
    }
    Ok(())
}

/// Installs what `update_download` fetched. Split from it so the caller can stop the server in
/// between: Windows cannot replace a running `vibe-server.exe`.
#[tauri::command]
pub async fn update_install(pending: State<'_, PendingUpdate>) -> Result<(), String> {
    let Some((update, Some(bytes))) = pending.0.lock().await.take() else {
        return Err("no downloaded update to install".into());
    };
    update.install(bytes).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::{absent_status, Channel, CHANNELS_URL};

    fn from_json(name: &str) -> Channel {
        serde_json::from_value(serde_json::Value::String(name.into())).unwrap()
    }

    #[test]
    fn every_channel_reads_its_own_manifest() {
        assert_eq!(from_json("stable").url(), format!("{CHANNELS_URL}/stable.json"));
        assert_eq!(from_json("beta").url(), format!("{CHANNELS_URL}/beta.json"));
        assert_eq!(from_json("dev").url(), format!("{CHANNELS_URL}/dev.json"));
    }

    #[test]
    fn an_unknown_channel_does_not_deserialize() {
        assert!(serde_json::from_value::<Channel>(serde_json::Value::String("nightly".into())).is_err());
    }

    #[test]
    fn only_a_missing_manifest_counts_as_an_empty_line() {
        use reqwest::StatusCode;

        assert!(absent_status(Some(StatusCode::NOT_FOUND)));
        assert!(absent_status(Some(StatusCode::GONE)));
        assert!(!absent_status(Some(StatusCode::INTERNAL_SERVER_ERROR)));
        assert!(!absent_status(Some(StatusCode::OK)));
        assert!(!absent_status(None));
    }
}
