# Spec Delta

## ADDED Requirements

### Requirement: Nothing is transmitted off the device

The application SHALL NOT send telemetry, usage events, crash reports or analytics to any remote service, by default or otherwise. It SHALL carry no analytics SDK, endpoint or key.

#### Scenario: Running any feature

- **WHEN** the user transcribes, records, updates or browses
- **THEN** the app makes no analytics request; the only outbound traffic is what the feature itself needs (model download, update check, the page the user opened)

#### Scenario: Debugging

- **WHEN** the user needs support
- **THEN** logs and the diagnostics report are produced locally and leave only if the user shares them

### Requirement: Configuration carries no analytics

No build configuration, workflow or committed secret SHALL enable telemetry.

#### Scenario: A release build

- **WHEN** a release or dev build is produced
- **THEN** the build carries no analytics key and no code path that could send one
