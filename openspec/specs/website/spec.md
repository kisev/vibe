# website Specification

## Purpose

How the public site is built and deployed: which refs may publish it, what a release event does, and whether the phone handoff is part of the artifact.

## Requirements

### Requirement: Only `main` deploys the public site

The Deploy Website workflow SHALL run for pushes to `main` that touch site inputs and for explicit manual dispatches, and SHALL NOT run because of a release or a `dev` push. A run on a ref other than `main` SHALL fail instead of reporting a skipped deploy as a success. The release site SHALL be built from `main`; the dev preview SHALL be built from the `dev` tree inside that deploy.

#### Scenario: A dev release is published

- **WHEN** a `dev.<n>` tag publishes a release
- **THEN** no Deploy Website run is created for that tag
- **AND** the site keeps serving the content deployed from `main`

#### Scenario: Site content lands on `main`

- **WHEN** a commit touching `website/**` or `i18n/**` is pushed to `main`
- **THEN** the site is built and deployed from that commit

#### Scenario: A dev push starts no deploy

- **WHEN** a commit touching site inputs is pushed to `dev`
- **THEN** no Deploy Website run is created for that push
- **AND** the dev preview under `/vibe/dev/` updates on the next deploy from `main`

#### Scenario: A dispatch on another ref fails

- **WHEN** the workflow is dispatched on a ref other than `main`
- **THEN** the guard job fails and no deploy is reported as successful

#### Scenario: Someone needs a deployment without a push

- **WHEN** the workflow is dispatched manually on `main`
- **THEN** it builds and deploys the release site and the current dev preview

### Requirement: The phone handoff is optional

The site SHALL publish without `/phone/` when the release line (`main`) does not ship `handoff/`, and SHALL include it when it does. The rest of the site SHALL deploy whether or not the phone job runs.

#### Scenario: The release line has no handoff

- **WHEN** `main` does not contain `handoff/`
- **THEN** the phone job is skipped and the site is built and deployed without `/phone/`

#### Scenario: The release line ships the handoff

- **WHEN** `main` contains `handoff/`
- **THEN** the phone PWA is built and deployed with the site

### Requirement: The site publishes a dev twin from dev

The deployed site SHALL serve the production build at `/vibe/` and a build of `dev` at `/vibe/dev/`, published together by one deploy. The dev build SHALL use hash routing so every dev route stays within its own base, and SHALL identify itself as a development preview.

#### Scenario: A dev change reaches the dev site

- **WHEN** a website change lands on `dev`
- **THEN** the next deploy from `main`, or a manual dispatch, publishes the production site from `main` and the dev site from `dev` together

#### Scenario: A dev deep link

- **WHEN** the dev site is opened at `/vibe/dev/#/roadmap`
- **THEN** the dev app renders its roadmap inside the dev base, without falling back to the production app

#### Scenario: A dev page that keeps its own anchor state

- **WHEN** the dev preview opens a documentation page or a swept `-dev.` changelog version
- **THEN** its navigation stays inside `/vibe/dev/#/` and the address bar is never rewritten to a path outside the dev base

#### Scenario: The production site is unaffected

- **WHEN** the production site is opened at `/vibe/roadmap`
- **THEN** its path routing, language switch and 404 fallback behave exactly as before

### Requirement: The site carries no upstream support surfaces

The website SHALL NOT show donation dialogs, supporter walls, funding links or other references to the original project's support channel. The privacy policy SHALL describe the local-only behaviour.

#### Scenario: Browsing the site

- **WHEN** the user visits any page
- **THEN** no Ko-fi dialog, link or supporters section is reachable

#### Scenario: Reading the privacy policy

- **WHEN** the user opens the privacy page
- **THEN** it states that no telemetry is collected and nothing is transmitted automatically
