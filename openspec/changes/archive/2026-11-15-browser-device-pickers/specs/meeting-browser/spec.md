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

### Requirement: The pickers render above the page

The chrome's device pickers SHALL show their options completely, drawn by the platform where a popup inside the 104-pixel chrome would be clipped by the page webview below it.

#### Scenario: Opening a picker

- **WHEN** the user opens the microphone or output picker in the chrome
- **THEN** every device in the list is visible and selectable, not cut off at the toolbar's edge
