# Spec Delta

## Purpose

Keeps the record button's promise honest: it names the action the button performs and nothing else, independent of the auto-transcribe setting.

## ADDED Requirements

### Requirement: The record button names only recording

The record button SHALL be labelled with the localized word for "Record" and MUST NOT mention transcription, regardless of the auto-transcribe-after-recording setting.

#### Scenario: Default settings

- **WHEN** the main screen is shown with default settings
- **THEN** the record button reads "Записать" / "Record" and does not mention transcribing

#### Scenario: Auto-transcribe enabled

- **WHEN** the user enables automatic transcription after recording
- **THEN** the record button label stays "Записать" / "Record"

#### Scenario: Every shipped locale

- **WHEN** the application runs in any shipped locale
- **THEN** the record button label is translated and mentions only recording
