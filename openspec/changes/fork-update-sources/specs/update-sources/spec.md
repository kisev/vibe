# Spec Delta

## Purpose

Keeps every self-update, download, and documentation entry point of the fork build inside the fork's own infrastructure, while stating what intentionally still points at the upstream project.

## ADDED Requirements

### Requirement: Updates come from the fork

The application SHALL check for updates only at the fork's releases channel, and SHALL verify update signatures only against the fork's updater public key, so an upstream release is never offered to a fork build.

#### Scenario: Update check

- **WHEN** a fork build checks for updates
- **THEN** the request goes to the fork's `latest.json` and no upstream release is offered

#### Scenario: Signature trust

- **WHEN** the fork publishes a signed release and the build offers it
- **THEN** the signature verifies against the fork's public key bundled in the build

### Requirement: Fork releases are signed

The fork's release workflow SHALL produce updater artifacts signed with the fork's private updater key, so every published release can be installed and updated by fork builds.

#### Scenario: Release run

- **WHEN** the release workflow completes for a new version
- **THEN** it publishes `latest.json` with signatures made by the fork's key

#### Scenario: Fork build updates itself

- **WHEN** a fork build older than the newest fork release checks for updates
- **THEN** the update installs successfully and keeps the application identifier

### Requirement: Functional links point at the fork

The application's About and repository link, issue tracker, bug report (with diagnostics attached), changelog and "What's new" target, models documentation, and phone-pairing page SHALL all use the fork's origins.

#### Scenario: About and repository

- **WHEN** the user opens the About or repository entry point
- **THEN** the fork's repository and website open

#### Scenario: Bug report

- **WHEN** the user sends a bug report from the application
- **THEN** it opens an issue on the fork with the diagnostics included

#### Scenario: What's new

- **WHEN** the user opens "What's new" from settings
- **THEN** the fork's changelog page opens, at the current version when it exists

#### Scenario: Phone pairing

- **WHEN** the user opens phone pairing
- **THEN** the QR code and deep link point at the fork-hosted phone page

### Requirement: Dev sidecar comes from the fork

Development tooling SHALL download published `vibe-server` sidecars from the fork's `server-v*` releases only, and MUST NOT fall back to the upstream repository.

#### Scenario: Dev build fetches the sidecar

- **WHEN** a development workflow or task runner downloads the pinned `vibe-server` build
- **THEN** the asset is fetched from the fork's `server-v*` release named by `.server-version`

#### Scenario: Missing server release

- **WHEN** `.server-version` names a release that does not exist in the fork
- **THEN** the fetch fails with a clear error instead of fetching upstream

### Requirement: The application identifier is preserved

The application identifier and reverse domain SHALL remain the upstream ones, so existing installations keep their settings, stored data, deep links, and OS-level identity across an update to a fork build.

#### Scenario: Fresh fork build

- **WHEN** a fork build is packaged for any platform
- **THEN** its identifier equals the upstream identifier

#### Scenario: Existing installation keeps its data

- **WHEN** an existing installation is replaced by a fork build of the same version line
- **THEN** settings, transcripts, and model files remain in place and are picked up unchanged

### Requirement: Upstream credit links stay upstream

Donation and community-chat entry points SHALL continue to point at the upstream project, so support for the original author is not diverted by the fork.

#### Scenario: Support and community links

- **WHEN** the user opens the donation or community-chat entry point
- **THEN** the upstream project's pages open
