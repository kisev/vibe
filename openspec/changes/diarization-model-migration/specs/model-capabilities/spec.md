# Spec Delta

## Purpose

A persisted enhancement preference survives engine changes only if what it points at still exists: the app revalidates it at startup and migrates the artifact, instead of letting requests silently drop the feature.

## ADDED Requirements

### Requirement: Enhancement-model migrations revalidate persisted preferences

The app SHALL, at startup, revalidate a persisted enhancement-model preference against the file it references: when the file is missing because the artifact changed format, the app SHALL offer to download the replacement exactly once, keep the preference enabled on success and remove the superseded files, and disable the preference with a visible notice when the download is declined or fails. The migration SHALL be idempotent: a startup that finds the current model usable does nothing.

#### Scenario: Speaker detection enabled with the superseded model

- **WHEN** the app starts with speaker detection enabled and the current diarization model file is not usable while the preference predates the model-format change
- **THEN** the app offers to download the replacement, and on acceptance speaker detection keeps working with no further user action

#### Scenario: Declining the migration

- **WHEN** the download offer is declined or fails
- **THEN** speaker detection is disabled and the user is told why, rather than requests silently producing transcripts without speakers

#### Scenario: Cleanup of superseded artifacts

- **WHEN** the replacement model downloads successfully
- **THEN** the superseded diarization files are removed from the models folder, and their absence never marks the migration as pending again

#### Scenario: Nothing to migrate

- **WHEN** the app starts with speaker detection disabled or the current model already on disk
- **THEN** no dialog appears and no files change
