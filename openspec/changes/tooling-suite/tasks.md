# Tasks

## 1. Version layer and task facade

- [x] 1.1 Add `mise.toml` pinning every tool (fd, yamllint, tombi, markdownlint-cli2, mdformat, oxfmt, oxlint, editorconfig-checker, gitleaks, trivy, shellcheck, shfmt, actionlint, commitlint, lefthook, task) with versions from `kisev/skills`/`gitlaw`
- [x] 1.2 Add root `Taskfile.yml` delegating to the existing scripts: i18n (generate/stamp/audit), docs (models + check), sync:catalog, desktop (test/tsc), server (test), lint, format, format:check, hooks, dev:tag — `task --list` shows the whole surface
- [x] 1.3 Update `AGENTS.md`: drop the chore line, point at `task --list`

## 2. Hook gates

- [x] 2.1 Add `lefthook.yml`: parallel staged-scoped pre-commit jobs per file type (gitleaks staged, trivy secret scan, prettier, oxfmt, oxlint, yamllint, tombi lint/format-check, markdownlint-cli2, mdformat --check, shfmt -d, shellcheck, editorconfig-checker, actionlint on workflow files), `pre-push: task test`, `commit-msg: commitlint`
- [x] 2.2 Add `commitlint.config.mjs` (conventional commits, matching the repo's imperative style) and `.gitleaks.toml`/`trivy-secret.yaml` with allowlists for the repo's known-good test tokens
- [x] 2.3 Add `task hooks` (installs lefthook once per checkout) and verify the full gate path on a sample staged change

## 3. Lint/format configs

- [x] 3.1 Per-tool configs with explicit generated-tree exclusions (paraglide, catalog JSONs, generated docs, tauri `gen/`): `.yamllint`, `tombi.toml`, `.markdownlint-cli2.mjs`, `.mdformat.toml`, `.oxlintrc.json`, prettier ignore refresh, `ecrc`/editorconfig-checker config
- [x] 3.2 Run `task format` once over the tree and land the reformat as its own commit; `task lint format:check` green afterwards

## 4. Rust gates

- [x] 4.1 Extend `rustfmt.toml` with stable keys only; run `cargo fmt` across the workspace
- [x] 4.2 Add `[workspace.lints.clippy]` (unwrap_used, expect_used, undocumented_unsafe_blocks) to the server workspace; fix the findings; `cargo clippy --workspace --all-targets -- -D warnings` green (cast lints dropped and desktop deferred — see design notes)
- [x] 4.3 Add `server/deny.toml` (licenses allowlist, advisories, duplicates, git-source allowlist), record the baseline with explicit allowlisted exceptions; `task server:deny` green (desktop tree stays upstream-pinned, not denied yet)
- [x] 4.4 Add `cargo machete` to the gate set; clean what it finds

## 5. CI parity

- [x] 5.1 Add a lint job to CI that runs `task lint format:check` (and the Rust gates where cargo is available) using mise, so CI and hooks share one definition
- [ ] 5.2 Confirm the full suite green on a dev build after the reformat commit
