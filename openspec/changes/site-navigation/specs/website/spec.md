# Spec Delta

## ADDED Requirements

### Requirement: The header carries the site's navigation

Every site section SHALL be reachable from the header at every viewport width: at phone width the header SHALL present its links through a collapsed menu rather than hiding them. The footer SHALL NOT repeat those links.

#### Scenario: A visitor on a phone

- **WHEN** a visitor opens any page at phone width
- **THEN** the header offers features, docs, changelog, roadmap and the download entry
- **AND** the footer repeats none of them

#### Scenario: A section is added

- **WHEN** a new site section is introduced
- **THEN** its link is added in the header's entry list only, and the footer needs no change
