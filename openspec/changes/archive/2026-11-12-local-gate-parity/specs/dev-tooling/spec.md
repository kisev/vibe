# Spec Delta

## MODIFIED Requirements

### Requirement: Local gates via git hooks

The repository SHALL install lefthook hooks once per checkout (`task hooks`) with three gates: pre-commit runs fast, file-scoped checks in parallel over the staged set; pre-push runs `task verify`, the local mirror of the CI gate set; commit-msg enforces the commit message convention.

#### Scenario: Fast pre-commit

- **WHEN** a commit stages a handful of files
- **THEN** the pre-commit gate touches only staged files of matching types and completes in seconds

#### Scenario: Broken formatting blocked

- **WHEN** a staged file fails its format check, including a style sheet or an HTML page
- **THEN** the commit is rejected with the tool's own diff or message

#### Scenario: Pre-push tests

- **WHEN** a push happens
- **THEN** `task verify` runs first and a failure blocks the push

#### Scenario: Conventional messages

- **WHEN** a commit message violates the configured convention
- **THEN** the commit is rejected and the rule that failed is named

## ADDED Requirements

### Requirement: One command mirrors the CI gate set

`task verify` SHALL run every gate a push or pull request triggers that can run locally: the lint matrix, `format:check`, `cargo fmt --all -- --check`, clippy over the desktop/CLI workspace with `-D warnings`, the server clippy and dependency gates, the unit suites, and the browser E2E suite. A green `task verify` on a revision SHALL mean every local-capable CI job is expected to pass on it.

#### Scenario: A warning in the desktop workspace

- **WHEN** the desktop Rust code has a clippy warning that CI treats as an error
- **THEN** `task verify` fails locally, before any push

#### Scenario: An unformatted page

- **WHEN** an HTML or CSS file does not match the formatter
- **THEN** `task verify` fails locally at the same step CI runs

#### Scenario: A broken E2E start

- **WHEN** the browser suite cannot start its web server
- **THEN** `task verify` reports it locally with the server's own output

#### Scenario: Tagging

- **WHEN** a `dev.<n>` or release tag is about to be created
- **THEN** the tag is only created on a revision where `task verify` was green
