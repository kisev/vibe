# Tasks

## 1. Python project

- [ ] 1.1 Create the root `pyproject.toml` with the union of the six scripts' PEP 723 dependencies and `requires-python = ">=3.12"`; run `uv lock` and commit `uv.lock`; verify `uv run python -c "import httpx"` works

  `pyproject.toml` is in place (`vibe-scripts`) with `bs4>=0.0.2`, `curl-cffi>=0.7`, `flask>=3.1`, `httpx>=0.28`, `pandas>=3.0`, `pyarrow>=23`, `pyjwt>=2.11`, `pyperclip>=1.9`, `python-dotenv>=1.2.1`. `uv lock` is blocked in this environment because PyPI is unreachable:

  ```text
  error: Request failed after 3 retries in 45.2s
    cause: Failed to fetch: https://pypi.org/simple/bs4/
    cause: error sending request for url (https://pypi.org/simple/bs4/)
    cause: client error (Connect)
    cause: operation timed out
  ```

  `uv lock --offline` also fails: the cache lacks `bs4`, `curl-cffi`, `flask`, `pandas`, `pyarrow`, `pyjwt`, and `pyperclip`. `uv.lock` still has to be generated where PyPI is reachable, and `uv run python -c "import httpx"` remains unverified for the same reason.

- [x] 1.2 Remove the `# /// script` dependency blocks from `scripts/website_links.py`, `scripts/export_analytics.py`, `scripts/export_kofi_supports.py`, `scripts/sign.py`, `scripts/channel.py`, `handoff/pwa/serve.py`; verify each script's smoke path runs through `uv run`

  All six blocks are gone; `python3 -m py_compile` passes on every file and `grep '/// script'` finds none. The `uv run` smoke paths are blocked by 1.1 (no lock, no PyPI).

- [x] 1.3 Verify every call site still resolves the project: `taskfile.yml`, `.github/workflows/*`; fix any that passed `--script`/`--no-project` or relied on inline pins

  No call site used `--no-project` or `--script`. `taskfile.yml` runs from the repository root; `scripts/website_build.sh` runs `uv run ../scripts/...` from `website/`, and `desktop/src-tauri/tauri.windows.signing.conf.json` runs `uv run ../../scripts/sign.py` from the Tauri directory — all have the root as an ancestor, so uv discovers `pyproject.toml`. No command needed changing.

## 2. Tasks

- [x] 2.1 Pin `cargo-outdated` and `cargo-edit` in `mise.toml`; verify `mise exec -- cargo outdated --version`

  Pinned `cargo:cargo-outdated` 0.19.0 and `cargo:cargo-edit` 0.13.14. `mise exec -- cargo outdated --version` → `cargo-outdated-outdated 0.19.0`; `mise exec -- cargo upgrade --version` → `cargo-edit-upgrade 0.13.14`.

- [x] 2.2 Add `deps:check`: cargo outdated for the four manifests, pnpm outdated for the three packages, uv locked-environment outdated list; exits zero when only outdated; verify the report lists current/latest per ecosystem

  The task prints a section per ecosystem and runs `cargo outdated --workspace` for `Cargo.toml`, `server/`, `handoff/wasm/`, `handoff/probe/`, `pnpm --dir <pkg> outdated` for `desktop`, `website`, `handoff/pwa` (exit 1 tolerated), and `uv sync --locked` + `uv pip list --outdated`. The server, wasm, and probe tables list Project/Compat/Latest; the pnpm tables list Current/Latest. The root Cargo run failed here on a crates.io download timeout (`tauri-nspanel v2.1.1`, 30s), and the uv leg fails because `uv.lock` does not exist yet (1.1). Both set the exit status, as intended; an environment with PyPI access and a committed lock exits zero.

- [ ] 2.3 Add `deps:update`: `cargo update` per workspace, `pnpm update` per package, `uv lock --upgrade`; verify it changes only lockfiles on a clean tree

  The task is implemented and `task --dry deps:update` expands to the four `cargo update --manifest-path` calls, three `pnpm --dir ... update` calls, and `uv lock --upgrade`. It was not executed: it rewrites every lockfile, and the uv leg cannot resolve without PyPI.

- [x] 2.4 Add `deps:update:major`: `cargo upgrade --incompatible` and `pnpm update --latest` behind an explicit confirmation; verify it is not reachable from the other tasks

  `deps:update:major` has `prompt:` and runs `mise exec -- cargo upgrade --incompatible --manifest-path <manifest>` for the four workspaces and `pnpm --dir <pkg> update --latest` for the three packages. No other task references it (`task --dry deps:update` shows only in-range updates).

## 3. Renovate

- [x] 3.1 Write `renovate.json`: cargo/npm/github-actions managers, weekly schedule, grouped minor/patch per ecosystem, majors separate, automerge off, `mise.toml` regex manager; verify `renovate-config-validator` (or the action's dry run) accepts it

  `renovate.json` extends `config:recommended`, runs Monday 05:00–08:59 UTC, groups `cargo`, `npm`, and `github-actions`, and gives majors their own `major {{{depName}}}` groups with `dependencyDashboardApproval: false` and `automerge: false`. Five `customManagers` (`customType: "regex"`) cover the `mise.toml` pins: `aqua:`/`github:` → `github-releases`, `npm:` → `npm` (plus a variant for the inline-table `npm:renovate` pin), `cargo:` → `crate`, `pipx:` → `pypi`. A local regex check matches all 22 pins. `mise exec -- renovate-config-validator renovate.json` → `Config validated successfully against 1 file(s)`; `oxfmt --check` is clean. The validator's migration to `customManagers`/`managerFilePatterns` was applied, and `server/crates/*/scripts` and `server/libs` are ignored as vendored code.

- [x] 3.2 Add the thin `.github/workflows/dependency-updates.yml` (weekly cron + dispatch) running `renovatebot/github-action` with `RENOVATE_TOKEN`, failing with a named-secret message when it is missing; verify with actionlint and a manual dispatch

  The workflow schedules `0 6 * * 1` and `workflow_dispatch`, requests `contents: write` and `pull-requests: write`, checks `RENOVATE_TOKEN` with a named-secret error, then runs `renovatebot/github-action@v41` pinned to Renovate 44.234.1 with `RENOVATE_CONFIG_FILE: renovate.json` and `LOG_LEVEL: info`. `mise exec -- actionlint` is clean for the whole tree, `yamllint` passes, and the dry run started, but a manual dispatch was not possible without the secret.

- [x] 3.3 Document the token secret (fine-grained: contents + pull requests write), the schedule, and the major policy in `AGENTS.md`; verify the doc matches the workflow

  The new `## Dependencies` section documents the root uv project, the three update tasks, the weekly grouped/major policy, and the fine-grained `RENOVATE_TOKEN` requirements; it matches the workflow's cron, permissions, and named-secret failure.

- [x] 3.4 Add the local no-pipeline path: `deps:renovate:dry` and `deps:renovate` using `--platform=local`, and pin Renovate so local and CI match

  `npm:renovate` 44.234.1 is pinned in `mise.toml` (with a narrow `@yarnpkg/libzip@3.2.2` trust exclusion documented inline), and the workflow pins the same `renovate-version`. `deps:renovate:dry` runs `renovate --platform=local --dry-run`; `deps:renovate` refuses a dirty tree and then applies the same updates. `renovate --version` → 44.234.1, and the dry run extracted 822 dependencies (cargo, github-actions, npm, pep621, and the mise regex manager) before it was stopped: its lookup stage stalls on this host because PyPI is unreachable. The dirty-tree guard was verified to exit 1 with its message.

## 4. Validation

- [ ] 4.1 `task deps:check` runs from a clean checkout and reports without changing files

  It ran and changed no tracked files, but this checkout cannot satisfy the precondition: PyPI is unreachable (so `uv.lock` is missing) and static.crates.io timed out for the root workspace. See 1.1 and 2.2.

- [ ] 4.2 `task deps:update` on a scratch branch changes only lockfiles; Lint is green on the result

  Not run: it rewrites every lockfile, and the uv leg cannot resolve without PyPI. Lint was run on the hand-written files instead (`actionlint`, `yamllint`, `tombi lint`, `oxfmt --check`, `renovate-config-validator`).

- [ ] 4.3 A manual Renovate dispatch opens or refreshes the grouped PRs; a major PR stays separate and unmerged by automation

  Not possible here: `RENOVATE_TOKEN` is not configured, and the GitHub action was not dispatched.

- [ ] 4.4 Live acceptance: the check/update output is actionable without reading the scripts, and the Renovate PRs are understandable; report what should change before archiving

  Pending the network restore and the first Renovate run. The local dry run and `deps:check` show the intended output shape.
