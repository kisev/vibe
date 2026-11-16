# Design

## Context

`desktop/src-tauri/src/updater.rs` already fetches `https://kisev.github.io/vibe/updater/<channel>.json` at runtime, with `Channel::{Stable, Beta}` and the channel persisted in `CONFIG_KEYS.updateChannel`; General renders it as a "Beta updates" switch nobody explained. The website publishes `website/public/updater/stable.json` and `beta.json` from release `latest.json` files through `scripts/channel.py`, and `docs/UPDATER.md` describes the promotion flow. Dev builds deliberately publish no updater artifacts (`createUpdaterArtifacts: false`, `includeUpdaterJson: false`, updater endpoints empty), so the dev line cannot self-update. `release.yml` is `workflow_dispatch`-only and reads the version from `tauri.conf.json`, with no way to cut a release candidate. See `proposal.md` and `specs/app-updates/spec.md`.

## Goals / Non-Goals

**Goals:**

- Three real, self-updating lines — Release, Beta, Dev — each with one tag rule and one manifest, sharing the existing minisign key.
- One visible place to check, choose, and see what the updater is doing.
- No version ordering surprises when a user moves between channels.

**Non-Goals:**

- Downgrades (the updater moves forward only).
- Nightly/per-commit builds; dev builds stay tag-driven.
- Per-platform channel overrides.
- A fourth channel or a free-form version picker in the UI.

## Decisions

- **Three channels, three tags, three manifests.** `Channel::{Stable, Beta, Dev}` map to `updater/{stable,beta,dev}.json`. The user-facing selector offers all three. Tag rules: Release `vX.Y.Z` on `main`; Beta `vX.Y.Z-rc.<n>` on `main`, a GitHub prerelease; Dev `dev.<n>` on `dev`. The rules already exist for the release line and the dev line (guarded by `dev-build.yml`); the beta rule is new and is enforced by the release workflow itself.

- **`-rc.<n>`, not the upstream `-beta.<n>`.** Semver orders prerelease identifiers after the release, and inside a prerelease compares identifiers left to right: `-dev` < `-rc`, while a numeric order follows. `1.0.0-dev.70 < 1.0.0-rc.1 < 1.0.0`, which makes every channel switch a forward move with the plugin's strict comparator and no overrides. Upstream used `-beta.0` but had no dev channel; `1.0.0-beta.1` would sort *above* `1.0.0-dev.70`, so a dev install switching to Beta would never see the older-sorting rc. The beta channel keeps its name; only the suffix is `-rc.<n>`.

- **`release.yml` learns a version override and a prerelease flag.** Today the version lives in `tauri.conf.json` and the workflow lets tauri-action create the tag. For a release candidate the version must be `X.Y.Z-rc.N` in the built artifacts and the tag `vX.Y.Z-rc.N`; the workflow gains a `version` input (default: the config version) that rewrites `tauri.conf.json` before the build and names the tag, and sets `prerelease: true` with `make_latest: 'false'` when the version carries `-rc.`. The changelog requirement (`i18n/changelog/<version>.md`) applies to rc versions too, so candidate notes are written before the build, not after. Release stays a `main`-only workflow; a `guard`-style check refuses a run whose ref is not `main`.

- **The beta manifest points at the rc, and stable promotes it.** `scripts/channel.py --channel beta` already exists; the comparison key becomes a real semver comparator (prerelease parsed, `rc.N` compared numerically) so `1.1.0-rc.2` is newer than `1.1.0-rc.1` and `1.1.0` is newer than both. Publishing stable keeps the existing promotion: beta moves to the stable version, so beta is never behind release.

- **The dev manifest is generated at website build time.** The Deploy Website workflow reads the newest complete dev prerelease (all five platform artifacts plus signed `latest.json` present) through the GitHub API with the workflow token and writes `updater/dev.json` from that release's `latest.json`. Dev-build finishes by dispatching a website deploy. Alternatives considered: committing `dev.json` from the dev workflow (bot commits to `main`, races with Lint and the release line — rejected) and resolving the newest tag from the app at runtime (GitHub API rate limits and extra trust surface — rejected). If the API call fails or the release is partial, the build keeps the previously published `dev.json` rather than publishing an empty or half manifest.

- **Dev builds turn updater artifacts on.** `dev-build.yml` stops overriding `createUpdaterArtifacts` to false and lets tauri-action sign the updater bundles and publish `latest.json` on the dev release, using the same `TAURI_SIGNING_PRIVATE_KEY` secrets as `release.yml`. The app's bundled pubkey is unchanged, so a dev build verifies dev artifacts with the same key.

- **Semver is the channel boundary, and the UI says so.** A release install that selects Dev sees "up to date" plus the explanation that the dev line sits below it, so moving to Dev takes one manual install; after that the Dev channel moves forward. A beta install switching to Release is offered the stable release once it exists, which sorts forward. The settings group states the installed build's line and what the selected channel can offer.

- **One updater state machine in the provider.** `checkNow()` reuses `update_check`; the provider exposes `lastCheckedAt`, a `checkState` (`idle|checking|current|available|downloading|installing|error`) and the failure message. The settings group renders from that state and never calls the plugin directly. The explicit check is additive: the existing automatic check on startup and channel switch remains, and a manual check updates the same state.

- **Channel choice persistence and immediate effect.** The existing `updateChannel` key is extended with the `dev` value (and keeps `beta`); `setChannel` triggers `checkNow()` like the old switch did. A stored value the selector cannot represent falls back to the installed build's line rather than silently selecting another channel.

- **Where it lives.** A dedicated "Updates" group in General (current version, channel selector, button, last check, state, notes), rather than a new settings section: General is where the beta switch lives today and where users look for app-level controls. The same state is mirrored in the About surface if one exists.

## Risks / Trade-offs

- [Dev builds published without updater artifacts look updatable but are not] → The workflow change lands before the dev channel is exposed in the UI; the dev manifest is generated only from releases that contain `latest.json`.
- [Website build fetches a partial release] → Completeness check for all platform assets; on failure keep the previous manifest.
- [GitHub API rate limiting on Pages builds] → Authenticated request with the workflow token; fallback keeps the last good manifest.
- [Users expect Dev to be "newer" than stable] → The UI explains the semver boundary and links to the manual dev download; the channel selector shows the installed build's line.
- [An rc is indistinguishable from a stable in the version string] → The suffix is mandatory for beta tags and asserted by the release workflow's guard; a tag without `-rc.` on the beta path is refused.
- [Beta and stable promotion drift] → `scripts/channel.py` moves beta to stable on every stable publish and refuses to move any channel backwards.
- [Storage growth from dev artifacts] → The existing one-dev-release cleanup remains; each dev release carries updater artifacts like a stable release.

## Migration Plan

1. Ship the Rust channel support and the UI first (Dev and Beta checks work against existing manifests, dev reports "up to date").
1. Enable signed updater artifacts and `latest.json` in dev-build; publish the first dev release with them.
1. Enable dev.json generation in the website build; dispatch it from dev-build.
1. Extend `release.yml` with the version override and prerelease flag; cut the first `vX.Y.Z-rc.1` and point `beta.json` at it.
1. Verify a dev install updates through the Dev channel, a beta install through Beta, and a release install is offered neither.
1. Rollback: hide the Dev/Beta options and stop generating their manifests; installed builds keep working and can switch to Release.

## Open Questions

- Whether the About surface exists in this fork's UI or the update controls live only in General.
- Whether to expose a direct "install a dev build now" link for release users who select Dev, or only explanatory text.
