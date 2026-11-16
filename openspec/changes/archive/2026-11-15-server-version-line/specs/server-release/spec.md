# Spec Delta

## Purpose

Defines how the server is versioned and published: its own release line, independent of the app and of upstream, and the rule that consumers pin only to a complete published release.

## ADDED Requirements

### Requirement: The server has its own version line

Server releases SHALL be numbered independently of upstream and of the desktop app, starting from `1.0.0`, and tagged `server-v<version>`. A version SHALL only be pinned in `.server-version` once the release that carries it exists and every platform asset it publishes is present.

#### Scenario: The first release of the fork's server line

- **WHEN** the server is released for the first time under this rule
- **THEN** its tag is `server-v1.0.0`, and `.server-version` names the first release of the line whose assets are all present — `server-v1.0.2` in this fork, because `server-v1.0.0` and `server-v1.0.1` shipped incomplete

#### Scenario: Bumping ahead of the release

- **WHEN** the crate version is raised for an upcoming release
- **THEN** `.server-version` keeps the last published tag until that release exists, so builds never point at a missing release

#### Scenario: A release finishes with assets missing

- **WHEN** a tagged release finishes with one or more platform assets missing
- **THEN** `.server-version` stays on the previous complete release, and the packaging fix ships as the next release of the line
