# Spec Delta

## MODIFIED Requirements

### Requirement: The site carries no upstream support surfaces

The website SHALL NOT show donation dialogs, supporter walls, funding links or other references to the original project's support channel. The privacy policy SHALL describe the local-only behaviour.

#### Scenario: Browsing the site

- **WHEN** the user visits any page
- **THEN** no Ko-fi dialog, link or supporters section is reachable

#### Scenario: Reading the privacy policy

- **WHEN** the user opens the privacy page
- **THEN** it states that no telemetry is collected and nothing is transmitted automatically
