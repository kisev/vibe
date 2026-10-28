# Tasks

## 1. Website off the macOS pool

- [x] 1.1 Switch the `build` and `deploy` jobs in `website.yml` from `macos-latest` to `ubuntu-latest` (the `pwa` job already runs there); keep the `github-pages` environment pin
- [x] 1.2 Dispatch Deploy Website once and confirm the site deploys from ubuntu end to end (run 40394174804: success)

## 2. Self-healing janitor

- [x] 2.1 Add `.github/workflows/ci-janitor.yml`: schedule every 30 minutes, `permissions: actions: write`, list Dev Build and Deploy Website runs finished `failed`/`cancelled` within 24h, `gh run rerun <id> --failed` those with `run_attempt < 3`, one log line per rerun, silent success when nothing needs healing (reworked 2026-10-29 to event-driven: `workflow_run` on Dev Build/Deploy Website completions heals `failed`/`cancelled` with `run_attempt < 3` the moment a run ends; the cron collapsed to a daily backstop sweep, latest-run only. The `*/30` schedule was fiction — GitHub silently dropped most firings, actual cadence 3.6–7.3h, and dev.48's 19:19Z runner-queue kill stayed unhealed until the next tag)
- [x] 2.2 Dry-test the selection query against today's real red runs (dev.41 run 40353586154 stays below the cap for a heal, dev.43's fresh greens are untouched)
- [x] 2.3 Delete `.github/workflows/macos-runner-probe.yml` — its question (pool vs repo) is answered and recorded in this change

## 3. Prerequisite audit

- [x] 3.1 Record the audit table in this change's notes: dev-build (noble apt / jammy LunarG / Windows SDK+LIB), server-release (same), transcribe-spike (apt + Windows SDK), lint (apt, landed in e429a999) — each workflow that compiles the server installs the Vulkan toolchain
- [x] 3.2 Confirm Lint is green on the audit commit (the run triggered by 1.1/2.x doubles as this check) (green on efaf2260 and 1227d5b8)

## 4. Validation

- [x] 4.1 Watch the first real incident after the event-driven rework lands: a red Dev Build or Deploy Website completion is re-run by the janitor within a minute of completing (the scheduled-only janitor failed this live: dev.48's 19:19Z runner-queue kill went unhealed — GitHub had dropped every scheduled firing after 18:59Z — and only the next tag, four hours later, restored the invariant; that incident is what triggered the `workflow_run` rework. Validated live 2026-10-28 with the controlled incident the task prescribed: a dispatched Dev Build run cancelled mid-flight at 23:02:30Z, the janitor healed it at 23:03:57Z — `trigger: … finished cancelled` → `healed: rerunning the failed jobs` — and the rerun completed green as attempt 2)
