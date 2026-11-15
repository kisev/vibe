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

### Requirement: Dev changelog links never break

Any changelog link naming a dev version, or the dev alias, SHALL render the current dev-line entry (the unreleased entry) rather than an unknown-version state. When no dev entry is available, the link SHALL render the newest released entry with a notice explaining that no dev notes exist. Stable versioned links SHALL keep resolving to their own entries.

#### Scenario: A link to a cleaned dev release

- **WHEN** a link names a dev version whose release was cleaned up
- **THEN** the changelog shows the current dev-line entry at the dev alias

#### Scenario: The dev alias

- **WHEN** the user opens the dev changelog alias
- **THEN** the current dev-line entry renders, labeled as the dev line

#### Scenario: No dev entry

- **WHEN** the dev entry is empty or missing
- **THEN** the newest released entry renders with a notice that the dev notes are unavailable

#### Scenario: A stable version link

- **WHEN** a link names a stable version
- **THEN** that version's entry renders exactly as before
