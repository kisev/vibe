# Tasks

## 1. Workflow

- [x] 1.1 Add a `cleanup` job to `dev-build.yml`: `needs: build`, `if: success()`, `permissions: contents: write`; list prereleases whose tag matches `dev.*`, delete every one except the current run's tag with `gh release delete --yes` (never `--cleanup-tag`), one log line per deletion
- [x] 1.2 Guard rails in the job: stable (`v*`) releases are never selected (tag pattern + prerelease flag), the current tag is never deleted, and a missing releases list is a no-op, not an error

## 2. One-time cleanup

- [x] 2.1 Delete every existing `dev.*` release except `dev.43` — the same command the job runs — and verify the nine current entries collapse to one with all `dev.*` tags still present

## 3. Validation

- [ ] 3.1 Cut the next dev tag (dev.44): the run publishes, cleanup fires, and exactly one dev release remains (`dev.44`) while the tag list still counts every previous `dev.*` tag
- [ ] 3.2 Confirm the janitor composition: a failed-then-healed run ends with the cleanup job green (the skipped `if: success()` job re-runs as part of the `--failed` rerun)
