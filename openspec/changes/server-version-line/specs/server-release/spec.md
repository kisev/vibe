# Spec Delta

## ADDED Requirements

### Requirement: The server has its own version line

Server releases SHALL be numbered independently of upstream and of the desktop app, starting from `1.0.0`, and tagged `server-v<version>`. A version SHALL only be pinned in `.server-version` once the release that carries it exists.

#### Scenario: The first release of the fork's server line

- **WHEN** the server is released for the first time under this rule
- **THEN** its tag is `server-v1.0.0`, and `.server-version` names it afterwards

#### Scenario: Bumping ahead of the release

- **WHEN** the crate version is raised for an upcoming release
- **THEN** `.server-version` keeps the last published tag until that release exists, so builds never point at a missing release
