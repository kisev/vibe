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
