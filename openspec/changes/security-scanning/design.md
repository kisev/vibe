# Design

## Context

`server/deny.toml` already configures cargo-deny for the server workspace, and `server:deny`/`server:machete` run in Lint. Pre-commit runs `gitleaks` on staged files and `trivy --scanners secret` when a lockfile changes. There is no `cargo-audit`, no `pnpm audit`, no `pip-audit`, no scheduled security workflow, and the root and handoff Cargo lockfiles are not audited at all. The Python dependencies currently live inline in six PEP 723 scripts (the `dependency-hygiene` change moves them into a uv project with a lockfile).

## Goals / Non-Goals

**Goals:**

- One command (`task security`) that answers "are we knowingly shipping vulnerable or secret-leaking code?".
- The failing policy matches the team's decision: fail medium+ when a fix exists.
- Daily visibility without adding work to every commit.

**Non-Goals:**

- OS-package scanning (there is no deployed OS image).
- Automatic dependency upgrades (that is `dependency-hygiene`).
- SARIF/Code Scanning integration in this iteration.
- Blocking pulls for unfixed advisories.

## Decisions

- **`cargo audit` for advisories, `cargo deny` for the rest.** cargo-deny's advisory check fails on every vulnerability regardless of whether a fix exists and cannot express "medium with a fix". `cargo-audit --json` carries the RustSec advisory `versions.patched` and the advisory's CVSS, so a small Python orchestrator can apply the policy exactly. cargo-deny keeps its role (licenses, bans, sources) and is extended to the root, `handoff/wasm`, and `handoff/probe` with the existing `server/deny.toml` via `--config`.
- **`pnpm audit --json` per package.** Three separate lockfiles mean three runs; the JSON gives `severity` and `fixAvailable`, which is the same policy input as RustSec.
- **`pip-audit` over the uv lockfile.** `uv export --format requirements-txt` piped into `pip-audit -r -` audits exactly what the project installs; `pip-audit --format json` gives the fix versions. No separate requirements file is introduced.
- **One orchestrator, `scripts/security_audit.py`.** It runs each scan, normalizes the results into `{ecosystem, package, version, severity, fixed_in, advisory}`, applies the policy, prints a stable table, and exits 1 only for medium+ with `fixed_in`. A `--report` flag prints everything without failing. Keeping the policy in one place means the local task and CI cannot disagree.
- **Secrets: `gitleaks` full history + trivy.** Pre-commit's staged scan is fast but blind to old commits; the nightly run scans `gitleaks git` over the whole history and trivy's secret scanner over the tree, with the same config files pre-commit uses.
- **Thin workflow.** `security.yml` has `schedule`, `workflow_dispatch`, and a `push` to `main` filtered to lockfiles; its only step is `mise exec -- task security`. No logic in YAML.
- **Tool pins.** `cargo-audit` (cargo) and `pip-audit` (pipx) are added to `mise.toml` so local and CI run the same versions.

## Risks / Trade-offs

- [Daily noise from unfixed advisories] → They are printed in report mode and never fail; the failing list stays short and actionable.
- [Four Cargo workspaces cost time] → `cargo-audit` reads lockfiles and the advisory DB, not the source; the four runs take seconds.
- \[GitHub advisory DB differences between `cargo audit` and cargo-deny\] → cargo-deny no longer gates advisories; one authority avoids contradictory results.
- [False sense of security from severity mapping] → RustSec CVSS is mapped to the same three bands as npm and PyPI (`medium` = 4.0–6.9, `high` 7.0–8.9, `critical` 9.0+); the mapping is documented in the script.

## Migration Plan

1. Land the uv project and lockfile from `dependency-hygiene` (pip-audit needs it).
1. Add the scanners and the orchestrator; run `task security:deps:report` and triage the current findings.
1. Enable the failing policy once the existing medium+ findings with fixes are upgraded or explicitly waived in the script's allowlist with a reason and an expiry.
1. Add the scheduled workflow.

## Open Questions

- Whether to surface the nightly result as a badge or a GitHub issue when it fails; the workflow failure notification is the starting point.
