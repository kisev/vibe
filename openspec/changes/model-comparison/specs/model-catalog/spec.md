# Spec Delta

## Purpose

Cards describe what a model is and what it can do, not how someone else scored it: the published benchmark indicators come off the cards, and users judge quality with the on-page comparison lab instead.

## MODIFIED Requirements

### Requirement: Honest entry metadata

Each catalog card SHALL show the provider, the file size in megabytes, the supported languages, and streaming and translation availability for the selected quantization. Parameter counts and published accuracy/speed benchmark scores are not shown on cards — parameter counts read as a second, confusing size, and third-party benchmarks say nothing about the user's audio and hardware, which the comparison lab measures directly.

#### Scenario: Filtering the catalog

- **WHEN** the user filters by streaming, translation, language, or provider, or searches by name
- **THEN** only matching entries are shown, and an empty result states that nothing matches

#### Scenario: Card contents

- **WHEN** a catalog model is displayed
- **THEN** its card shows provider, size in MB, languages, and streaming and translation badges for the chosen quantization, and no benchmark score bars

#### Scenario: Per-quantization size

- **WHEN** the user switches a model's quantization
- **THEN** the shown size updates to that file's value
