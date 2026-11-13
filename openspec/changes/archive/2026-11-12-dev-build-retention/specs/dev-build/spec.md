# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: One dev release at a time`
- TO: `### Requirement: Dev releases are pruned with bounded retention`

## MODIFIED Requirements

### Requirement: Dev releases are pruned with bounded retention

The dev sweep SHALL be bounded retention: the newest five dev prereleases survive, every dev prerelease created within the last 24 hours survives, and only releases created before the running dev build started are considered at all.

#### Scenario: A normal green run

- **WHEN** a dev run completes and prunes older releases
- **THEN** the newest five dev releases stay, and so does anything published in the last 24 hours

#### Scenario: A late-healed older run

- **WHEN** an older dev run finishes after a newer one
- **THEN** it never deletes a release created after it started, so the build a newer run is filling survives

#### Scenario: New commit

- **WHEN** a run builds a commit that has no release yet
- **THEN** it creates the prerelease `dev.<n>` — `<n>` is the tag number, not the Actions run number — named with the commit's dev version and attaches the bundles

#### Scenario: Failed run

- **WHEN** a run fails to produce some platform bundles
- **THEN** no assets of that run land in a release of a different commit, and the previous complete release is not deleted

#### Scenario: Re-run of a failed run

- **WHEN** a partially failed run is re-run
- **THEN** it reuses its own `dev.<n>` release, the five matrix jobs share it as before, and the cleanup runs when the run completes

#### Scenario: Later builds

- **WHEN** a later commit is built and completes
- **THEN** earlier dev releases outside the retention window are deleted while their `dev.<n>` tags stay, so tag numbers keep growing monotonically and the deleted build stays identifiable in history

#### Scenario: Commit identity survives the tag change

- **WHEN** a dev release is opened on the releases page
- **THEN** its name shows the dev version with the short commit and its body names the full SHA, so the built revision can be identified without the tag

#### Scenario: Latest release unaffected

- **WHEN** a dev release exists
- **THEN** it does not become the repository's latest release

#### Scenario: Stable releases

- **WHEN** the sweep runs
- **THEN** no stable release is touched
