# Spec Delta

## Purpose

Gives the user explicit control over update checks and the update channel, and makes the dev channel a self-updating line with signed artifacts.

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

### Requirement: The user chooses the channel

The application SHALL offer a persisted channel choice between Release and Dev, SHALL show which channel is active, and SHALL check the new channel as soon as the choice changes.

#### Scenario: Switching to Dev

- **WHEN** the user selects Dev
- **THEN** the app checks the dev feed immediately and the choice survives a restart

#### Scenario: Switching back to Release

- **WHEN** a dev install selects Release
- **THEN** the app checks the release feed and offers the next stable release normally

### Requirement: Dev builds update themselves

Dev releases SHALL publish updater artifacts signed with the fork's updater key, and the website SHALL serve a dev channel manifest naming the newest complete dev build. A dev install on the Dev channel SHALL be offered and able to install the next dev build in-app.

#### Scenario: The next dev build ships

- **WHEN** a newer dev build is published while the app runs a dev build on the Dev channel
- **THEN** the in-app check offers it, and installing keeps settings and the application identifier

#### Scenario: A release install on the Dev channel

- **WHEN** a 1.0.0 release install selects the Dev channel
- **THEN** no dev build below 1.0.0 is offered, and the surface explains that moving to the dev line needs one manual install

### Requirement: Both channels are signed

Every artifact offered on either channel SHALL verify against the fork's updater public key; a manifest or artifact that fails verification SHALL be refused and SHALL never be installed.

#### Scenario: Tampered manifest

- **WHEN** a channel manifest fails signature verification
- **THEN** the app reports the failure and keeps the installed version
