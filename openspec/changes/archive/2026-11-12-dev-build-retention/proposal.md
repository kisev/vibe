# Proposal

## Why

The `dev-build` spec still states the old sweep: exactly one dev prerelease survives, every other `dev.*` release is deleted on each run. The implementation changed to bounded retention after that policy deleted a release a newer build still depended on — the newest five dev releases and anything from the last 24 hours stay, and only releases created before the running build started are considered. The spec describes behaviour the repository no longer has, and the stale requirement is long enough that `openspec validate --all --strict` fails on it.

## What Changes

- The `dev-build` requirement "One dev release at a time" is replaced by "Dev releases are pruned with bounded retention": what the sweep keeps, what it deletes, and the fact that tags outlive releases.
- `docs/how-to/cut-a-dev-build.md` and the workflow comment already describe bounded retention; no workflow or script change is needed.

## Capabilities

- `dev-build` (existing): the dev release sweep.

## Impact

- `openspec/specs/dev-build/spec.md` via a MODIFIED requirement delta.
- No code, workflow or documentation change — the spec catches up with the tree.
