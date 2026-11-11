# Design

## Context

`desktop/src-tauri/src/updater.rs` already fetches `https://kisev.github.io/vibe/updater/<channel>.json` at runtime, with `Channel::{Stable, Beta}` and the channel persisted in `CONFIG_KEYS.updateChannel`; General renders it as a "Beta updates" switch. The website publishes `website/public/updater/stable.json` and `beta.json` from release `latest.json` files, and `docs/UPDATER.md` describes the promotion flow. Dev builds deliberately publish no updater artifacts (`createUpdaterArtifacts: false`, `includeUpdaterJson: false`, updater endpoints empty), so the dev line cannot self-update. See `proposal.md` and `specs/app-updates/spec.md`.

## Goals / Non-Goals

**Goals:**

- A second self-updating line that shares the release signing key and never crosses into stable by accident.
- One visible place to check, choose, and see what the updater is doing.
- No new trust root: both feeds verify with the existing minisign key.

**Non-Goals:**

- Downgrades (the updater moves forward only).
- Nightly/per-commit builds; dev builds stay tag-driven.
- Per-platform channel overrides.
- A public beta channel in the UI; beta remains an internal release-staging feed.

## Decisions

- **Add `Dev` to the channel enum; keep beta internal.** `Channel::Dev` maps to `updater/dev.json`. The user-facing selector shows Release (stable) and Dev; the "Beta updates" switch is removed from General, while `beta.json` keeps being published so existing installs that already selected beta keep working. The beta feed stays the release-staging step described in `docs/UPDATER.md`; it is a promotion tool, not a user choice.

- **The dev manifest is generated at website build time.** The Deploy Website workflow reads the newest complete dev prerelease (all five platform artifacts plus signed `latest.json` present) through the GitHub API with the workflow token and writes `updater/dev.json` from that release's `latest.json`. Dev-build finishes by dispatching a website deploy. Alternatives considered: committing `dev.json` from the dev workflow (bot commits to `main`, races with Lint and the release line — rejected) and resolving the newest tag from the app at runtime (GitHub API rate limits and extra trust surface — rejected). If the API call fails or the release is partial, the build keeps the previously published `dev.json` rather than publishing an empty or half manifest.

- **Dev builds turn updater artifacts on.** `dev-build.yml` stops overriding `createUpdaterArtifacts` to false and lets tauri-action sign the updater bundles and publish `latest.json` on the dev release, using the same `TAURI_SIGNING_PRIVATE_KEY` secrets as `release.yml`. The app's bundled pubkey is unchanged, so a dev build verifies dev artifacts with the same key.

- **Semver is the channel boundary, and the UI says so.** Dev versions are pre-releases of the next stable (`1.0.0-dev.N`), which sort below `1.0.0`. A release install that selects Dev therefore sees "up to date" and an explanation that the dev line starts below it: moving to Dev takes one manual install of a dev build, after which the Dev channel moves forward. A dev install that switches to Release is offered the next stable, which is newer — that direction works in-app. No comparator overrides: the plugin's strict version comparison is the rule.

- **One updater state machine in the provider.** `checkNow()` reuses `update_check`; the provider exposes `lastCheckedAt`, a `checkState` (`idle|checking|current|available|downloading|installing|error`) and the failure message. The settings group renders from that state and never calls the plugin directly. The explicit check is additive: the existing automatic check on startup and channel switch remains, and a manual check updates the same state.

- **Channel choice persistence and immediate effect.** The existing `updateChannel` key is extended with the `dev` value; `setChannel` triggers `checkNow()` like the beta switch did. A migration maps any stored `beta` to `beta` internally but the selector presents no beta option, so the stored value is left untouched and only overwritten when the user picks Release or Dev.

- **Where it lives.** A dedicated "Updates" group in General (current version, channel selector, button, last check, state, notes), rather than a new settings section: General is where the beta switch lives today and where users look for app-level controls. The same state is mirrored in the About surface if one exists.

## Risks / Trade-offs

- [Dev builds published without updater artifacts look updatable but are not] → The workflow change lands before the dev channel is exposed in the UI; the dev manifest is generated only from releases that contain `latest.json`.
- [Website build fetches a partial release] → Completeness check for all platform assets; on failure keep the previous manifest.
- [GitHub API rate limiting on Pages builds] → Authenticated request with the workflow token; fallback keeps the last good manifest.
- [Users expect Dev to be "newer" than stable] → The UI explains the semver boundary and links to the manual dev download; the channel selector shows the installed build's line.
- [Beta and stable promotion drift] → The release promotion flow is untouched; dev.json is independent and never promoted to stable automatically.
- [Storage growth from dev artifacts] → The existing one-dev-release cleanup remains; each dev release carries updater artifacts like a stable release.

## Migration Plan

1. Ship the Rust channel support and the UI first (Dev checks work but no dev manifest exists yet → "up to date").
1. Enable signed updater artifacts and `latest.json` in dev-build; publish the first dev release with them.
1. Enable dev.json generation in the website build; dispatch it from dev-build.
1. Verify a dev install updates through the Dev channel; verify a release install is not offered dev builds.
1. Rollback: hide the Dev option and stop generating dev.json; installed dev builds keep working and can switch to Release.

## Open Questions

- Whether the About surface exists in this fork's UI or the update controls live only in General.
- Whether to expose a direct "install a dev build now" link for release users who select Dev, or only explanatory text.
