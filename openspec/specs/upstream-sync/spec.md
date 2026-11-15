# upstream-sync Specification

## Purpose

The fork tracks upstream's main while carrying its own identity: a sync must bring upstream's forward motion without letting any of it silently overwrite what the fork exists to keep.

## Requirements

### Requirement: Upstream integrations preserve fork identity

Integrating upstream main SHALL leave every fork-owned behavior intact afterward: update endpoints point at the fork's releases, the installer registers the fork's Add/Remove-Programs identity, the single-dev-release scheme and its tags remain the release history, and the CI janitor still heals red runs. Upstream equivalents of these mechanisms SHALL be adapted to the fork's targets, not adopted verbatim.

#### Scenario: Post-sync fork surface

- **WHEN** a merge of upstream main lands in the fork's main
- **THEN** the updater names a fork endpoint, `winget upgrade` stays quiet about the fork install, a pushed dev tag publishes under the one-dev-release scheme, and the janitor workflow exists unchanged in triggers

### Requirement: Syncs are validated end to end before landing

An upstream integration SHALL land in main only after the desktop and server test suites pass on the merge result and a dev build of that result publishes green; the model-loading behaviors the window touched are exercised on that build, not assumed from the merge being conflict-free.

#### Scenario: Diarization after a model-family switch

- **WHEN** an integration adopts an upstream change to the diarization model family
- **THEN** a transcription on a dev build of the integration's result produces speaker labels from the new model — for every stage that lands, since a staged integration validates the model behaviors that stage touches

### Requirement: Upstream model switches extend the legacy migration list

When an upstream integration replaces the artifact of an enhancement model the fork shipped, the artifacts the fork previously downloaded SHALL be added to the legacy cleanup list, so installed forks that carry them are offered the new model by the standing startup migration instead of pointing at a dead file.

#### Scenario: Sortformer users after the Nemotron adoption

- **WHEN** the fork adopts upstream's diarization model replacement and a user's models folder holds the previously shipped diarization artifacts
- **THEN** the next start offers the new model download, and on success the old artifacts are removed by the existing guarded cleanup

### Requirement: Fetching upstream never writes fork tags

Fetching upstream SHALL update remote branches only and SHALL leave every ref under `refs/tags` unchanged, whatever the fork's own tag history contains. The fetch SHALL succeed when upstream and the fork share a tag name with different targets.

#### Scenario: A tag name owned by both sides

- **WHEN** upstream and the fork both have `v1.0.0` pointing at different commits, and upstream is fetched
- **THEN** the fetch succeeds, `refs/remotes/upstream/main` moves forward, and the fork's `refs/tags/v1.0.0` is untouched

#### Scenario: The machine's global fetch settings argue otherwise

- **WHEN** the global git config sets `fetch.forcetags` or `fetch.prunetags`
- **THEN** the repository's upstream refspec still wins and no tag is written or pruned

### Requirement: Upstream tags are readable under their own namespace

When upstream tags are needed for comparison, they SHALL be fetched into `refs/upstream-tags/*` rather than `refs/tags/*`, and SHALL never be pushed to any remote.

#### Scenario: Comparing a release with its upstream origin

- **WHEN** the user runs the upstream-tags task
- **THEN** upstream tags appear under `refs/upstream-tags/` and can be diffed, while `git tag` lists only the fork's tags

### Requirement: The isolation is reproducible from the repository

The remote configuration that isolates upstream tags SHALL be applicable through a repository task and documented, so a fresh clone or another machine reaches the same working state without re-discovering the failure.

#### Scenario: A fresh checkout

- **WHEN** a new clone runs the setup task and then fetches upstream
- **THEN** the fetch succeeds and no upstream tag reaches `refs/tags`
