# Spec Delta

## ADDED Requirements

### Requirement: The browser chooses its recording devices

The browser chrome SHALL let the user pick the microphone and the output device for the recording it starts, showing the current selection, sharing that selection with the main window, and disabling the pickers while a recording runs.

#### Scenario: Changing the microphone from the browser

- **WHEN** the user picks another microphone in the browser chrome
- **THEN** the next recording started from the browser uses it, and the main window shows the same selection

#### Scenario: Recording in progress

- **WHEN** a recording runs
- **THEN** the pickers are disabled and name the devices being recorded
