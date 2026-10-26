# Proposal

## Why

The releases page has accumulated nine dev prereleases, seven of them sharing the tag `dev.41` — deleting a re-pointed tag does not delete its release, so every re-tag of the same number left another full-size release behind, and the per-commit policy keeps every earlier release forever. To a person opening the releases page this is noise with no value: nothing consumes old dev releases (dev builds never self-update, the website changelog reads `i18n/changelog/*.md`, not GitHub), and the history that matters already lives in the incrementing tags.

## What Changes

- Exactly one dev release exists at any time: the newest **complete** one. When a dev build finishes green, a cleanup step deletes every other `dev.*` release, keeping the tags themselves untouched and always incrementing.
- The per-commit safety guarantees stay: a run's assets never land in another commit's release, a re-run reuses its own release, and the dev prerelease never becomes the repository's latest release.
- Stable (`v*`) releases and their assets are never touched.
- The accumulated nine dev releases are cleaned up once, keeping the current `dev.43`.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `dev-build`: "One release per commit" becomes "One dev release at a time" — accumulation is replaced by replace-in-place, tags keep the history.

## Assumptions

- Tag history is the dev-build history; release objects are a download surface for the latest build only.
- An incomplete dev build (some cells failed) does not delete the previous complete release; the invariant restores when a run completes — including via the janitor's rerun, which also re-runs the previously skipped cleanup job.
- With at most one release per tag name, tauri-action's reuse-by-tag is unambiguous, which also removes the duplicate-release hazard that produced the seven `dev.41` entries.
