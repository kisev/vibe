//! Stable, beta, and dev update channels. See `docs/reference/update-channels.md`.
//!
//! The app reads `updater/<channel>.json` from the website rather than GitHub's latest release.
//! Each file is the `latest.json` a release build produced. The plugin's own `check()` can only use
//! the endpoint in `tauri.conf.json`, so picking the channel at runtime happens here.

use crate::error::CommandResult;
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

/// A locally built app (`1.0.0-local.<date>.<sha>`) is not on any channel: offering it a
/// release or dev build would move the tester off the revision they are checking.
fn is_local_build(version: &str) -> bool {
    version.contains("-local")
}

#[tauri::command]
pub async fn update_check(
    app: AppHandle,
    pending: State<'_, PendingUpdate>,
    channel: Channel,
) -> CommandResult<Option<AvailableUpdate>> {
    if is_local_build(&app.package_info().version.to_string()) {
        return Ok(None);
    }
    let url = tauri::Url::parse(&channel.url())?;
    let found = app.updater_builder().endpoints(vec![url.clone()])?.build()?.check().await;

    let found = match found {
        Ok(found) => found,
        Err(err @ tauri_plugin_updater::Error::ReleaseNotFound) => {
            if channel_absent(url.as_str()).await {
                None
            } else {
                return Err(err.into());
            }
        }
        Err(err) => return Err(err.into()),
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
pub async fn update_download(app: AppHandle, pending: State<'_, PendingUpdate>) -> CommandResult<()> {
    let update = match pending.0.lock().await.as_ref() {
        Some((update, _)) => update.clone(),
        None => return Err(eyre::eyre!("no update to download").into()),
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
        .await?;
    // A check that ran while the download was in flight clears the slot, and the bytes would be
    // stored where no `update_install` looks: say so instead of silently dropping the download.
    let mut guard = pending.0.lock().await;
    match guard.as_mut() {
        Some((pending_update, slot)) if pending_update.version == update.version => *slot = Some(bytes),
        _ => return Err(eyre::eyre!("the pending update changed during the download").into()),
    }
    Ok(())
}

/// Installs what `update_download` fetched. Split from it so the caller can stop the server in
/// between: Windows cannot replace a running `vibe-server.exe`.
#[tauri::command]
pub async fn update_install(pending: State<'_, PendingUpdate>) -> CommandResult<()> {
    let Some((update, Some(bytes))) = pending.0.lock().await.take() else {
        return Err(eyre::eyre!("no downloaded update to install").into());
    };
    // `install` writes the whole bundle and on Windows runs the installer: it blocks for seconds
    // to minutes and must not hold a tokio worker that also serves commands and UI events.
    let installer = update.clone();
    let (bytes, outcome) = tauri::async_runtime::spawn_blocking(move || {
        let outcome = installer.install(&bytes);
        // Hand the bytes back so a failed attempt can be retried without a full re-download.
        (bytes, outcome)
    })
    .await
    .map_err(|error| eyre::eyre!("the update install task failed: {error}"))?;
    match outcome {
        Ok(()) => Ok(()),
        Err(error) => {
            // A locked file on Windows is transient; keep what was downloaded so "Update now"
            // can be pressed again.
            *pending.0.lock().await = Some((update, Some(bytes)));
            Err(error.into())
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{absent_status, is_local_build, Channel, CHANNELS_URL};

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
    fn a_local_build_never_joins_a_channel() {
        assert!(is_local_build("1.0.0-local.20261113.c5302d1f"));
        assert!(!is_local_build("1.0.0"));
        assert!(!is_local_build("1.0.0-rc.1"));
        assert!(!is_local_build("1.0.0-dev.3"));
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
