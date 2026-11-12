# Proposal

## Why

Three defects reached GitHub on the same day that a local check would have caught in seconds. `cargo clippy` on the desktop workspace had no task behind it, so three warnings (`map_or`, a needless borrow, a dead stub) failed the CI `clippy` job only after the PR was open. `website/index.html` was committed unformatted because no pre-commit hook covers `html`/`css` — the only check was `task format:check` inside CI, so the whole Lint run went red. The browser E2E web server started where the runner could not reach it, which no local run showed.

The cause is structural, not careless: `docs/how-to/check-your-change.md` tells a contributor to run `task lint` and `task test`, but CI runs more than that (`format:check`, `cargo fmt --all`, desktop `cargo clippy`, server `deny`/`machete`, the E2E suite). There is no single command whose green result means "CI will be green", and the pre-push hook runs only the unit suites. Every mismatch is discovered at the most expensive point: after a push that starts several runs, or after a tag that starts five platform builds.

## What Changes

- `task verify` becomes the local mirror of the CI gate set: `task lint`, `task format:check`, `cargo fmt --all -- --check`, `task rust:clippy` (new: the desktop/cli workspace, mirroring `lint_rust.yml`), `task server:clippy`, `task server:deny server:machete`, the unit suites and `task ci:e2e`.
- The pre-push hook runs `task verify` instead of `task test`, so a push that would go red is refused locally.
- A pre-commit `prettier` hook checks staged `css` and `html`, closing the gap that let an unformatted `index.html` through.
- `docs/how-to/check-your-change.md` and `AGENTS.md` state the rule: nothing is pushed, and no `dev.<n>` or release tag is created, before `task verify` is green on that revision. The `workflow_dispatch` path for `lint.yml` stays as the remote backstop, not as the first check.

## Capabilities

- `dev-tooling` (existing): the local gate set and the hook that enforces it.

## Impact

- `taskfile.yml` (`verify`, `rust:clippy`), `lefthook.yml` (pre-push, prettier), `docs/how-to/check-your-change.md`, `AGENTS.md`.
- No application code and no workflow definition change; CI keeps invoking the same tasks.
- Cost: a cold `task verify` compiles the desktop workspace once (the expensive part is the same clippy CI runs); warm runs are dominated by the E2E suite.
