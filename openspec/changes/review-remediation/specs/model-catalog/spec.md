# Spec Delta

## ADDED Requirements

### Requirement: The model in use cannot be deleted from the catalog

The catalog SHALL NOT offer to delete the files of the active model, and the delete command SHALL refuse any path outside the models folder.

#### Scenario: The active model's card

- **WHEN** a card belongs to the active model
- **THEN** its delete action is unavailable, and the reason is shown on the control

#### Scenario: A path outside the models folder

- **WHEN** a delete request names a file whose parent is not the models folder
- **THEN** the command refuses it, whatever the file's extension

### Requirement: A failed download is reported as a failure

A download that does not finish SHALL be reported to the caller that waited for it, so a setup or settings flow does not continue as if the model were installed.

#### Scenario: The model download fails during setup

- **WHEN** the model or the VAD download fails
- **THEN** the flow stops with an error at the point the user is looking at, and does not proceed to the next step
