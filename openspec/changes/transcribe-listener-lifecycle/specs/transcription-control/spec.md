# Spec Delta

## ADDED Requirements

### Requirement: An abort listener lives exactly as long as its transcription

A transcription SHALL register its abort listener, use it for the life of that command, and remove it when the command ends, whether it succeeds, fails or returns early. A finished transcription SHALL leave no listener behind.

#### Scenario: A completed transcription

- **WHEN** a transcription finishes and returns its transcript
- **THEN** its abort listener is removed and a later abort event reaches only the running command, if any

#### Scenario: A failed transcription

- **WHEN** a transcription returns an error before or during the upload
- **THEN** its abort listener is removed just the same

#### Scenario: Abort during preprocessing

- **WHEN** the user aborts while the audio is being preprocessed
- **THEN** that abort is honoured after preprocessing returns, and no listener outlives the command
