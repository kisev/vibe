# Spec Delta

## ADDED Requirements

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
