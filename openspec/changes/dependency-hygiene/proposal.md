# Proposal

## Why

Dependencies are updated by hand, if at all, and there is no single place that answers "what is outdated?". Python dependencies are worse: six scripts carry their own PEP 723 `dependencies = [...]` blocks, each pinning versions inline, so nothing locks them together and no audit or updater can see them as one set. The four Cargo workspaces and three pnpm packages have lockfiles, but no scheduled update flow and no grouped major/minor policy.

## What Changes

- Python dependencies move into one uv project at the repository root: a `pyproject.toml` declaring the third-party packages and a committed `uv.lock`. The PEP 723 dependency blocks are removed from every script; `uv run` resolves them from the project.
- `task deps:check` reports what is outdated across all ecosystems: `cargo outdated` for four workspaces, `pnpm outdated` for three packages, and the uv project's outdated list.
- `task deps:update` updates within the declared ranges (Cargo semver, pnpm ranges, `uv lock --upgrade`) and touches only lockfiles unless a manifest has to move.
- `task deps:update:major` is the explicit, opt-in major upgrade path (`cargo upgrade --incompatible`, `pnpm update --latest`); it is never run automatically.
- Renovate opens grouped PRs weekly: one for Rust, one for JavaScript, one for GitHub Actions; majors come as separate PRs. Renovate runs from a thin scheduled workflow with a `RENOVATE_TOKEN` secret; the manager list includes `mise.toml` via a regex manager.
- Updates merge only through the normal gates: Lint must be green; no automerge for majors.

## Capabilities

### New Capabilities

- `dependency-hygiene`: the uv project and lockfile for Python, the check/update tasks, the Renovate configuration and its workflow, and the policy for majors.

### Modified Capabilities

## Impact

- New root `pyproject.toml` and `uv.lock`; six `scripts/*.py` lose their inline dependency blocks; `chorefile`, `website/website.chore`, `taskfile.yml` and the workflows that call `uv run` keep working through the project.
- `renovate.json`, `.github/workflows/dependency-updates.yml`, `mise.toml` (`cargo-outdated`, `cargo-edit`), `AGENTS.md`, and the `RENOVATE_TOKEN` repository secret (a fine-grained token with contents and pull-request write).
- `security-scanning` consumes the uv lockfile for `pip-audit`, so this change lands first.
