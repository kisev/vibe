# Spec Delta

## ADDED Requirements

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
