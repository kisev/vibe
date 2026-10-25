# model-catalog Specification

## Purpose

Gives users a bundled, benchmarked catalog of every downloadable model with honest provider and capability metadata, and one-click verified downloads from settings.

## Requirements

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

The models settings SHALL present one coherent flow: the catalog is the single list of models, with installed files highlighted and sorted first, the URL download and folder actions folded in. Separate selector, library, and installed-models groups SHALL not coexist with it.

#### Scenario: Installed entry in the catalog

- **WHEN** a downloaded model matches a catalog entry by file name
- **THEN** that entry's card is visually set apart, carries an installed marker, leads the list, and offers select/rename/reveal instead of a download for the installed quantization

#### Scenario: Installed file outside the catalog

- **WHEN** the models folder holds a file no catalog entry claims
- **THEN** it still appears above the catalog cards with select, rename, and reveal actions

#### Scenario: The active model

- **WHEN** an installed file is the selected model
- **THEN** its card is marked active and offers no duplicate select action

### Requirement: Limitations on the card

A catalog entry's limitations — single-language recognition without automatic language detection, no streaming, no translation — SHALL be shown on its card, not in a separate group.

#### Scenario: Reading a card

- **WHEN** an entry lacks streaming, translation, or automatic language detection across several languages
- **THEN** its card states those limitations inline

#### Scenario: Fully capable entry

- **WHEN** an entry streams, translates, and handles language detection
- **THEN** its card shows no limitation notes

### Requirement: Settings open on the full window

The settings sheet SHALL fill the app window, and the window SHALL open maximized while settings is visible, restoring the user's previous size on close — the catalog needs the room.

#### Scenario: Opening settings

- **WHEN** the user opens settings
- **THEN** the window maximizes (unless it already was) and the sheet fills it

#### Scenario: Closing settings

- **WHEN** the user closes settings and the window was not maximized before
- **THEN** the window returns to its previous size

### Requirement: Per-quant state and actions in the selector

The quantization selector SHALL show each quantization's install state and size, and SHALL offer the per-file action inline: a check when the file is on disk, a download button for a quant that is not, and a one-click delete for one that is (model files are re-downloadable assets). The model-level delete removes every downloaded copy of the entry after a confirm click. The active model is deletable like any other; the stale selection clears when the list refreshes.

#### Scenario: Acting on a quant in the selector

- **WHEN** the user downloads or deletes from a selector item
- **THEN** the action runs and the selection does not change

#### Scenario: Deleting a model

- **WHEN** the user confirms a delete on a card, or clicks delete on a quant item
- **THEN** the file is removed from disk and the list refreshes

#### Scenario: Deleting the active model

- **WHEN** the user deletes the model that is currently selected
- **THEN** the file is removed and the selection clears rather than the delete being blocked

### Requirement: Short language codes

The models settings SHALL show short language codes (`en`, `ru`) and SHALL collapse regional variants (`en-US`) to them in card metadata and the language filter.

#### Scenario: Regional variants

- **WHEN** an entry lists `en-US` and `en-GB`
- **THEN** the card and the filter show a single `en`

### Requirement: Custom provider filter

The provider filter SHALL include a Custom option that lists the manually downloaded files no catalog provider claims, and nothing else.

#### Scenario: Only custom models

- **WHEN** the user picks the Custom provider
- **THEN** the manual downloads are shown and the catalog entries are not

### Requirement: Card link to the provider page

Each catalog card SHALL link to the model's page on Hugging Face at the revision the catalog pins.

#### Scenario: Reading about a model

- **WHEN** the user opens a card's link
- **THEN** it opens the repository tree at the pinned revision

### Requirement: Filters never overlap the controls

The filter row SHALL lay out its controls with wrapping, and SHALL not place a label where the controls render.

#### Scenario: Narrow window

- **WHEN** the filter row has less width than its controls need
- **THEN** the controls wrap instead of overlapping

### Requirement: Download progress is attributed and stable

Every download SHALL register in a registry keyed by URL, and the shared progress toast SHALL show what is downloading — the file name, or the in-flight count when several run in parallel — with the latest-touched download's percentage. Progress events from the engine carry the URL so parallel downloads cannot overwrite each other's bar.

#### Scenario: Parallel downloads

- **WHEN** two downloads run at the same time
- **THEN** the toast names the latest-touched file and shows the in-flight count, and the percentage follows that file only

#### Scenario: Named download

- **WHEN** a download starts
- **THEN** the toast shows its file name instead of a generic label

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
