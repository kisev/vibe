# Spec Delta

## ADDED Requirements

### Requirement: The recording shows each source separately

While a recording runs, the app SHALL show the elapsed time and a level meter per captured source — microphone and system audio — labelled with the device in use, so a silent or misrouted source is visible during the call.

#### Scenario: Both sources produce sound

- **WHEN** a recording runs with microphone and system audio
- **THEN** both meters move independently and the elapsed time advances

#### Scenario: A source is silent or not opened

- **WHEN** one source records silence, or has not produced a single level yet, or its device fails to open
- **THEN** that source's meter stays flat and is marked as silent once a second has passed without sound, while the other keeps working

#### Scenario: A pause in speech

- **WHEN** a source falls quiet for a moment shorter than that second
- **THEN** no silent marker appears, so ordinary pauses between sentences do not flicker the label

#### Scenario: The browser chrome shows the same state

- **WHEN** the embedded browser is open during a recording
- **THEN** its chrome shows the recording indicator and both source levels, read from the same events as the main window

### Requirement: A long silence is escalated

A source that stays silent for the configured number of minutes — five by default, adjustable in the recording settings — SHALL be surfaced as an alert: the main window comes to the front and shows a message naming the silent source, so a wrong device is caught during the call.

#### Scenario: The configured silence window passes

- **WHEN** one source has been silent for as many minutes as the setting asks for while recording
- **THEN** the main window is focused and a message names that source, once per recording

#### Scenario: The window is shortened

- **WHEN** a person sets the silence warning to one minute
- **THEN** the alert fires after that minute, not after five
