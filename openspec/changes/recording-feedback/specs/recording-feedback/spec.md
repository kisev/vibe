# Spec Delta

## ADDED Requirements

### Requirement: The recording shows each source separately

While a recording runs, the app SHALL show the elapsed time and a level meter per captured source — microphone and system audio — labelled with the device in use, so a silent or misrouted source is visible during the call.

#### Scenario: Both sources produce sound

- **WHEN** a recording runs with microphone and system audio
- **THEN** both meters move independently and the elapsed time advances

#### Scenario: A source is silent or not opened

- **WHEN** one source records silence or its device fails to open
- **THEN** that source's meter stays flat and is marked as silent, while the other keeps working

#### Scenario: The browser chrome shows the same state

- **WHEN** the embedded browser is open during a recording
- **THEN** its chrome shows the recording indicator and both source levels, read from the same events as the main window
