# Proposal

## Why

The fork runs three toolchains (TS, Rust, Python) with ad-hoc entry points: pnpm scripts in `desktop/` and `website/`, uv scripts in `scripts/`, cargo in `server/`, and no local gates — nothing checks formatting, secrets, or workflow files before a push, and CI finds problems late. The user's other projects (`kisev/skills`, `kisev/gitlaw`) already converged on one stack (mise + Taskfile + lefthook + a lint matrix); vibe should use the same stack so it behaves identically across projects.

Rust checks in particular are minimal: `rustfmt.toml` has three lines, the workspace has no `[lints]` section, and nothing checks licenses or dead dependencies.

## What Changes

- `mise.toml` pins every tool (versions from `kisev/skills`/`gitlaw`): fd, yamllint, tombi, markdownlint-cli2, mdformat, oxfmt, oxlint, prettier, editorconfig-checker, gitleaks, trivy, shellcheck, shfmt, actionlint, commitlint, lefthook, task.
- A root `Taskfile.yml` becomes the single facade over pnpm/uv/cargo: i18n, docs, catalog sync, tests, typecheck, lint, format, hooks.
- `lefthook.yml` gates: fast staged-scoped checks on pre-commit, tests on pre-push, commit message convention on commit-msg.
- The lint/format matrix covers yaml, toml, markdown, json, js/ts, shell, editorconfig conformance, secrets, and GitHub workflows.
- Rust: curated `[workspace.lints.clippy]` set beyond defaults, `cargo-deny` (licenses, advisories, duplicate versions) and `cargo-machete` in CI.
- `AGENTS.md` drops `chore` (untrusted, never used here) in favor of `task`.

## Capabilities

### New Capabilities

- `dev-tooling`: one task facade, local git hooks, a pinned multi-language lint/format matrix, and elevated Rust lint gates.

### Modified Capabilities

_None._
