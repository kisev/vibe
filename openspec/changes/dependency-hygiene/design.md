# Design

## Context

Six scripts pin their own dependencies in PEP 723 blocks: `scripts/website_links.py`, `scripts/export_analytics.py`, `scripts/export_kofi_supports.py`, `scripts/sign.py`, `scripts/channel.py`, `handoff/pwa/serve.py`. There is no `pyproject.toml` or `uv.lock` anywhere. Cargo has four workspaces with lockfiles (root, `server`, `handoff/wasm`, `handoff/probe`); pnpm has three packages (`desktop`, `website`, `handoff/pwa`). No `cargo-outdated`, no `cargo-edit`, no Renovate/Dependabot configuration.

## Goals / Non-Goals

**Goals:**

- One lockfile for Python, visible to audits and updaters.
- A local answer to "what is outdated?" and a safe way to update.
- Automated, grouped, review-gated dependency PRs.

**Non-Goals:**

- Automatic merges of major upgrades.
- A monorepo-level uv workspace across unrelated scripts.
- Updating vendored byte-for-byte code (`server/libs`, upstream export scripts).
- Replacement of Renovate with Dependabot.

## Decisions

- **Root uv project, not per-script environments.** A single root `pyproject.toml` (`vibe-scripts`) with `requires-python = ">=3.12"` and the union of the six scripts' dependencies, plus one `uv.lock`. `uv run` walks up from the working directory, so `uv run scripts/x.py`, `website.chore`'s `uv run ../scripts/website_links.py`, and CI all resolve the same environment. Per-script projects would multiply lockfiles and reintroduce the drift this change removes. The PEP 723 blocks are deleted, not replaced by `--with` flags.
- **Scripts keep `#!/usr/bin/env python3`.** They are invoked through `uv run` by tasks/chores; a direct `python3 scripts/x.py` outside the project env is not supported and not needed.
- **`uv lock --check` plus `uv pip list --outdated`.** The check task reports outdated Python packages from the locked environment; the update task runs `uv lock --upgrade` and leaves `pyproject.toml` alone unless a constraint blocks the upgrade.
- **Cargo: `cargo outdated --workspace` per manifest, `cargo update` for in-range, `cargo upgrade --incompatible` for majors.** `cargo-edit` provides `upgrade`; both tools are pinned in `mise.toml`. The four manifests are enumerated explicitly in the task, so a new workspace is a one-line addition.
- **pnpm: `pnpm outdated` / `pnpm update` per package; `--latest` only in the major task.** Workspace files are not linked, so three invocations are the honest model.
- **Renovate runs self-hosted from a workflow.** The repository has no Renovate app, so `.github/workflows/dependency-updates.yml` runs `renovatebot/github-action` weekly and on dispatch with `RENOVATE_TOKEN`. `renovate.json` groups `cargo`, `npm`, and `github-actions` updates, separates majors, and adds a regex manager for `mise.toml` tool pins (`# renovate: datasource=...` comments where a manager cannot infer the source). Automerge stays off; Lint is the gate. If the token is absent the workflow fails with a named-secret message rather than skipping silently.
- **One policy for majors.** `deps:update` never crosses a major; `deps:update:major` is interactive-by-intent and documented as a reviewed change. Renovate opens majors as separate PRs that never automerge.

## Risks / Trade-offs

- [One root project mixes dependencies of unrelated scripts] → The union is small (httpx, python-dotenv-class packages); the lockfile is the point. A future split can use uv workspaces without changing the tasks.
- [Renovate needs a token the repository does not have yet] → Documented as the one manual setup step; the workflow fails loudly until it exists.
- \[`cargo outdated` reports transitive-only updates that `cargo update` already handles\] → The check task prints direct and transitive separately; the update task is the action.
- [Major PRs are noisy] → They are separate and not automerged; dependabot-style churn is bounded by the weekly schedule.
- \[Removing PEP 723 blocks breaks direct `python3 script.py` use\] → The tasks and chores are the supported entry points; docs say so.

## Migration Plan

1. Create the root `pyproject.toml` with the union of the inline dependencies and generate `uv.lock`.
1. Remove the PEP 723 blocks from the six scripts; run each script's smoke path through `uv run`.
1. Add `deps:check`, `deps:update`, `deps:update:major` and the tool pins.
1. Add `renovate.json` and the workflow; add the `RENOVATE_TOKEN` secret.
1. Land `security-scanning`'s pip-audit step on top of the lockfile.

## Open Questions

- Whether patch/minor automerge should be enabled for devDependencies once Lint is reliably green; the configuration leaves a single switch for it.
