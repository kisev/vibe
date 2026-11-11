# Spec Delta

## Purpose

A live assistant that reads the running transcript and periodically offers what the conversation is about and how the user might respond, using a provider the user explicitly chose.

## ADDED Requirements

### Requirement: Hints during a recording

While a recording runs with the assistant enabled, the application SHALL derive hints from the transcript produced so far and show them in the recording view, refreshing as new speech arrives. The assistant SHALL NOT alter the recording, the transcript, or the configured transcription options.

#### Scenario: A meeting in progress

- **WHEN** a recording is running with the assistant on and speech is being transcribed
- **THEN** the panel shows the current topic and a suggested reply, refreshed as the conversation continues

#### Scenario: Silence

- **WHEN** no new speech has been transcribed since the last refresh
- **THEN** no provider request is made and the previous hints stay visible

### Requirement: The user chooses the provider

The application SHALL let the user pick the assistant provider explicitly: the Anthropic API, an OpenAI-compatible endpoint identified by base URL and model, or a configured CLI executable (`claude`, `codex`, `opencode`, or a custom command). The assistant SHALL NOT start a session without a configured provider.

#### Scenario: Local endpoint

- **WHEN** the provider is an OpenAI-compatible local endpoint
- **THEN** hints are produced without any network call leaving the machine

#### Scenario: CLI adapter

- **WHEN** the provider is a CLI executable
- **THEN** the assistant runs that executable with the prompt on stdin and a timeout, and a hanging process is terminated without blocking the recording

#### Scenario: No provider

- **WHEN** the assistant is enabled with no provider configured
- **THEN** the panel explains what to configure and no requests are made

### Requirement: Only text is disclosed, to the chosen provider

Audio SHALL never leave the device for the assistant. Only transcript text SHALL be sent, only to the selected provider, and the session SHALL state whether that provider is local or remote.

#### Scenario: Remote provider disclosure

- **WHEN** the selected provider is a remote endpoint
- **THEN** the panel states that transcript text is sent to it, and a local provider keeps everything on the device

### Requirement: Bounded cadence and cancellation

Requests SHALL be throttled by a minimum interval and a minimum amount of new speech, with at most one request in flight; a response that arrives after a newer request has started SHALL be discarded. Stopping the recording SHALL cancel the in-flight request.

#### Scenario: Fast speech

- **WHEN** the transcript grows quickly
- **THEN** at most one hint request is in flight and refreshes respect the minimum interval

#### Scenario: Recording stops

- **WHEN** the user stops the recording
- **THEN** the in-flight assistant request is cancelled and no further hints are requested

### Requirement: Failures stay out of the recording

A provider error, timeout, or malformed answer SHALL be shown as a quiet assistant-level notice and SHALL NOT stop the recording, the transcription, or the ability to start another session.

#### Scenario: Provider unreachable

- **WHEN** the provider fails mid-session
- **THEN** the panel shows the failure and the recording continues unaffected
