# Spec Delta

## ADDED Requirements

### Requirement: The dev entry is translated like every release

The unreleased entry SHALL exist in every website locale as `i18n/changelog/<locale>/unreleased.md`, carrying the same `source` stamp contract as a released entry, and the audit SHALL report a locale without it.

#### Scenario: A reader switches to another language on /changelog/dev

- **WHEN** the dev changelog page renders in a website locale
- **THEN** the unreleased entry is shown in that locale, not in English

#### Scenario: A translation is missing

- **WHEN** a website locale has no `unreleased.md`
- **THEN** `task i18n:audit` warns about it and the page falls back to English whole
