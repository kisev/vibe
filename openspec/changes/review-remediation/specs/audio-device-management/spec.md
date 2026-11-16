# Spec Delta

## ADDED Requirements

### Requirement: An explicit no-device choice is a stored value

The application SHALL distinguish "nothing stored" from "no device chosen". A stored empty device name SHALL mean the user chose not to record a source, and SHALL NOT resolve to the system default device.

#### Scenario: The picker's "None" survives a restart

- **WHEN** a user selects "None" as the input device and restarts the app
- **THEN** the picker shows "None" and the recording starts without that source, rather than with the system default

#### Scenario: Nothing stored

- **WHEN** no device has ever been stored
- **THEN** the default device is offered, and choosing "None" from then on is stored as an explicit choice

### Requirement: A hidden device stays selectable

A device hidden from the pickers SHALL still be usable when it is the stored selection, and the surface that hides it SHALL name it.

#### Scenario: The stored device is later hidden

- **WHEN** the device in use is hidden from the picker
- **THEN** it remains the active device, and the hidden section shows it as the current selection
