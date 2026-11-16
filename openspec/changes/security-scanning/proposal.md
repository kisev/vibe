# Proposal

## Why

Nothing in the repository fails a build because a dependency has a known vulnerability. `cargo deny` runs only for `server/`; the root `Cargo.lock`, `handoff/wasm`, `handoff/probe`, all three pnpm packages, and the Python dependencies are never audited. Secret scanning exists in pre-commit, but there is no scheduled scan, so a new advisory in an already-shipped dependency is only discovered by accident.

## What Changes

- `task security:deps` runs one policy over every ecosystem: `cargo audit` for the four Cargo lockfiles, `pnpm audit` for desktop, website and handoff/pwa, and `pip-audit` over the uv lockfile. It fails on any advisory with severity **medium or higher that has a fix available**; advisories without a fix are reported and do not fail.
- `task security:deps:report` prints everything found, including the unfixed and low-severity entries, without failing.
- `task security:secrets` runs `gitleaks` over the full history and `trivy fs --scanners secret`; `task security` is both.
- A thin `.github/workflows/security.yml` runs `mise exec -- task security` daily, on `workflow_dispatch`, and on pushes to `main` that touch a lockfile.
- `cargo deny` (licenses, bans, sources) is extended from `server/` to every Cargo workspace through the existing `server/deny.toml`; `cargo machete` stays where it is.

## Capabilities

### New Capabilities

- `security-scanning`: the vulnerability policy, the per-ecosystem scanners, the report mode, and the scheduled CI gate.

### Modified Capabilities

## Impact

- `taskfile.yml` (`security*` tasks), `scripts/security_audit.py`, `.github/workflows/security.yml`, `mise.toml` (`cargo-audit`, `pip-audit`), `server/deny.toml` reused by the other workspaces, and `AGENTS.md`.
- Requires the uv project + lockfile from `dependency-hygiene` for the Python half.
