# Spec Delta

## Purpose

Gives users a bundled, benchmarked catalog of every downloadable model with honest provider and capability metadata, and one-click verified downloads from settings.

## ADDED Requirements

### Requirement: Bundled catalog with provider-qualified entries

The application SHALL bundle a model catalog combining the upstream handy catalog and a vibe-authored layer, and SHALL identify each entry by provider repository, revision, and file, so equally named models from different providers appear as distinct entries.

#### Scenario: Same model from two providers

- **WHEN** two providers publish files for the same model variant
- **THEN** the catalog lists both entries with their provider shown

#### Scenario: Catalog refresh

- **WHEN** the upstream catalog package publishes new or updated models
- **THEN** syncing the bundle is a data-only change with no code edits

### Requirement: Honest entry metadata

Each catalog card SHALL show the provider, the file size in megabytes, the supported languages, streaming and translation availability, and the published accuracy and speed benchmarks for the selected quantization.

#### Scenario: Card contents

- **WHEN** a catalog model with benchmarks is displayed
- **THEN** its card shows provider, size in MB, languages, streaming and translation badges, and accuracy/speed indicators for the chosen quantization

#### Scenario: Per-quantization size

- **WHEN** the user switches a model's quantization
- **THEN** the shown size and benchmarks update to that file's values

### Requirement: One-click verified downloads

The user SHALL be able to download any catalog model from the models settings, choose the quantization when several exist, and have every download verified against the catalog's size and SHA-256 before the model becomes selectable.

#### Scenario: Download from settings

- **WHEN** the user picks a catalog model and its quantization and starts the download
- **THEN** progress is shown and the finished file passes size and SHA-256 verification before appearing in the model list

#### Scenario: Integrity failure

- **WHEN** a downloaded catalog file fails its size or SHA-256 check
- **THEN** the download is reported as failed, the file is not offered as a model, and retrying is possible

### Requirement: Engine requirements are visible

A catalog model the installed engine cannot load SHALL still be listed, marked with the reason it is unavailable, and MUST NOT be downloadable into a state that pretends it will work.

#### Scenario: Model ahead of the engine

- **WHEN** a catalog entry requires an engine newer than the bundled one
- **THEN** the card states the engine requirement and download is disabled or warned

#### Scenario: Supported models are unaffected

- **WHEN** a catalog entry's family is supported by the installed engine
- **THEN** it downloads and becomes selectable as usual

### Requirement: Documentation follows the catalog

The models documentation SHALL be generated from the bundled catalog so the documented models, sizes, and download links match what the app offers.

#### Scenario: Docs and app agree

- **WHEN** the catalog changes and documentation is regenerated
- **THEN** the documented list of models, providers, sizes, and links equals the catalog's
