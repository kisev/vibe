# audio-processing Specification

## Purpose

Makes the audio-processing settings do what they say: loudness normalization and a custom ffmpeg command are applied to the audio before the engine sees it, the original file is never modified, and with both settings off nothing is added.

## Requirements

### Requirement: The audio-processing settings are applied

A transcription started from the desktop SHALL apply the saved audio-processing settings before the file is sent to the engine: `normalize_loudness` applies loudness normalization, and a custom command appends its arguments. With both off, the file SHALL be sent unchanged. Queued transcriptions and comparison runs SHALL apply the same settings; phone handoff recordings are transcribed as they arrive and SHALL NOT be preprocessed.

#### Scenario: Normalization on

- **WHEN** a transcription runs with loudness normalization enabled
- **THEN** the engine receives a normalized copy of the audio, and the original file is untouched

#### Scenario: Both off

- **WHEN** normalization is off and no custom command is set
- **THEN** no preprocessing runs and the file is sent as it is

#### Scenario: A failed preprocessing

- **WHEN** ffmpeg fails or its output is missing
- **THEN** the transcription fails with ffmpeg's own message rather than transcribing the original silently

#### Scenario: Temporary files

- **WHEN** a transcription finishes or fails
- **THEN** the processed temporary copy is removed
