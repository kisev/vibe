# Spec Delta

## MODIFIED Requirements

### Requirement: The site shows planned work as planned

The site SHALL serve a Roadmap page at `/roadmap`, reachable from the header navigation at every viewport width — including the collapsed menu at phone width — listing each generated entry's title and why, with a visible statement that the entries are planned rather than shipped and that the list comes from the repository's OpenSpec changes.

#### Scenario: A visitor opens the roadmap

- **WHEN** the visitor navigates to `/roadmap`
- **THEN** the page renders every entry from `roadmap.json` and the "planned, not shipped" note

#### Scenario: A visitor on a phone

- **WHEN** the visitor is at phone width and opens the header's collapsed menu
- **THEN** the roadmap entry is there, and reaching it does not require the footer

#### Scenario: The list cannot be loaded

- **WHEN** `roadmap.json` is missing or unreadable
- **THEN** the page says so through a localized message instead of rendering an empty page silently
