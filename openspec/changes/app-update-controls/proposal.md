# Proposal

## Why

Updates are checked in the background and the only control is a "Beta updates" switch buried in General; there is no explicit "check now" action, and dev builds are built with updater artifacts disabled, so the dev line cannot update itself at all. The user wants a visible update action and a deliberate choice between the release and dev channels.

## What Changes

- Settings gets an explicit update control: current version, a "Check for updates" action, the last check time, and the full state (checking, up to date, update available with its version and notes, downloading with progress, installing, error).
- The channel choice becomes a visible selector with **Release** and **Dev** values, persisted across restarts; switching channels triggers a check immediately and states which feed is active.
- Dev builds start producing updater artifacts signed with the fork's key and publish a `dev.json` channel manifest; a dev install on the Dev channel updates itself to the next dev build.
- The semver boundary is made explicit in the UI: a 1.0.0 release install on the Dev channel is never offered `1.0.0-dev.N` builds, because those sort below the installed version; moving to the dev line needs one manual install, after which the dev channel moves forward on its own. Switching a dev install back to Release offers the next stable release normally.
- The "Beta updates" switch is inherited from upstream: it selects `updater/beta.json`, a staging channel releases are promoted through before stable (`docs/UPDATER.md`). It was never explained in the UI and is easy to mistake for a third public channel. It stays as a release-staging feed but leaves the user-facing selector, which exposes Release and Dev only.

## Capabilities

### New Capabilities

- `app-updates`: manual update checks and their visible state, user-facing channel selection, the dev channel's signed artifacts and manifest, and the semver rules that keep channels from surprising users.

### Modified Capabilities

## Impact

- `desktop/src-tauri/src/updater.rs` (channel enum and manifest URLs), `desktop/src/providers/updater.tsx`, `desktop/src/pages/settings/sections/general.tsx` (or a dedicated updates section), config keys, i18n.
- `.github/workflows/dev-build.yml` (updater artifacts, signing, release manifest), the website build that generates `website/public/updater/dev.json`, and `scripts/channel.py` if it is reused.
- `docs/UPDATER.md` and the release process documentation.
