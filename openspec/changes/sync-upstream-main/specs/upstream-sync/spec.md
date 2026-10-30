# Spec Delta

## Purpose

The fork tracks upstream's main while carrying its own identity: a sync must bring upstream's forward motion without letting any of it silently overwrite what the fork exists to keep.

## ADDED Requirements

### Requirement: Upstream integrations preserve fork identity

Integrating upstream main SHALL leave every fork-owned behavior intact afterward: update endpoints point at the fork's releases, the installer registers the fork's Add/Remove-Programs identity, the single-dev-release scheme and its tags remain the release history, and the CI janitor still heals red runs. Upstream equivalents of these mechanisms SHALL be adapted to the fork's targets, not adopted verbatim.

#### Scenario: Post-sync fork surface

- **WHEN** a merge of upstream main lands in the fork's main
- **THEN** the updater names a fork endpoint, `winget upgrade` stays quiet about the fork install, a pushed dev tag publishes under the one-dev-release scheme, and the janitor workflow exists unchanged in triggers

### Requirement: Syncs are validated end to end before landing

An upstream integration SHALL land in main only after the desktop and server test suites pass on the merge result and a dev build of that result publishes green; the model-loading behaviors the window touched are exercised on that build, not assumed from the merge being conflict-free.

#### Scenario: Diarization after a model-family switch

- **WHEN** an integration adopts an upstream change to the diarization model family
- **THEN** a transcription on the merge result's dev build produces speaker labels from the new model before the merge lands

### Requirement: Upstream model switches extend the legacy migration list

When an upstream integration replaces the artifact of an enhancement model the fork shipped, the artifacts the fork previously downloaded SHALL be added to the legacy cleanup list, so installed forks that carry them are offered the new model by the standing startup migration instead of pointing at a dead file.

#### Scenario: Sortformer users after the Nemotron adoption

- **WHEN** the fork adopts upstream's diarization model replacement and a user's models folder holds the previously shipped diarization artifacts
- **THEN** the next start offers the new model download, and on success the old artifacts are removed by the existing guarded cleanup
