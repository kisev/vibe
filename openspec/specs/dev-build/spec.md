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

### Requirement: One release per commit

Each run SHALL publish its bundles to a prerelease tagged `dev.<run-number>`, where the run number grows monotonically, so later runs always sort above earlier ones on the releases page. The release name SHALL carry the application version with its `-dev.<short-commit>` suffix and the release body SHALL name the full commit SHA, so every build remains identifiable as a complete snapshot of one revision and never shares a release with another.

#### Scenario: New commit

- **WHEN** a run builds a commit that has no release yet
- **THEN** it creates the prerelease `dev.<run-number>` named with the commit's dev version and attaches the bundles

#### Scenario: Failed run

- **WHEN** a run fails to produce some platform bundles
- **THEN** no assets of that run land in a release of a different commit

#### Scenario: Re-run of a failed run

- **WHEN** a partially failed run is re-run
- **THEN** it reuses its own `dev.<run-number>` release and the five matrix jobs share it as before

#### Scenario: Later builds

- **WHEN** a later commit is built after an earlier one
- **THEN** the later commit's bundles go to their own release, which appears above the earlier one on the releases page, and the earlier releases keep their assets unchanged

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
