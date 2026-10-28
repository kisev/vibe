# Proposal

## Why

The fork keeps checking the upstream update channel (`thewh1teagle/vibe`), so a fork build can be offered — and replaced by — an upstream release the moment upstream publishes one. All the fork's builds must instead update from, and link back to, the fork.

## What Changes

- The updater endpoint moves to the fork's releases (`kisev/vibe`), and the updater pubkey is replaced with the fork's own signing key, which the fork's release workflow uses to sign updater artifacts.
- Every functional in-app link points at the fork: About/repo, issues, bug report (with logs), changelog / "What's new", the models documentation page, and the phone-pairing page. Upstream donation and Discord links stay pointed upstream on purpose.
- Dev tooling fetches the `vibe-server` sidecar from the fork (`gh://kisev/vibe`), which requires publishing `server-v*` releases in the fork; the first one pins the current `.server-version` (`v0.8.0`).
- The application identifier (`github.com.thewh1teagle.vibe`) and reverse domain deliberately stay unchanged, so existing installs keep their settings, deep links, and OS-level identity.
- A currently installed upstream build keeps checking upstream — a remote install cannot be repointed; repointing takes installing a fork build once.
- The Windows installer identity diverges from upstream: the Add/Remove-Programs entry a fork build writes carries the fork's publisher and product code, so `winget upgrade` cannot correlate a fork installation with the upstream community package (`Thewh1teagle.vibe`) and overwrite it with an upstream build — the reported failure mode, where `winget upgrade` replaced a fork dev build with upstream 3.2.2. Once the fork ships signed stable releases, the fork's own winget package makes `winget upgrade` pull fork releases instead.

## Capabilities

### New Capabilities

- `update-sources`: where the application checks for updates, which key verifies them, where its links and downloads point, and what deliberately keeps pointing upstream.

### Modified Capabilities

## Impact

- `desktop/src-tauri/tauri.conf.json` (updater endpoint + pubkey), `desktop/src/lib/config.ts`, `desktop/src/lib/app.ts`, `desktop/src-tauri/src/diagnostics.rs`, `desktop/src-tauri/src/keepawake.rs`, `desktop/src-tauri/src/handoff/mod.rs`, the handoff mock and URL tests, root `chorefile` server download, and fork repository secrets (updater signing key).
- Fork release workflow behavior: updater artifacts (`latest.json`) must be produced and signed on every release run.
- No server code, no transcription behavior.
