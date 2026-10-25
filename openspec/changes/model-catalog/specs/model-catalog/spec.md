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

Each catalog card SHALL show the provider, the file size in megabytes, the supported languages, streaming and translation availability, and the published accuracy and speed benchmarks for the selected quantization. Parameter counts are not shown on cards — they read as a second, confusing size.

#### Scenario: Filtering the catalog

- **WHEN** the user filters by streaming, translation, language, or provider, or searches by name
- **THEN** only matching entries are shown, and an empty result states that nothing matches

#### Scenario: Card contents

- **WHEN** a catalog model with benchmarks is displayed
- **THEN** its card shows provider, size in MB, languages, streaming and translation badges, and accuracy/speed indicators for the chosen quantization

#### Scenario: Per-quantization size

- **WHEN** the user switches a model's quantization
- **THEN** the shown size and benchmarks update to that file's values

### Requirement: One model surface

The models settings SHALL present one coherent flow: installed models as cards carrying the same metadata the catalog shows (matched by file name), the catalog as the way to add models, and the URL download folded into the catalog section. A separate model selector and a separate "model library" group SHALL not coexist with it.

#### Scenario: Installed card metadata

- **WHEN** a downloaded model matches a catalog entry by file name
- **THEN** its card shows that entry's badges and accuracy/speed bars

### Requirement: One-click verified downloads

The user SHALL be able to download any catalog model from the models settings, choose the quantization when several exist, and have every download verified against the catalog's size and SHA-256 before the model becomes selectable.

#### Scenario: Download from settings

- **WHEN** the user picks a catalog model and its quantization and starts the download
- **THEN** progress is shown and the finished file passes size and SHA-256 verification before appearing in the model list

#### Scenario: Integrity failure

- **WHEN** a downloaded catalog file fails its size or SHA-256 check
- **THEN** the download is reported as failed, the file is not offered as a model, and retrying is possible

### Requirement: The catalog lists only models the engine can load

The catalog SHALL show only entries the bundled engine can load, and files in
containers the engine refuses (the legacy whisper `.bin`) SHALL not appear as
catalog entries at all. A future entry whose family needs a newer engine than
bundled is filtered the same way — the settings catalog is a chooser of things
that work here, not an archive.

#### Scenario: Legacy container

- **WHEN** the vibe layer knows a legacy `.bin` file

- **THEN** it is absent from the settings catalog and from the generated docs

#### Scenario: Supported models are unaffected

- **WHEN** a catalog entry's family is supported by the installed engine
- **THEN** it downloads and becomes selectable as usual

### Requirement: Documentation follows the catalog

The models documentation SHALL be generated from the bundled catalog so the documented models, sizes, and download links match what the app offers.

#### Scenario: Docs and app agree

- **WHEN** the catalog changes and documentation is regenerated
- **THEN** the documented list of models, providers, sizes, and links equals the catalog's
