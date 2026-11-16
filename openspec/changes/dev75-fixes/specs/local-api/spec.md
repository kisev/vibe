# Spec Delta

## ADDED Requirements

### Requirement: The API server switch is an intent

The switch in the Agents section SHALL persist the user's choice and SHALL reflect it after a restart. Nothing SHALL start the local API server at application launch unless that choice is on, and a model load performed for transcription SHALL NOT turn the switch on.

#### Scenario: Off across a restart

- **WHEN** the user turns the API server off and restarts Vibe
- **THEN** the server is not running and the switch reads off

#### Scenario: Transcription without the API

- **WHEN** the intent is off and the user transcribes a file
- **THEN** the switch stays off

#### Scenario: On across a restart

- **WHEN** the user turns the API server on and restarts Vibe
- **THEN** the server starts and the switch reads running
