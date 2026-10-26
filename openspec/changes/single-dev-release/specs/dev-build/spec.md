# Spec Delta

## Purpose

The releases page shows one dev prerelease — the latest complete build — while the ever-incrementing `dev.*` tags carry the full history.

## RENAMED Requirements

- FROM: `One release per commit`
- TO: `One dev release at a time`

## MODIFIED Requirements

### Requirement: One release per commit

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

## ADDED Requirements

### Requirement: Stable releases are untouchable

The dev-release cleanup SHALL consider only prereleases whose tag matches `dev.*`; stable releases SHALL never be selected, deleted, or modified by it.

#### Scenario: Stable releases are untouchable

- **WHEN** the cleanup deletes dev releases
- **THEN** stable releases and their assets are not considered or modified
