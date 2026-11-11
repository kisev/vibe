# Spec Delta

## ADDED Requirements

### Requirement: Auxiliary model state is visible

Settings SHALL name the bundled speaker-separation model and its size and show whether it is installed, outside the transcription-model catalog: the catalog stays a chooser of models the engine can load, and this auxiliary file is not one. A missing model SHALL offer its verified download without leaving the page; an installed one SHALL offer reveal-in-folder.

#### Scenario: Model installed

- **WHEN** the speaker-separation model file is on disk and passes its integrity check
- **THEN** the Models page names the bundled model, shows its size and "Installed", and can reveal it in the folder

#### Scenario: Model missing

- **WHEN** the file is absent or fails its checks
- **THEN** the row offers the verified download, and a successful download reports the model installed without a restart

### Requirement: Superseded diarization artifacts are swept

When the current speaker-separation model is already on disk, startup SHALL remove the superseded diarization artifacts if any remain, instead of waiting for a replacement download that will never run.

#### Scenario: The current model predates the migration

- **WHEN** the current model is installed and legacy diarization files are still in the models folder
- **THEN** startup deletes the legacy files and leaves the current model untouched
