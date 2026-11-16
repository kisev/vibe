# Spec Delta

## ADDED Requirements

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
