# Spec Delta

## Purpose

The public site describes this fork rather than the upstream project, and its roadmap is derived from the repository's own OpenSpec proposals so it cannot drift from what is actually planned.

## ADDED Requirements

### Requirement: The roadmap is generated from unarchived changes

`scripts/roadmap.py` SHALL read `openspec/changes/*/proposal.md`, skip the `archive` directory, and write `website/public/roadmap.json` as a JSON array sorted by change name. Each entry SHALL carry the change name, a title derived from the proposal's H1 or the prettified change name, and the first sentence of the `## Why` section with Markdown removed. The output SHALL be byte-identical for identical input. A change without a readable proposal or `## Why` section SHALL fail the run with a message naming the file.

#### Scenario: Two active changes and an archive

- **WHEN** the changes directory holds two active proposals and an `archive/` tree
- **THEN** the output contains exactly the two active changes, ordered by name, and no archived one

#### Scenario: Malformed proposal

- **WHEN** an active change has no `proposal.md`, or its proposal has no `## Why` text
- **THEN** the generator exits non-zero and names the offending path instead of writing a partial roadmap

#### Scenario: Build wiring

- **WHEN** the website is built with `website/website.chore`
- **THEN** `roadmap.json` is written into `website/public/` before `pnpm build`

### Requirement: The site shows planned work as planned

The site SHALL serve a Roadmap page at `/roadmap`, reachable from the header navigation, listing each generated entry's title and why, with a visible statement that the entries are planned rather than shipped and that the list comes from the repository's OpenSpec changes.

#### Scenario: A visitor opens the roadmap

- **WHEN** the visitor navigates to `/roadmap`
- **THEN** the page renders every entry from `roadmap.json` and the "planned, not shipped" note

#### Scenario: The list cannot be loaded

- **WHEN** `roadmap.json` is missing or unreadable
- **THEN** the page says so through a localized message instead of rendering an empty page silently

### Requirement: The feature list describes this fork

The Features page SHALL describe the capabilities this fork actually ships, derived from the desktop settings surfaces and message catalogs: the model comparison lab, the Release/Beta/Dev update channels, the embedded meeting browser, the local API with agent skills, phone handoff, the site language selector, and local-only privacy, alongside the still-present transcription features.

#### Scenario: A reader scans the features

- **WHEN** the Features page renders
- **THEN** every card names a capability present in the app or site, and no card promises an upstream-only surface

### Requirement: New copy is catalog-backed

Every new visible string SHALL come from `i18n/website/en-US.json`. Other website locales SHALL fall back to English for keys they do not yet carry, and no page or component SHALL contain hardcoded visible prose.

#### Scenario: A non-English locale before translation

- **WHEN** the site renders in a locale that lacks the new keys
- **THEN** the new copy appears in English and the existing coverage guard still passes
