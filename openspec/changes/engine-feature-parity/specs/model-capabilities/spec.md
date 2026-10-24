# Spec Delta

## ADDED Requirements

### Requirement: Clients adapt by capabilities, not engine names

Clients SHALL derive model notes, limitations, and option visibility from reported capability flags and MUST NOT branch on the engine name, so two models with equal capabilities are presented identically.

#### Scenario: Equal capabilities render alike

- **WHEN** two models report the same capability flags but different engine names
- **THEN** both show the same limitation notes and the same available options

#### Scenario: No engine-name conditionals

- **WHEN** the desktop code renders model-dependent UI
- **THEN** no code path keys off an engine-name string
