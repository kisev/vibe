# Design

## Context

The releases page currently holds nine dev prereleases, seven of them on the tag `dev.41`: re-pointing a tag (delete + re-push, today's debugging loop) leaves the old release objects behind, and GitHub happily hosts multiple releases with the same `tag_name` — after which tauri-action's "reuse an existing release for the same tag" can even attach assets to a stale release. The `dev-build` spec's "One release per commit" requirement mandated accumulating one release per built revision forever. Nothing consumes old dev releases: dev builds never self-update (`includeUpdaterJson: false`, spec: "Dev builds never self-update"), and the website changelog renders `i18n/changelog/*.md`, not the GitHub release list.

## Decisions

- **Cleanup is a job of the dev build, not a cron.** A `cleanup` job with `needs: build` and `if: success()` runs only when all five cells have published; it lists `dev.*` prereleases and deletes every one except the current run's tag (`gh release delete --yes`, never `--cleanup-tag`). When a run fails, the previous complete release survives, and the janitor's `--failed` rerun re-runs the skipped cleanup job once the matrix completes — the invariant restores itself without a sweeper watching releases.
- **Tags are the history; releases are a download surface.** Deleting a release never deletes the tag, so `task dev:tag` keeps computing `next` from the full monotonic `dev.*` set exactly as before.
- **The filter is tag-pattern + prerelease, never name matching.** Select releases by `tag_name` matching `^dev\.`, exclude the current tag, and additionally require `prerelease == true` — a stable release that ever carried a `dev.*`-shaped tag is impossible today, but the double guard costs nothing.
- **Invariant beats dedup.** With at most one release per tag, tauri-action's reuse-by-tag becomes unambiguous, which removes the duplicate-release hazard instead of patching it.
- **One-time cleanup uses the same command the workflow will run**, applied by hand at apply time: delete every `dev.*` release except `dev.43`, tags untouched.

## Risks / Trade-offs

- [A permanent link to an old dev release's asset dies] → the tag and its commit remain; anyone needing an old binary can re-tag or build it. Dev builds are disposable by charter ("never self-update").
- [Two dev releases exist transiently during a build] → the new release appears while the previous still stands; the window closes when cleanup runs at the end of the run. A user opening the page mid-build sees the newest at top, same as today.
- [A failed run leaves its partial release plus the old one] → bounded by the janitor (reruns until green or attempt 3); after attempt 3 a human deletes the partial release by hand — the same one command.

## Migration Plan

Add the cleanup job, clean up today's nine releases once (keep `dev.43`), and validate on the next dev tag: exactly one dev release remains, all `dev.*` tags still present, stable releases untouched. No data or config migration beyond deleting release objects.
