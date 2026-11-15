# Spec Delta

## ADDED Requirements

### Requirement: Roadmap entries follow the chosen language

Each roadmap entry SHALL be shown in the site locale when `i18n/roadmap/<locale>.json` has that change name, and in English otherwise. The entry's identity (change name) SHALL NOT be translated.

#### Scenario: A translated entry

- **WHEN** the roadmap renders in a locale whose translation file names the change
- **THEN** the card shows that locale's title and summary

#### Scenario: A change without a translation yet

- **WHEN** the locale's file has no entry for a change
- **THEN** the card shows the English title and summary rather than an empty card

#### Scenario: A new change appears on the roadmap

- **WHEN** a proposal is added to `openspec/changes/`
- **THEN** the roadmap shows it (English until translated) without a hand edit
