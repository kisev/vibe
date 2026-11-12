# Spec Delta

## Purpose

Dependencies have one declared source, one lockfile per ecosystem, a way to see what is outdated, and a scheduled PR flow that respects the project's gates.

## ADDED Requirements

### Requirement: Python dependencies live in one locked project

All third-party Python dependencies SHALL be declared in a single root `pyproject.toml` with a committed `uv.lock`. Scripts SHALL NOT carry inline PEP 723 dependency blocks.

#### Scenario: Running a script

- **WHEN** a task runs `uv run scripts/<name>.py`
- **THEN** dependencies resolve from the root uv project and its lockfile, with no per-script pins

#### Scenario: Adding a dependency

- **WHEN** a script needs a new package
- **THEN** it is added to the root `pyproject.toml` and `uv lock` is committed with the code that uses it

### Requirement: Outdated and updated are explicit

The project SHALL provide a check that reports outdated dependencies across Cargo, pnpm, and uv without changing anything, an update that moves within declared ranges, and a separate opt-in command for major upgrades.

#### Scenario: Checking

- **WHEN** the user runs the dependency check
- **THEN** it lists outdated packages per ecosystem with current and latest versions and exits zero even when something is outdated

#### Scenario: Updating within ranges

- **WHEN** the user runs the update task
- **THEN** lockfiles change within the declared ranges and no manifest moves a major version

#### Scenario: Major upgrade

- **WHEN** the user runs the major task
- **THEN** manifest ranges may move to a new major and the change is reviewed like code

### Requirement: Renovate opens grouped, gated PRs

A Renovate configuration SHALL cover Cargo, pnpm, GitHub Actions, and `mise.toml`, grouping by ecosystem weekly and keeping majors as separate PRs, with no automerge for majors. A thin scheduled workflow SHALL run it.

#### Scenario: Weekly run

- **WHEN** the Renovate workflow fires
- **THEN** it opens or refreshes grouped minor/patch PRs and separate major PRs, each subject to the normal Lint gate

#### Scenario: Missing token

- **WHEN** `RENOVATE_TOKEN` is not configured
- **THEN** the workflow fails with a message naming the secret instead of silently doing nothing
