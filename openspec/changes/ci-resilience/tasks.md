# Tasks

## 1. Website off the macOS pool

- [x] 1.1 Switch the `build` and `deploy` jobs in `website.yml` from `macos-latest` to `ubuntu-latest` (the `pwa` job already runs there); keep the `github-pages` environment pin
- [ ] 1.2 Dispatch Deploy Website once and confirm the site deploys from ubuntu end to end

## 2. Self-healing janitor

- [x] 2.1 Add `.github/workflows/ci-janitor.yml`: schedule every 30 minutes, `permissions: actions: write`, list Dev Build and Deploy Website runs finished `failed`/`cancelled` within 24h, `gh run rerun <id> --failed` those with `run_attempt < 3`, one log line per rerun, silent success when nothing needs healing
- [x] 2.2 Dry-test the selection query against today's real red runs (dev.41 run 40353586154 stays below the cap for a heal, dev.43's fresh greens are untouched)
- [x] 2.3 Delete `.github/workflows/macos-runner-probe.yml` — its question (pool vs repo) is answered and recorded in this change

## 3. Prerequisite audit

- [x] 3.1 Record the audit table in this change's notes: dev-build (noble apt / jammy LunarG / Windows SDK+LIB), server-release (same), transcribe-spike (apt + Windows SDK), lint (apt, landed in e429a999) — each workflow that compiles the server installs the Vulkan toolchain
- [ ] 3.2 Confirm Lint is green on the audit commit (the run triggered by 1.1/2.x doubles as this check)

## 4. Validation

- [ ] 4.1 Watch the first real incident after the janitor lands: an infra-killed release job re-runs itself within 30 minutes and completes; if none occurs within a dev-tag cycle, cancel one macOS cell of a scratch dispatch and watch the janitor heal it
