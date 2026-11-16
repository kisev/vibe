# Spec Delta

## Purpose

What Vibe gives a person who needs to report a problem — evidence they can inspect and choose to share — and what it deliberately never collects, since the app sends nothing anywhere by itself.

## ADDED Requirements

### Requirement: A report can carry evidence the person chose to share

The app SHALL offer one action that assembles a debug archive: the current log, the settings with secrets removed, the application and server versions, the platform, and a digest of the model catalog. It SHALL list what the archive will contain before writing it, and SHALL reveal the finished file in the platform's file manager. The app SHALL NOT transmit the archive anywhere.

#### Scenario: A person prepares a report

- **WHEN** the person runs the action
- **THEN** the app lists the contents, writes one archive, and reveals it

#### Scenario: Secrets stay out

- **WHEN** the settings file carries an API key, a pairing token or a stored credential
- **THEN** the archive holds the key's presence, never its value

#### Scenario: The person's media stays out

- **WHEN** the archive is assembled
- **THEN** it contains no audio, video or transcript file and no path pointing at the person's own media beyond what a log already recorded

#### Scenario: Nothing leaves without consent

- **WHEN** the archive is ready
- **THEN** it stays on disk until the person attaches it to a report themselves
