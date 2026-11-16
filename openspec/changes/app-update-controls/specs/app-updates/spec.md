# Spec Delta

## Purpose

Gives the user explicit control over update checks and the update channel, and makes each of the three lines — Release, Beta, Dev — a self-updating, signed feed with one stated source.

## ADDED Requirements

### Requirement: Updates can be checked explicitly

Settings SHALL show the current version, a "Check for updates" action, the time of the last check, and the outcome of the check. The action SHALL report checking, up to date, an available update with its version and notes, download progress, installing, and failure, without leaving the settings surface.

#### Scenario: Check with nothing new

- **WHEN** the user checks for updates and the installed version is current
- **THEN** the surface reports that it is up to date and when it checked

#### Scenario: Check with an update

- **WHEN** the chosen channel offers a newer version
- **THEN** the surface shows its version and notes with a download/install action and progress

#### Scenario: Check fails

- **WHEN** the manifest cannot be fetched or fails verification
- **THEN** the surface reports the failure and the app keeps running on the installed version

### Requirement: Three channels, one source each

The application SHALL offer a persisted choice among Release, Beta and Dev, SHALL show which channel is active, and SHALL check the chosen channel as soon as the choice changes. Each channel SHALL have exactly one source. Release is `vX.Y.Z` tags on `main`; Beta is `vX.Y.Z-rc.<n>` tags on `main`, published as prereleases; Dev is `dev.<n>` tags on the `dev` branch.

#### Scenario: Switching channels

- **WHEN** the user selects another channel
- **THEN** the app checks that channel's feed immediately and the choice survives a restart

#### Scenario: A tag feeds only its channel

- **WHEN** a release, beta or dev build is published
- **THEN** it is tagged by its channel's rule and named by only that channel's manifest

### Requirement: Channel switching only moves forward

The membrane between channels SHALL be semver, with no comparator overrides. Beta candidates SHALL use the `-rc.<n>` suffix, because semver orders `-dev.N` below `-rc.N` below the stable version; the upstream `-beta.<n>` spelling is not reused. Switching from Dev to Beta to Release therefore always moves forward.

#### Scenario: Release to Dev

- **WHEN** a release install selects Dev
- **THEN** no `X.Y.Z-dev.N` is offered, and the surface explains that moving to the dev line takes one manual install

#### Scenario: Dev to Release

- **WHEN** a dev install selects Release
- **THEN** the next stable release is offered normally

### Requirement: Beta is the release-candidate line

Beta SHALL carry release candidates of the next stable, cut from `main`, and SHALL never be behind Release. Publishing `X.Y.Z` SHALL move beta to `X.Y.Z`, so a beta install ends on the stable release.

#### Scenario: Release candidate

- **WHEN** `v1.1.0-rc.1` is published
- **THEN** a Beta install is offered `1.1.0-rc.1` and a Release install is not

#### Scenario: Promotion

- **WHEN** `v1.1.0` is published
- **THEN** a Beta install is offered `1.1.0` and installs it normally

### Requirement: Dev builds update themselves

Dev releases SHALL publish updater artifacts signed with the fork's updater key, and the website SHALL serve a dev channel manifest naming the newest complete dev build. A dev install on the Dev channel SHALL be offered and able to install the next dev build in-app.

#### Scenario: The next dev build ships

- **WHEN** a newer dev build is published while the app runs a dev build on the Dev channel
- **THEN** the in-app check offers it, and installing keeps settings and the application identifier

### Requirement: Every channel is signed

Every artifact offered on any channel SHALL verify against the fork's updater public key; a manifest or artifact that fails verification SHALL be refused and SHALL never be installed.

#### Scenario: Tampered manifest

- **WHEN** a channel manifest fails signature verification
- **THEN** the app reports the failure and keeps the installed version
