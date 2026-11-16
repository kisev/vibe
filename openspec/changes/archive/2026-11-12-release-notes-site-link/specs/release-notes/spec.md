# Spec Delta

## ADDED Requirements

### Requirement: Stable and candidate bodies link to the translated changelog

Every stable or candidate release body SHALL carry the line `Read this changelog in your language: https://kisev.github.io/vibe/changelog/<version>` naming the version being released, and SHALL keep the English notes inline as the source language.

#### Scenario: A stable release is promoted

- **WHEN** the maintainer assembles the body for version `1.1.0` and promotes it
- **THEN** the body starts with the link line for `https://kisev.github.io/vibe/changelog/1.1.0` and carries the English entry below it

#### Scenario: A candidate release

- **WHEN** a release candidate `1.1.0-rc.1` is promoted
- **THEN** the link line names `https://kisev.github.io/vibe/changelog/1.1.0-rc.1`

### Requirement: Body assembly uses the versioned entry

The body assembly SHALL read that version's `i18n/changelog/<version>.md` body unchanged and SHALL fail, naming the expected path, when the entry is missing or has no body.

#### Scenario: Missing entry

- **WHEN** the body is assembled for a version without `i18n/changelog/<version>.md`
- **THEN** the assembly fails with the expected path named and writes no body

### Requirement: Dev bodies keep the dev alias

Dev release bodies SHALL keep pointing at the dev alias `https://kisev.github.io/vibe/changelog/dev`, never at a versioned dev path.

#### Scenario: A dev build

- **WHEN** a dev build publishes
- **THEN** its body carries `Read the latest dev notes` linking to `https://kisev.github.io/vibe/changelog/dev` and no versioned dev path
