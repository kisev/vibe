# release-notes Specification

## Purpose

Every published release carries notes a user can read in their own language: the GitHub release body names the version and links to its translated changelog entry on the site, while the English notes stay inline as the source.

## Requirements

### Requirement: Stable and candidate bodies link to the translated changelog

Every stable or candidate release body SHALL carry the line `Read this changelog in your language: https://kisev.github.io/vibe/changelog/<version>` naming the version being released, and SHALL keep the English notes inline as the source language. Promotion SHALL rebuild the body with `task release:notes` before editing the release.

#### Scenario: A stable release is promoted

- **WHEN** the maintainer assembles the body for version `1.1.0` and promotes it
- **THEN** the body starts with the link line for `https://kisev.github.io/vibe/changelog/1.1.0` and carries the English entry below it

#### Scenario: A candidate release

- **WHEN** a release candidate `1.1.0-rc.1` is promoted
- **THEN** the link line names `https://kisev.github.io/vibe/changelog/1.1.0-rc.1`

#### Scenario: Promotion uses the notes task

- **WHEN** a prerelease is promoted to a stable release
- **THEN** the promoting run reaches `task release:notes` before `gh release edit`, so a hand-edited or link-only body cannot be published as stable

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

### Requirement: The notes task refuses unusable input

`task release:notes` SHALL fail, naming the file, when the version's changelog entry is missing, has malformed frontmatter, or when the version is a prerelease other than `-rc.<n>`.

#### Scenario: A malformed entry

- **WHEN** `i18n/changelog/<version>.md` has frontmatter that does not parse
- **THEN** the notes task exits non-zero and names the file

#### Scenario: A prerelease the pipeline would reject

- **WHEN** the version carries a marker other than `-rc.<n>` (for example `-beta.1`)
- **THEN** the notes task refuses it instead of assembling a body the build would never publish
