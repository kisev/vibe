# Spec Delta

## ADDED Requirements

### Requirement: A Windows installer is built locally from the WSL checkout

`task app:build` SHALL sync the working tree to the Windows checkout named by `VIBE_WIN_CHECKOUT` (default: `<Windows home>\vibe-build`, derived from `$HOME`, never a hardcoded user name) and run `pnpm tauri build --bundles nsis` on the Windows host through `powershell.exe`. It SHALL stamp the build `1.0.0-local.<YYYYMMDD>.<sha>` and SHALL publish nothing: no tag, no release, no artifact upload, no signature.

#### Scenario: A fresh local build

- **WHEN** `task app:build` runs on the WSL workstation
- **THEN** the tree is synced to the checkout, dependencies are installed there, and an NSIS `.exe` appears under the checkout's `desktop/src-tauri/target/release/bundle/nsis/`

#### Scenario: A configured checkout path

- **WHEN** `VIBE_WIN_CHECKOUT` names a different Windows directory
- **THEN** the build uses that directory and leaves the default one alone

#### Scenario: Verified before building

- **WHEN** `task app:build:verified` runs
- **THEN** `task verify` runs first and a failure stops the build

#### Scenario: Nothing is published

- **WHEN** a local build finishes
- **THEN** no git tag, release or uploaded asset exists for it

### Requirement: A local build never joins an update channel

The updater SHALL report no available update when the running version contains `-local`, so a locally built app cannot be replaced by a release or dev build.

#### Scenario: Checking from a local build

- **WHEN** `update_check` runs inside a `1.0.0-local.…` build
- **THEN** it returns no update and contacts no channel manifest
