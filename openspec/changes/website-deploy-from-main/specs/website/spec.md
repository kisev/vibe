# Spec Delta

## ADDED Requirements

### Requirement: Only `main` deploys the public site

The Deploy Website workflow SHALL run for pushes to `main` that touch site inputs and for explicit manual dispatches, and SHALL NOT run because a release was published. A published release, including a dev tag, SHALL leave the site deployment untouched.

#### Scenario: A dev release is published

- **WHEN** a `dev.<n>` tag publishes a release
- **THEN** no Deploy Website run is created for that tag
- **AND** the site keeps serving the content deployed from `main`

#### Scenario: Site content lands on `main`

- **WHEN** a commit touching `website/**` or `i18n/**` is pushed to `main`
- **THEN** the site is built and deployed from that commit

#### Scenario: Someone needs a deployment without a push

- **WHEN** the workflow is dispatched manually
- **THEN** it builds and deploys the selected ref, subject to the `github-pages` environment's branch policy
