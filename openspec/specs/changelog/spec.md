# changelog Specification

## Purpose

Defines how notable changes are collected between releases and how they surface — as the website changelog's leading entry while unreleased, and as the GitHub release notes at release time.

## Requirements

### Requirement: An unreleased entry in the changelog pipeline

Changes SHALL be collected in `i18n/changelog/unreleased.md` using the same frontmatter and `## New / Improved / Fixed` sections as released entries, updated as part of the changes that cause them rather than written at release time.

#### Scenario: A change lands

- **WHEN** a user-visible change is merged
- **THEN** the unreleased entry gains its bullet in the matching section

#### Scenario: Website shows the accumulation

- **WHEN** the changelog page renders and no version for the accumulated changes has been released
- **THEN** the unreleased entry appears above every released version

### Requirement: One source for release notes

At release time the unreleased entry SHALL become that version's entry — renamed to `<version>.md` with the release date — and the GitHub release body SHALL carry the same content, so the website changelog and the GitHub release never disagree.

#### Scenario: Cutting a release

- **WHEN** a version is released
- **THEN** the website shows the entry under the version, the GitHub release for the tag carries the same notes, and a fresh unreleased entry starts empty

#### Scenario: Translations

- **WHEN** a release cuts the entry
- **THEN** the locale files are translated and stamped through the existing `/translate` flow, falling back to English whole for locales that lag

### Requirement: Versions follow semver

Changelog entries SHALL be versioned per semantic versioning, and the unreleased entry SHALL display with a dev designation while no stable version claims it.

#### Scenario: Dev designation

- **WHEN** the unreleased entry renders on the website
- **THEN** it is labeled as the current dev line, not as a released version
