# dev-build Specification

## Purpose

Defines the fork's continuous build contract: when a dev build runs, which platforms it covers, where its sidecars come from, what it publishes, and what it must never depend on.

## Requirements

### Requirement: Build on dev tags

The system SHALL start a dev build when a `dev.<number>` tag is pushed, and on manual dispatch, always building the revision the tag points at. Pushes to `main` and other branches SHALL NOT start a build.

#### Scenario: Dev tag pushed

- **WHEN** a `dev.<number>` tag is pushed
- **THEN** a dev build starts for the commit the tag points at, and its published version derives its number from the tag

#### Scenario: Push to main

- **WHEN** a commit is pushed to `main` without a tag
- **THEN** no dev build starts

#### Scenario: Manual dispatch

- **WHEN** the workflow is started by hand
- **THEN** it builds the selected revision

#### Scenario: Other tags

- **WHEN** a tag that is not a dev tag is pushed
- **THEN** no dev build starts

### Requirement: Five-platform coverage

The system SHALL produce an installable desktop bundle for macOS arm64 and x86_64, Linux x86_64 and aarch64, and Windows x86_64 on every run.

#### Scenario: Platform bundles

- **WHEN** a dev build completes on any of the five platforms
- **THEN** it publishes the bundles that platform's configuration enables: `dmg` and `app` on macOS, `deb` and `rpm` on Linux, and the `nsis` installer on Windows

### Requirement: Sidecars built from the tree

The dev build SHALL build the `vibe-server` sidecar from the checked-out revision and MUST NOT download a previously published server release.

#### Scenario: Engine changes present

- **WHEN** the built revision contains a server engine change
- **THEN** the published build's bundled server includes that change

#### Scenario: Unpublished server pin

- **WHEN** `.server-version` names a server release that does not exist yet
- **THEN** the dev build still succeeds

### Requirement: Public inputs and no secrets

The dev build MUST run without any repository secret and MUST NOT require an external task runner to be installed.

#### Scenario: No secrets configured

- **WHEN** the fork has no Actions secrets
- **THEN** every platform builds successfully

#### Scenario: Unsigned bundles

- **WHEN** a dev build finishes
- **THEN** its bundles carry no updater artifacts and require no signing key

### Requirement: One dev release at a time

The repository SHALL hold exactly one dev prerelease: the newest dev run that completed. Each green run SHALL publish its bundles to a prerelease tagged `dev.<run-number>` — the number grows monotonically — and SHALL then delete every other `dev.*` release. Deleting a dev release SHALL NOT delete its tag, and stable releases SHALL never be touched. The release name SHALL carry the application version with its `-dev.<short-commit>` suffix and the release body SHALL name the full commit SHA, so the surviving build remains identifiable as a complete snapshot of one revision.

#### Scenario: New commit

- **WHEN** a run builds a commit that has no release yet
- **THEN** it creates the prerelease `dev.<run-number>` named with the commit's dev version and attaches the bundles

#### Scenario: Failed run

- **WHEN** a run fails to produce some platform bundles
- **THEN** no assets of that run land in a release of a different commit, and the previous complete release is not deleted

#### Scenario: Re-run of a failed run

- **WHEN** a partially failed run is re-run
- **THEN** it reuses its own `dev.<run-number>` release, the five matrix jobs share it as before, and the cleanup runs when the run completes

#### Scenario: Later builds

- **WHEN** a later commit is built and completes
- **THEN** its release becomes the only dev release — earlier dev releases are deleted with their tags left in place, so the tag numbers keep growing monotonically

#### Scenario: Commit identity survives the tag change

- **WHEN** a dev release is opened on the releases page
- **THEN** its name shows the dev version with the short commit and its body names the full SHA, so the built revision can be identified without the tag

#### Scenario: Latest release unaffected

- **WHEN** a dev release exists
- **THEN** it does not become the repository's latest release

### Requirement: Dev version is identifiable

The build SHALL carry a version that marks it as a dev build: the application version from the tracked configuration with a `-dev.<short-commit>` suffix, and the bundled server SHALL report the same version.

#### Scenario: Application version

- **WHEN** a dev build is installed
- **THEN** the application reports a version ending in `-dev.<short-commit>`, for example `3.2.2-dev.a9c3b34`

#### Scenario: Server version

- **WHEN** the bundled server is asked for its version
- **THEN** it reports the same dev version as the application

### Requirement: Dev builds never self-update

A dev build MUST NOT check the upstream update channel, so it can never offer to replace itself with the release it was branched from.

#### Scenario: No update offered

- **WHEN** a dev build starts and the upstream release is newer or equal
- **THEN** no update is offered

### Requirement: Independent platform jobs

A failure on one platform SHALL NOT stop the other platforms from building or publishing.

#### Scenario: One runner fails

- **WHEN** one platform fails to build
- **THEN** the remaining platforms still build and publish their bundles

### Requirement: Stable releases are untouchable

The dev-release cleanup SHALL consider only prereleases whose tag matches `dev.*`; stable releases SHALL never be selected, deleted, or modified by it.

#### Scenario: Stable releases are untouchable

- **WHEN** the cleanup deletes dev releases
- **THEN** stable releases and their assets are not considered or modified

### Requirement: Infra-killed jobs are re-run automatically

The repository SHALL automatically re-run the failed jobs of the Dev Build and Deploy Website workflows when a run finishes failed or cancelled, at most until the run reaches its third attempt. The janitor SHALL use only the built-in token and preinstalled tooling, and SHALL NOT touch runs of workflows whose failures mean broken content (Lint).

#### Scenario: A macOS cell is killed by the platform

- **WHEN** a Dev Build or Deploy Website run ends failed or cancelled because a runner was killed by infrastructure
- **THEN** within the janitor's next sweep its failed jobs are re-run, with no human action, and a completed re-run finishes the release or deployment it belonged to

#### Scenario: The attempt cap holds

- **WHEN** a run has already been attempted three times
- **THEN** the janitor leaves it red for a human instead of re-running it again

#### Scenario: Content failures are not retried

- **WHEN** the Lint workflow fails
- **THEN** the janitor does not re-run it

### Requirement: Build prerequisites travel with every server-compiling workflow

Every workflow that compiles the server from the tree — dev build, server release, transcribe spike, and lint — SHALL install the Vulkan build toolchain (headers, loader, glslc) on its Linux runners before building, and the Vulkan SDK on Windows runners where the server links the loader.

#### Scenario: Lint compiles the engine

- **WHEN** the lint workflow runs `server:clippy`, which compiles the engine with `GGML_VULKAN=ON`
- **THEN** the Vulkan packages are already installed and clippy configures cleanly

#### Scenario: A new workflow builds the server

- **WHEN** a future workflow compiles the server from the tree
- **THEN** it carries the same prerequisite steps, or it fails visibly at configure time rather than passing locally and failing only in CI
