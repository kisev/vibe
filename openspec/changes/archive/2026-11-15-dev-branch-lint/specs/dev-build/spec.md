# Spec Delta

## ADDED Requirements

### Requirement: A dev revision is validated before it is tagged

The Lint workflow SHALL be startable for any branch through `workflow_dispatch`, and a `dev.<n>` tag SHALL only point at a revision whose Lint dispatch finished green. Validating a dev revision SHALL NOT require a commit on `main`.

#### Scenario: Customizing a dev build

- **WHEN** the dev branch holds the changes intended for the next dev build
- **THEN** `gh workflow run lint.yml --ref dev` lints that exact revision
- **AND** the tag is cut only after that run is green

#### Scenario: A red dev lint

- **WHEN** the dispatched Lint run on the dev revision fails
- **THEN** the failure is fixed on `dev` and Lint is dispatched again
- **AND** no tag is created for the red revision

#### Scenario: A commit needs to be on the release line

- **WHEN** a commit must exist on `main` for a technical reason
- **THEN** its main push still triggers Lint as before

### Requirement: Lint compiles the platform-specific code a release builds

A green Lint run SHALL cover the compile gates of every platform a release builds on, not only the Linux one: the desktop crate SHALL be type-checked on macOS as well, and the Windows-only link of the native-stack helper SHALL be exercised on Windows. A platform whose code compiles nowhere but that platform's own job belongs in Lint.

#### Scenario: A macOS-only block stops compiling

- **WHEN** a change breaks a code path only the macOS build compiles
- **THEN** the dispatched Lint run fails in its macOS job
- **AND** no `dev.<n>` tag is cut for that revision

#### Scenario: The tag tooling refuses an unverified revision

- **WHEN** `task dev:tag` runs on a commit with no green Lint run
- **THEN** it stops before creating the tag and names the dispatch that is missing
- **AND** a green run for a different commit does not satisfy it
