# settings-ui Specification

## Purpose

Presents the settings surfaces so every value the user needs — including long build identifiers — is fully readable, selectable and copyable.

## Requirements

### Requirement: A long version is fully readable

The Settings version row SHALL show the complete version string, wrapping or breaking rather than truncating, and the value SHALL be selectable so it can be copied into a bug report.

#### Scenario: A local build's version

- **WHEN** the version is `1.0.0-local.20261113.e3d2b9d7`
- **THEN** the whole string is visible without horizontal clipping at the narrowest supported window width
