# Spec Delta

## Purpose

Known vulnerabilities in the project's dependencies become a gate, not a surprise: every lockfile is audited on a stated policy, and the result is visible locally and in CI.

## ADDED Requirements

### Requirement: Every ecosystem is audited

The security scan SHALL cover every dependency lockfile in the repository: the root Cargo workspace, `server/`, `handoff/wasm`, `handoff/probe`, the `desktop`, `website` and `handoff/pwa` pnpm packages, and the Python project lockfile.

#### Scenario: A new advisory in an unchanged dependency

- **WHEN** a scheduled scan runs and a published advisory affects a locked version
- **THEN** the scan reports it with the ecosystem, package, installed version, fixed version when one exists, and severity

### Requirement: The failing policy is fixable, medium and above

The scan SHALL fail on any advisory of severity medium, high, or critical for which a fixed version exists. Advisories without a fix, and low-severity advisories, SHALL be reported but SHALL NOT fail the scan.

#### Scenario: Medium advisory with a fix

- **WHEN** a medium-severity advisory has a fixed version
- **THEN** the scan exits non-zero and names the upgrade target

#### Scenario: Advisory without a fix

- **WHEN** an advisory has no fixed version
- **THEN** it appears in the report and the scan exits zero

### Requirement: Secrets are scanned beyond staged files

The security scan SHALL run secret detection over the full git history and over the filesystem, not only over staged changes.

#### Scenario: A secret committed months ago

- **WHEN** the full-history scan runs
- **THEN** a secret in an old commit is reported by `gitleaks`

### Requirement: The scan runs on a schedule

A thin workflow SHALL run the security task daily, on manual dispatch, and on pushes to `main` that change a dependency lockfile.

#### Scenario: Daily run

- **WHEN** the scheduled workflow fires
- **THEN** it runs `mise exec -- task security` and its result is the repository's security status for that day
