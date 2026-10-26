# Spec Delta

## Purpose

Infrastructure failures heal themselves: platform-killed jobs are re-run without a human, and no workflow that compiles the server ships without its build prerequisites again.

## ADDED Requirements

### Requirement: Infra-killed jobs are re-run automatically

The repository SHALL automatically re-run the failed jobs of the Dev Build and Deploy Website workflows when a run finishes failed or cancelled, at most until the run reaches its third attempt. The janitor SHALL use only the built-in token and preinstalled tooling, and SHALL NOT touch runs of workflows whose failures mean broken content (Lint).

#### Scenario: A macOS cell is killed by the platform

- **WHEN** a Dev Build or Deploy Website run ends failed or cancelled because a runner was killed by infrastructure
- **THEN** within the janitor's next sweep its failed jobs are re-run, with no human action, and a completed re-run finishes the release or deployment it belonged to

#### Scenario: The attempt cap holds

- **WHEN** a run has already been attempted three times
- **THEN** the janitor leaves it red for a human instead of re-running it again

#### Scenario: Content failures are not retried

- **WHEN** the Lint workflow fails
- **THEN** the janitor does not re-run it

### Requirement: Build prerequisites travel with every server-compiling workflow

Every workflow that compiles the server from the tree — dev build, server release, transcribe spike, and lint — SHALL install the Vulkan build toolchain (headers, loader, glslc) on its Linux runners before building, and the Vulkan SDK on Windows runners where the server links the loader.

#### Scenario: Lint compiles the engine

- **WHEN** the lint workflow runs `server:clippy`, which compiles the engine with `GGML_VULKAN=ON`
- **THEN** the Vulkan packages are already installed and clippy configures cleanly

#### Scenario: A new workflow builds the server

- **WHEN** a future workflow compiles the server from the tree
- **THEN** it carries the same prerequisite steps, or it fails visibly at configure time rather than passing locally and failing only in CI
