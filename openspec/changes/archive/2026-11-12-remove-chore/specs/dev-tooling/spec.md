# Spec Delta

## MODIFIED Requirements

### Requirement: One task facade

The repository SHALL expose every developer command through the root Taskfile, so `task --list` is the complete entry surface — i18n generate/stamp/audit, docs generation and check, catalog sync, desktop tests and typecheck, server tests, lint, format, hook installation, app setup/dev/build, website build, phone handoff builds and the ggml library tasks — each delegating to the underlying pnpm/uv/cargo/script invocation rather than duplicating logic.

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

## ADDED Requirements

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
