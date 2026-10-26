# dev-tooling Specification

## Purpose

One development-tooling contract for the fork: a single task facade over three toolchains, local git-hook gates, a pinned lint/format matrix shared with the user's other projects, and Rust lint gates beyond rustfmt defaults.

## Requirements

### Requirement: One task facade

The repository SHALL expose its developer commands through a root Taskfile so `task --list` is the complete entry surface — i18n generate/stamp/audit, docs generation and check, catalog sync, desktop tests and typecheck, server tests, lint, format, and hook installation — each delegating to the underlying pnpm/uv/cargo invocation rather than duplicating logic.

#### Scenario: Discovering commands

- **WHEN** a contributor runs `task --list`
- **THEN** every script a contributor needs is listed with its group, and no project script is reachable only by remembering the underlying pnpm/uv/cargo incantation

#### Scenario: Delegation, not duplication

- **WHEN** a task wraps an existing package script
- **THEN** the task invokes that script, so a change to the script needs no task edit

### Requirement: Local gates via git hooks

The repository SHALL install lefthook hooks once per checkout (`task hooks`) with three gates: pre-commit runs fast, file-scoped checks in parallel over the staged set; pre-push runs the test suites; commit-msg enforces the commit message convention.

#### Scenario: Fast pre-commit

- **WHEN** a commit stages a handful of files
- **THEN** the pre-commit gate touches only staged files of matching types and completes in seconds

#### Scenario: Broken formatting blocked

- **WHEN** a staged file fails its format check
- **THEN** the commit is rejected with the tool's own diff or message

#### Scenario: Pre-push tests

- **WHEN** a push happens
- **THEN** desktop and server tests run first and a failure blocks the push

#### Scenario: Conventional messages

- **WHEN** a commit message violates the configured convention
- **THEN** the commit is rejected and the rule that failed is named

### Requirement: Pinned toolchain

Every lint/format tool SHALL be pinned by exact version in `mise.toml` and resolved through `mise exec`, so local checks and CI run identical tool versions without global installs.

#### Scenario: Fresh checkout

- **WHEN** a contributor runs `mise install && task hooks`
- **THEN** every gate runs with the pinned versions and no tool is required globally

### Requirement: Lint and format matrix

Each file type SHALL have exactly one linter and at most one formatter, following the user's shared stack: yaml → yamllint; toml → tombi; markdown → markdownlint-cli2 (rules) + mdformat (format); json/jsonc → oxfmt; js/ts → oxlint; md/json/css → prettier where already configured; shell → shellcheck + shfmt; editorconfig → editorconfig-checker; secrets → gitleaks (staged and full-tree) + trivy (secret scanner over manifests); GitHub workflows → actionlint. Generated trees are excluded explicitly.

#### Scenario: Whole-tree check

- **WHEN** `task lint` runs on a clean tree
- **THEN** it passes, and introducing a violation in any covered file type fails the matching check

#### Scenario: Generated files exempt

- **WHEN** a check runs over generated output (paraglide, catalogs, generated docs)
- **THEN** those paths are excluded rather than reformatted

### Requirement: Elevated Rust gates

The server Rust workspace SHALL carry lint gates beyond rustfmt defaults: a curated `[workspace.lints.clippy]` set (including `unwrap_used`, `expect_used`, `undocumented_unsafe_blocks`) enforced with `-D warnings`, a `cargo-deny` configuration covering licenses, advisories, and duplicate versions, and `cargo-machete` for unused dependencies. The desktop workspace keeps its existing CI gate until its unwrap/expect cleanup lands; elevating it is a separate follow-up change.

#### Scenario: Workspace lints apply everywhere

- **WHEN** clippy runs on any crate in the server workspace
- **THEN** the curated set applies through the workspace inheritance and warnings fail the run

#### Scenario: License gate

- **WHEN** a new dependency introduces a license outside the allowlist
- **THEN** `cargo-deny check` fails and names the crate and license

#### Scenario: Advisories and duplicates

- **WHEN** a dependency has a published advisory or pulls a banned duplicate
- **THEN** `cargo-deny check` fails with the advisory or duplicate listed

#### Scenario: Dead dependency

- **WHEN** a crate lists a dependency nothing references
- **THEN** `cargo-machete` names it

### Requirement: CI runs the same gates

CI SHALL run the same lint and format tasks the hooks run, so a gate that passes locally passes in CI and vice versa, without a second definition of the checks.

#### Scenario: One definition

- **WHEN** the lint matrix changes
- **THEN** CI behavior changes with it, because CI invokes the tasks rather than re-stating the commands
