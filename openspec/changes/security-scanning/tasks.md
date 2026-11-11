# Tasks

## 1. Scanners

- [ ] 1.1 Pin `cargo-audit` and `pip-audit` in `mise.toml`; verify `mise exec -- cargo audit --version` and `mise exec -- pip-audit --version`
- [ ] 1.2 Extend cargo-deny to the root, `handoff/wasm`, and `handoff/probe` using `server/deny.toml` via `--config`; verify each workspace checks clean or the config is adjusted with a reason
- [ ] 1.3 Write `scripts/security_audit.py`: runs cargo-audit (4 lockfiles), pnpm audit (3 packages), pip-audit (uv lock), normalizes to one table, applies "fail on medium+ with a fix", `--report` prints everything; verify with a seeded fixture for fail/pass/report
- [ ] 1.4 Add `security:deps`, `security:deps:report`, `security:secrets`, and the aggregate `security` to `taskfile.yml`; verify each runs locally and the aggregate exits non-zero only on the policy

## 2. CI

- [ ] 2.1 Add a thin `.github/workflows/security.yml`: `schedule` daily, `workflow_dispatch`, and `push` to main filtered to lockfiles; the step is `mise exec -- task security`; verify with actionlint and a manual dispatch

## 3. Documentation

- [ ] 3.1 Document the policy, the report mode, the waiver format (reason + expiry), and the nightly schedule in `AGENTS.md` and `docs/SECURITY.md`; verify the doc matches the script

## 4. Validation

- [ ] 4.1 Run `task security:deps:report` on the current tree and triage every medium+ finding: upgrade, or add a reviewed waiver with a reason and expiry
- [ ] 4.2 Run `task security:deps` and verify it fails only on fixable medium+ entries and names the upgrade target
- [ ] 4.3 Verify `task security:secrets` over the full history and that a planted test secret in a scratch clone is reported
- [ ] 4.4 Live: the scheduled workflow runs green (or fails for a real finding) and its result is visible on the Actions page
- [ ] 4.5 Live acceptance: `task security` reads clearly enough to act on without opening the script; report what should change before archiving
