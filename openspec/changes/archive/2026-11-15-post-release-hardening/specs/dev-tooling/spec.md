# Spec Delta

## ADDED Requirements

### Requirement: The local gate and CI call the same targets

Every CI step that corresponds to a task target SHALL call that target, and `task verify` SHALL run every deterministic, locally-runnable job a push or pull request triggers. The transcribe spike stays CI-only: it downloads a model, runs a real inference, and installs the Vulkan SDK on a two-platform matrix, so it is not a deterministic local gate.

#### Scenario: Rust formatting in CI

- **WHEN** the lint workflows check formatting or clippy
- **THEN** they run `task rust:fmt-check` / `task rust:clippy`, not a raw cargo command

#### Scenario: A site change breaks the build

- **WHEN** the website build or the site tests would fail
- **THEN** `task verify` fails locally before the push

#### Scenario: The E2E suite's inputs change

- **WHEN** a translation catalog, `scripts/ci/e2e.sh` or `taskfile.yml` changes
- **THEN** the E2E workflow runs
