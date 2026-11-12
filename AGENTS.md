# Claude Development Notes

## Tooling

- Tasks: `task` — see `task --list`; toolchain pins in `mise.toml`, git gates via `task hooks`
- Upstream: `task upstream:fetch` (branches only); tags under `refs/upstream-tags/*` via `task upstream:tags` — see `docs/how-to/sync-upstream.md`
- JS: `pnpm` only; Python: `uv` standalone scripts (`uv run`)

## Dependencies

Python dependencies live in the root uv project (`pyproject.toml` + `uv.lock`), not in per-script PEP 723 blocks; `uv run` resolves them from anywhere in the tree.

- `task deps:check` — report outdated Cargo, pnpm and Python packages (read-only)
- `task deps:update` — update within declared ranges; majors stay put
- `task deps:update:major` — explicit, prompted major upgrades; review the diff

Two Renovate paths share `renovate.json`: `task deps:renovate:dry` previews what Renovate would change, and `task deps:renovate` applies it to a clean working tree (no token, no PRs) — review and commit the diff like any other change. CI runs the weekly `.github/workflows/dependency-updates.yml`: one grouped PR per ecosystem, majors separate, no automerge. The workflow needs a fine-grained `RENOVATE_TOKEN` repository secret with contents and pull requests write access; it fails with a named-secret message when it is missing.

## Validation

`task verify` is the gate: the lint matrix, `format:check`, rustfmt over the root workspace, clippy over the desktop/CLI workspace and the server, the dependency gates, the unit suites and the browser E2E suite — everything a push or pull request triggers that can run locally. Nothing is pushed, and no `dev.<n>` or release tag is created, before it is green on that revision; the pre-push hook runs the same command. CI is the backstop, never the first check.

Plan validation scripts: `plans/<name>/<name>_001.py` (+ `.md`), standalone `uv` scripts.

## Skills

Custom skills live in `.claude/skills/<name>/SKILL.md`.

## Execution Mindset

Agent mode: parallel moves, instant iteration, speed by default. Split heavy work until obvious. Estimate by output size — 300 lines = minutes. Correct over easy: rework is slower than doing it right once. Plan resolved → execute, don't re-analyze.

## OpenSpec first

Practically everything goes through an OpenSpec change: if a request does not map to an existing `openspec/changes/<name>/`, create or update one before touching code. Proposal, spec delta, design, and tasks come first; implementation follows the tasks. The only exceptions are a production hotfix, a typo, or a pure translation refresh — and even those leave a note in the nearest change or a new one the same day. Never build a feature, a refactor of behavior, or a CI/process change "outside openspec".

## Thin workflows, thick tasks

GitHub workflows are thin: checkout, toolchain setup, and a call to a `task` target. All logic — version computation, release bodies, cleanup rules, manifest generation, guards, retries — lives in `taskfile.yml` tasks or standalone scripts under `scripts/`. A YAML file holds `run: task <name>` and env/inputs, nothing else. If a step grows past a couple of lines of shell or jq, it becomes a task before it lands.

## Release discipline

A `dev.<n>` tag publishes a release — it is never a validation vehicle. Tag only from a revision whose Lint run finished green; never tag "to see if it builds". A dev revision is validated in place with `gh workflow run lint.yml --ref dev` (server clippy + desktop cargo check + tests), so no throwaway commit on `main` is needed; a `main` push still triggers Lint for what must live on the release line.

Dev builds live on the `dev` branch: `main` carries the release line, and every `dev.<n>` tag is cut on `dev` only — `task dev:tag` refuses off `dev`, and the Dev Build workflow fails a tag whose commit is not contained in `dev`.

Dev builds are tag-only: a push to `dev` builds nothing, and a `dev.<n>` tag (or an explicit dispatch on `dev`) is the only trigger. Never rerun a whole dev matrix to "check" something — that is five platform builds and a website deploy.

Cleanup is bounded retention, not a one-release sweep: the newest **5** dev releases always stay, anything created in the last **24 hours** stays, and only releases created before the running build started are considered at all. So a late-healed older run can never delete a release a newer build is filling. Tags are never deleted — they are the history.

## Working in parallel

Split large work across ~4–5 subagents, one disjoint module-group each — no shared files; only the coordinator touches shared/root config. Fix contracts (interfaces, design docs) up front. Throughput is per-agent (~100 tok/s, no global limit), so N agents ≈ N× speed — delegate bulk implementation to strong subagents (e.g. Opus 5 for correctness-sensitive code); keep the main loop for planning, contracts, and integration.

## ETA rule

Quote minutes, never days: single tasks 1–10 min, multi-agent work tens of minutes.

```
minutes ≈ (LOC × 40) / (6000 × N_agents) + ~2 min per stage
```

## File size

700 lines max. On hitting it, ask before splitting.

Split by responsibility into halves — find where the file does two jobs and move one out whole. Not a line-count cut, not a `utils` skim. Keep the public API where callers expect it; move tests with their code.
