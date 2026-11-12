# Spec Delta

## MODIFIED Requirements

### Requirement: The dev changelog shows the dev line

`/changelog/dev` SHALL render the notes of the newest dev release, and SHALL fall back to the stable release only when no dev release exists. The Unreleased heading and the dev entry title SHALL be translated like every other page label.

#### Scenario: A dev build was published

- **WHEN** the newest release is a `-dev.N` prerelease with notes
- **THEN** `/changelog/dev` shows those notes, not the newest stable release

#### Scenario: No dev release yet

- **WHEN** no dev prerelease exists
- **THEN** the page shows the newest release with the existing fallback notice

#### Scenario: Another language

- **WHEN** the site language is Russian
- **THEN** the Unreleased heading and the dev entry title are Russian, not `Unreleased` / `What's next`
