# website Specification

## Purpose

How the public site is built and deployed: which refs may publish it, what a release event does, and whether the phone handoff is part of the artifact.

## Requirements

### Requirement: Only `main` deploys the public site

The Deploy Website workflow SHALL run for pushes to `main` that touch site inputs, for pushes to `dev` that refresh the preview, and for explicit manual dispatches, and SHALL NOT run because a release was published. The release site SHALL be built only from `main`; a `dev` push SHALL only refresh `/vibe/dev/`. A published release, including a dev tag, SHALL leave the site deployment untouched.

#### Scenario: A dev release is published

- **WHEN** a `dev.<n>` tag publishes a release
- **THEN** no Deploy Website run is created for that tag
- **AND** the site keeps serving the content deployed from `main`

#### Scenario: Site content lands on `main`

- **WHEN** a commit touching `website/**` or `i18n/**` is pushed to `main`
- **THEN** the site is built and deployed from that commit

#### Scenario: A dev push refreshes only the preview

- **WHEN** a commit touching site inputs is pushed to `dev`
- **THEN** the dev preview under `/vibe/dev/` is rebuilt from `dev`
- **AND** the release site under `/vibe/` still comes from `main`

#### Scenario: Someone needs a deployment without a push

- **WHEN** the workflow is dispatched manually
- **THEN** it builds and deploys the selected ref, subject to the `github-pages` environment's branch policy

### Requirement: The phone handoff is optional

The site SHALL publish without `/phone/` when the checked-out branch does not ship `handoff/`, and SHALL include it when the branch does. The rest of the site SHALL deploy whether or not the phone job runs.

#### Scenario: The checked-out branch has no handoff

- **WHEN** the branch being deployed does not contain `handoff/`
- **THEN** the phone job is skipped and the site is built and deployed without `/phone/`

#### Scenario: The branch ships the handoff

- **WHEN** the branch being deployed contains `handoff/`
- **THEN** the phone PWA is built and deployed with the site
