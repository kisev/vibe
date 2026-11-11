# Proposal

## Why

Updates are checked in the background and the only control is an unexplained "Beta updates" switch buried in General: no explicit "check now", no dev channel at all (dev builds ship without updater artifacts), and no stated rule for what each channel means. The fork now has three real lines — nightly dev builds, release candidates, and stable releases — and each needs an explicit tag rule, a signed feed, and a visible control.

## What Changes

- Three user-facing channels, each with one unambiguous source:
  - **Dev** — `dev.<n>` tags on the `dev` branch, version `<tauri.conf version>-dev.<n>.<sha>`; no stability guarantees.
  - **Beta** — `vX.Y.Z-rc.<n>` tags on `main`, version `X.Y.Z-rc.<n>`; a release candidate of the next stable, published as a GitHub prerelease.
  - **Release** — `vX.Y.Z` tags on `main`, version `X.Y.Z`; the stable line.
  - The rc spelling is deliberate: semver orders `-dev.N` below `-rc.N` below the stable version, so switching from Dev to Beta to Release always moves forward. Upstream historically used `-beta.0` (`v2.4.0-beta.0`, `v2.5.0-beta.0`, `v2.5.1-beta.0`), but it had no dev channel; `-beta.N` would sort *above* `-dev.N` in semver and break the channel switches.
- Settings gets an explicit update control: current version, channel selector (Release / Beta / Dev), a "Check for updates" action, the last check time, and the full state (checking, up to date, update available with version and notes, downloading with progress, installing, error).
- Dev builds start producing updater artifacts signed with the fork's key and publish `updater/dev.json`; dev installs update themselves to the next dev build.
- Beta builds are cut from `main` as `vX.Y.Z-rc.<n>` tags, publish signed artifacts as a prerelease, and feed `updater/beta.json`. Beta is never behind Release: publishing `X.Y.Z` moves beta to it. Beta installs therefore receive newer rc builds and the final stable release in order.
- Release builds keep `updater/stable.json`; stable installs are never offered an rc or a dev build, because both sort below the stable version they already run.
- The internal beta feed stops being a hidden switch; the old `-beta.N` tag spelling is not reused.

## Capabilities

### New Capabilities

- `app-updates`: manual update checks and their visible state, the three user-facing channels and their tag/version rules, signed artifacts for every channel, promotion rules, and the semver boundary that keeps channels from surprising users.

### Modified Capabilities

## Impact

- `desktop/src-tauri/src/updater.rs` (channel enum and manifest URLs), `desktop/src/providers/updater.tsx`, the settings UI, config keys, i18n.
- `.github/workflows/release.yml` (tag-driven versions, prerelease flag, updater artifacts for rc), `.github/workflows/dev-build.yml` (updater artifacts already in scope), the website build that generates `updater/dev.json`, and `scripts/channel.py` (semver-aware, rc support, promotion).
- `docs/UPDATER.md` and the release skill/process documentation.
