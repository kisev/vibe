# docs Specification

## Purpose

Repository documentation is organized by Diátaxis, so each page either teaches a first success, instructs a task, states facts, or explains a decision — never several at once — and every page describes the tree as it is.

## Requirements

### Requirement: Every page has one Diátaxis purpose

`docs/` SHALL contain exactly four content folders — `tutorials/`, `how-to/`, `reference/`, `explanation/` — plus `docs/README.md`. Each page SHALL live in the folder matching its dominant purpose and SHALL NOT carry a second purpose as a section.

#### Scenario: Classifying a page

- **WHEN** a page teaches a first success to a newcomer
- **THEN** it is a tutorial in `docs/tutorials/`

#### Scenario: A task instruction

- **WHEN** a page tells a reader how to accomplish a specific task
- **THEN** it is a how-to in `docs/how-to/`

#### Scenario: Facts and tables

- **WHEN** a page lists facts, defaults, paths, flags, or manifests that a reader looks up
- **THEN** it is reference in `docs/reference/`

#### Scenario: A design decision

- **WHEN** a page explains why the system works this way and what the trade-offs are
- **THEN** it is explanation in `docs/explanation/`

#### Scenario: A mixed page

- **WHEN** an existing page mixes purposes
- **THEN** it is split into one page per purpose instead of being copied whole

### Requirement: The docs map is the entry point

`docs/README.md` SHALL list every documentation page under its category and SHALL state what each category is for.

#### Scenario: Finding a page

- **WHEN** a reader opens `docs/README.md`
- **THEN** every page under `docs/tutorials/`, `docs/how-to/`, `docs/reference/`, and `docs/explanation/` is listed with a link and a one-line description

#### Scenario: Adding a page

- **WHEN** a new documentation page is added
- **THEN** it is placed in the category folder and added to the map in the same change

### Requirement: Docs describe the current tree

Documented commands, paths, versions, defaults, and workflows SHALL be verified against `taskfile.yml`, `scripts/`, and `.github/workflows/` rather than carried over from an older state. Documentation for removed features SHALL be deleted.

#### Scenario: A command is documented

- **WHEN** a page names a `task` target, a script, a path, or a workflow input
- **THEN** the target, script, path, or input exists in the tree and does what the page says

#### Scenario: A removed feature is described

- **WHEN** a page describes a feature, workflow, or surface that the tree no longer has
- **THEN** the text is removed instead of being kept with a caveat

#### Scenario: Upstream-facing surfaces

- **WHEN** a page mentions telemetry, donations, or the upstream release flow
- **THEN** it reflects the fork's current local-only behaviour or omits the topic

### Requirement: Links resolve

Every relative link between documentation pages and every inbound link from the repository SHALL point at an existing file.

#### Scenario: Moving a page

- **WHEN** a page moves to a Diátaxis folder
- **THEN** every reference to its old path is updated in the same change

#### Scenario: Checking links

- **WHEN** the repository is searched for `docs/<path>.md` references
- **THEN** every target exists

### Requirement: Site docs follow the same split

The `/docs` pages served from `i18n/docs/<locale>/` SHALL be reorganized into the same four purposes, with the page list in `website/src/lib/docs.ts` and the navigation updated to match, and the English source translated through the existing content i18n flow.

#### Scenario: The site docs navigation

- **WHEN** a reader opens `/docs`
- **THEN** the navigation groups pages as tutorials, how-to, reference, or explanation instead of the current flat install/models pair

#### Scenario: Translations

- **WHEN** the English site pages change
- **THEN** the locale catalogs are regenerated or revised and `task i18n:audit` passes
