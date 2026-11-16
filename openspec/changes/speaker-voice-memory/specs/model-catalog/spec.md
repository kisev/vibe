# Spec Delta

## ADDED Requirements

### Requirement: The auxiliary voice model is visible

Settings SHALL name the bundled speaker-embedding model used by voice profiles, together with its size and installed/missing state, next to the speaker-separation model. A missing embedding model SHALL offer its verified download; an installed one SHALL offer reveal-in-folder. The model SHALL remain outside the transcription-model catalog.

#### Scenario: Embedding model installed

- **WHEN** the speaker-embedding model file is on disk and passes its integrity check
- **THEN** the speaker-separation settings name it with its size and "Installed", and can reveal it in the folder

#### Scenario: Embedding model missing

- **WHEN** the file is absent or fails its checks
- **THEN** the row offers the verified download, and a successful download reports the model installed without a restart
