# Spec Delta

## Purpose

Defines the fork's continuous build contract: when a dev build runs, which platforms it covers, where its sidecars come from, what it publishes, and what it must never depend on.

## ADDED Requirements

### Requirement: Build on every main push

The system SHALL start a dev build for every push to `main` and on manual dispatch, always building the revision that triggered it.

#### Scenario: Push to main

- **WHEN** a commit is pushed to `main`
- **THEN** a dev build starts for that commit

#### Scenario: Manual dispatch

- **WHEN** the workflow is started by hand
- **THEN** it builds the selected revision

#### Scenario: Other branches

- **WHEN** a commit is pushed to a branch other than `main`
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

### Requirement: Rolling dev release

The system SHALL publish the bundles of a run to one prerelease tagged `dev`, replacing the assets of the previous run, so a single URL always holds the newest build.

#### Scenario: First build

- **WHEN** no `dev` release exists
- **THEN** the build creates it as a prerelease and attaches the bundles

#### Scenario: Later builds

- **WHEN** a `dev` release already exists
- **THEN** the run replaces its assets with the new bundles

#### Scenario: Latest release unaffected

- **WHEN** the `dev` release exists
- **THEN** it does not become the repository's latest release

### Requirement: Independent platform jobs

A failure on one platform SHALL NOT stop the other platforms from building or publishing.

#### Scenario: One runner fails

- **WHEN** one platform fails to build
- **THEN** the remaining platforms still build and publish their bundles
