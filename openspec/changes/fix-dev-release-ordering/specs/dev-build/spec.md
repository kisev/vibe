# Spec Delta

## MODIFIED Requirements

### Requirement: One release per commit

Each run SHALL publish its bundles to a prerelease tagged `dev.<run-number>`, where the run number grows monotonically, so later runs always sort above earlier ones on the releases page. The release name SHALL carry the application version with its `-dev.<short-commit>` suffix and the release body SHALL name the full commit SHA, so every build remains identifiable as a complete snapshot of one revision and never shares a release with another.

#### Scenario: New commit

- **WHEN** a run builds a commit that has no release yet
- **THEN** it creates the prerelease `dev.<run-number>` named with the commit's dev version and attaches the bundles

#### Scenario: Failed run

- **WHEN** a run fails to produce some platform bundles
- **THEN** no assets of that run land in a release of a different commit

#### Scenario: Re-run of a failed run

- **WHEN** a partially failed run is re-run
- **THEN** it reuses its own `dev.<run-number>` release and the five matrix jobs share it as before

#### Scenario: Later builds

- **WHEN** a later commit is built after an earlier one
- **THEN** the later commit's bundles go to their own release, which appears above the earlier one on the releases page, and the earlier releases keep their assets unchanged

#### Scenario: Commit identity survives the tag change

- **WHEN** a dev release is opened on the releases page
- **THEN** its name shows the dev version with the short commit and its body names the full SHA, so the built revision can be identified without the tag

#### Scenario: Latest release unaffected

- **WHEN** a dev release exists
- **THEN** it does not become the repository's latest release
