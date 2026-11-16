# Spec Delta

## Purpose

The contract between Vibe's desktop app and its local server: which request fields the server honours, which fields it answers with, and how the app behaves against a server that predates a field.

## ADDED Requirements

### Requirement: The load response reports residency

The server's model-load response SHALL state whether the model was already resident or was loaded for this request, as an explicit value rather than a hint in another field.

#### Scenario: The model is already warm

- **WHEN** the desktop asks to load a model the server already holds
- **THEN** the response says it was already resident and no second load happens

#### Scenario: A cold load

- **WHEN** the model is not loaded yet
- **THEN** the response says it was loaded for this request

#### Scenario: A field the server does not know

- **WHEN** a desktop newer than the server sends a request with an unknown field
- **THEN** the server ignores it, and the desktop treats the missing answer as unknown
