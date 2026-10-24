# Proposal

## Why

The fork's releases page orders dev releases by version-comparing their tags, and `dev.<short-commit>` tags compare in hash order — effectively random. Newer dev builds routinely appear below older ones, so the page cannot be read top-down as "newest first".

## What Changes

- Dev-build release tags change from `dev.<short-commit>` to `dev.<run-number>`. The GitHub Actions run number grows monotonically, so the releases page always lists the newest run first.
- The release name and body keep carrying the application version with the `-dev.<short-commit>` suffix and the full commit SHA, so a release stays identifiable as a snapshot of an exact revision. Nothing about the build itself changes.
- A re-run of a failed run reuses its own tag, so its matrix jobs still share one release.
- The stale header comment in `dev-build.yml` that still describes a rolling `dev` prerelease is corrected.

## Capabilities

### New Capabilities

### Modified Capabilities

- `dev-build`: the "One release per commit" requirement changes its tag scheme from `dev.<short-commit>` to `dev.<run-number>` and adds ordering and rerun-reuse guarantees; the commit identity moves from the tag to the release name and body.

## Impact

- `.github/workflows/dev-build.yml` — the "Compute the dev version" step (tag derivation), the tauri-action inputs (`tagName`, `releaseName`, `releaseBody`), and the file header comment.
- No application or server code, no bundling, no signing. Installed dev builds and their update behavior are unaffected.
