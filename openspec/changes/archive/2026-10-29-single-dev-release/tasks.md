# Tasks

## 1. Workflow

- [x] 1.1 Add a `cleanup` job to `dev-build.yml`: `needs: build`, `if: success()`, `permissions: contents: write`; list prereleases whose tag matches `dev.*`, delete every one except the current run's tag by release id via `gh api -X DELETE` (never the tag itself), one log line per deletion
- [x] 1.2 Guard rails in the job: stable (`v*`) releases are never selected (tag pattern + prerelease flag), the current tag is never deleted, and a missing releases list is a no-op, not an error

## 2. One-time cleanup

- [x] 2.1 Delete every existing `dev.*` release except `dev.43` — the same command the job runs — and verify the nine current entries collapse to one with all `dev.*` tags still present

## 3. Validation

- [x] 3.1 Cut the next dev tag: the run publishes, cleanup fires, and exactly one dev release remains while the tag list still counts every previous `dev.*` tag (dev.44 exposed a jq typo — fixed, and dev.45 proved it live: `deleted dev release 424770562 (tag kept)`, one dev release remains, 12 dev.\* tags on remote, 9 assets)
- [x] 3.2 Confirm the janitor composition: a failed-then-healed run ends with the cleanup job green (the skipped `if: success()` job re-runs as part of the `--failed` rerun) (proven twice: dev.47 — Vulkan SDK flake failed the run, `gh run rerun --failed` re-ran the cleanup job green with only dev.47's release remaining and every `dev.*` tag kept; dev.49 — a separate failed run (dev.48, macOS runner-queue flake) was skipped by cleanup, and dev.49's own cleanup deleted dev.48's release on the next green run)
