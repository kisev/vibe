# Tasks

## 1. Python project

- [ ] 1.1 Create the root `pyproject.toml` with the union of the six scripts' PEP 723 dependencies and `requires-python = ">=3.12"`; run `uv lock` and commit `uv.lock`; verify `uv run python -c "import httpx"` works
- [ ] 1.2 Remove the `# /// script` dependency blocks from `scripts/website_links.py`, `scripts/export_analytics.py`, `scripts/export_kofi_supports.py`, `scripts/sign.py`, `scripts/channel.py`, `handoff/pwa/serve.py`; verify each script's smoke path runs through `uv run`
- [ ] 1.3 Verify every call site still resolves the project: `taskfile.yml`, `chorefile`, `website/website.chore`, `.github/workflows/*`; fix any that passed `--script`/`--no-project` or relied on inline pins

## 2. Tasks

- [ ] 2.1 Pin `cargo-outdated` and `cargo-edit` in `mise.toml`; verify `mise exec -- cargo outdated --version`
- [ ] 2.2 Add `deps:check`: cargo outdated for the four manifests, pnpm outdated for the three packages, uv locked-environment outdated list; exits zero when only outdated; verify the report lists current/latest per ecosystem
- [ ] 2.3 Add `deps:update`: `cargo update` per workspace, `pnpm update` per package, `uv lock --upgrade`; verify it changes only lockfiles on a clean tree
- [ ] 2.4 Add `deps:update:major`: `cargo upgrade --incompatible` and `pnpm update --latest` behind an explicit confirmation; verify it is not reachable from the other tasks

## 3. Renovate

- [ ] 3.1 Write `renovate.json`: cargo/npm/github-actions managers, weekly schedule, grouped minor/patch per ecosystem, majors separate, automerge off, `mise.toml` regex manager; verify `renovate-config-validator` (or the action's dry run) accepts it
- [ ] 3.2 Add the thin `.github/workflows/dependency-updates.yml` (weekly cron + dispatch) running `renovatebot/github-action` with `RENOVATE_TOKEN`, failing with a named-secret message when it is missing; verify with actionlint and a manual dispatch
- [ ] 3.3 Document the token secret (fine-grained: contents + pull requests write), the schedule, and the major policy in `AGENTS.md`; verify the doc matches the workflow

## 4. Validation

- [ ] 4.1 `task deps:check` runs from a clean checkout and reports without changing files
- [ ] 4.2 `task deps:update` on a scratch branch changes only lockfiles; Lint is green on the result
- [ ] 4.3 A manual Renovate dispatch opens or refreshes the grouped PRs; a major PR stays separate and unmerged by automation
- [ ] 4.4 Live acceptance: the check/update output is actionable without reading the scripts, and the Renovate PRs are understandable; report what should change before archiving
