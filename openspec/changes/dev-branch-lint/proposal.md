# Proposal

## Why

`AGENTS.md` says code that needs a compile or CI check goes to `main` so the Lint run validates it. That rule existed because `lint.yml` had no way to be started for another branch: pushing to `dev` deliberately builds nothing, and the workflow only triggered on `main` pushes and pull requests. So every dev tag carried code that had never been compiled in CI, and the only alternative was a throwaway commit on `main` — which the user has asked us to stop doing.

The workflow is already dispatchable in principle (`lint_rust.yml` is) and every step is ref-agnostic. Wiring `workflow_dispatch` onto `lint.yml` lets the exact dev revision be validated before a tag, which is what the release discipline actually needs.

## What Changes

- `lint.yml` gains `workflow_dispatch`, so a dev revision can be linted in place: `gh workflow run lint.yml --ref dev`.
- The release rule becomes: tag `dev.<n>` only from a green Lint dispatch on that exact commit. A main commit is no longer the way to validate dev work; it stays reserved for changes that must exist on the release line.
- `AGENTS.md` and `docs/how-to/` (release guidance) state the dispatch path instead of "push to main to check".

## Capabilities

### New Capabilities

- `dev-build`: the pre-tag validation of a dev revision — how it is started, and what a tag is allowed to point at.

## Impact

- `.github/workflows/lint.yml` (trigger block), `AGENTS.md`, the release docs and the release skill.
- No change to what `mise exec -- task lint format:check` runs.
