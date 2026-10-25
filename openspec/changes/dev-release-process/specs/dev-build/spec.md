# Spec Delta

## REMOVED Requirements

### Requirement: Build on every main push

**Reason:** Dev builds should be on demand, not one per commit; the maintainer decides when a build is worth five platform jobs.

**Migration:** Replaced by "Build on dev tags" below. Pushing to `main` no longer builds; a build now needs an explicit `dev.<number>` tag or a manual dispatch.

## ADDED Requirements

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
