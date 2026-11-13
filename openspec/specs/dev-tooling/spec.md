# dev-tooling Specification

## Purpose

One development-tooling contract for the fork: a single task facade over three toolchains, local git-hook gates, a pinned lint/format matrix shared with the user's other projects, and Rust lint gates beyond rustfmt defaults.

## Requirements

### Requirement: One task facade

The repository SHALL expose every developer command through the root Taskfile, so `task --list` is the complete entry surface, each target delegating to the underlying pnpm/uv/cargo/script invocation rather than duplicating logic.

No second task runner SHALL exist in the repository: a `chorefile`, a `*.chore` file, or a workflow step that installs another task runner is a defect.

#### Scenario: Discovering commands

- **WHEN** a contributor runs `task --list`
- **THEN** every script a contributor needs is listed with its group, and no project script is reachable only by remembering the underlying pnpm/uv/cargo incantation

#### Scenario: Delegation, not duplication

- **WHEN** a task wraps an existing package script or a helper under `scripts/`
- **THEN** the task invokes that script, so a change to the script needs no task edit

#### Scenario: One runner

- **WHEN** a workflow or a document tells someone how to build, test or release
- **THEN** it names a `task` target, and no `chore` command, `chorefile`, `*.chore` file or `getchore/setup-chore` step remains in the tree

#### Scenario: Local package manager

- **WHEN** the Linux build dependencies are installed on a host that is not Debian-based
- **THEN** the task uses that host's package manager instead of failing on `apt-get`

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

### Requirement: Pinned toolchain

Every lint/format tool SHALL be pinned by exact version in `mise.toml` and resolved through `mise exec`, so local checks and CI run identical tool versions without global installs.

#### Scenario: Fresh checkout

- **WHEN** a contributor runs `mise install && task hooks`
- **THEN** every gate runs with the pinned versions and no tool is required globally

### Requirement: Lint and format matrix

Each file type SHALL have exactly one linter and at most one formatter, following the user's shared stack: yaml → yamllint; toml → tombi; markdown → markdownlint-cli2 (rules) + mdformat (format); json/jsonc → oxfmt; js/ts → oxlint; md/json/css → prettier; shell → shellcheck + shfmt; editorconfig → editorconfig-checker; secrets → gitleaks (staged and full-tree) + trivy; GitHub workflows → actionlint. Generated trees are excluded explicitly.

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

### Requirement: One command mirrors the CI gate set

`task verify` SHALL run every deterministic, locally-runnable gate a push or pull request triggers: the lint matrix, formatting and both clippy gates, the server dependency gates, the unit suites, the site build, and the browser E2E suite. A green run SHALL mean every local-capable CI job is expected to pass on that revision. The transcribe spike stays CI-only: it downloads a model, runs an inference, and needs the Vulkan SDK on two platforms.

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

### Requirement: Sidecars come from the task facade

The desktop app's sidecars — `vibe-server` and `ffmpeg` for the target triple — SHALL be fetched by `task setup [triple]`, and a locally built server SHALL be staged by `task server:build [triple]`. Both SHALL be callable from CI and from a workstation with the same arguments.

#### Scenario: A release build needs its sidecars

- **WHEN** the release workflow builds a target
- **THEN** it runs `task setup <triple>` and gets `vibe-server-<triple>` and, outside Linux, `ffmpeg-<triple>` in `desktop/src-tauri/binaries`

#### Scenario: Iterating on the engine

- **WHEN** a contributor runs `task server:build <triple>`
- **THEN** the server is built from `server/` and staged under the same sidecar name `task setup` would have produced

#### Scenario: Sidecars already in place

- **WHEN** the sidecar files for the requested triple exist
- **THEN** `task setup` leaves them alone and reports that they are in place
