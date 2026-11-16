# Spec Delta

## ADDED Requirements

### Requirement: The desktop UI is exercised without a native build

The repository SHALL run a Playwright suite against the app in browser mode with the mock Tauri layer, and a CI job SHALL run that suite on desktop changes.

#### Scenario: A UI regression

- **WHEN** a change breaks a React surface covered by the suite
- **THEN** the E2E job fails before a dev build is cut

#### Scenario: Local run

- **WHEN** an agent runs the suite on a host that cannot download Playwright's browser
- **THEN** `PLAYWRIGHT_CHROMIUM_PATH` points it at the system Chromium
