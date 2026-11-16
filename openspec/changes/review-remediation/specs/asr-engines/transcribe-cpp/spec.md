# Spec Delta

## ADDED Requirements

### Requirement: Speaker ids are one-based along the whole path

Speaker ids emitted by every diarization engine SHALL be one-based by the time they reach the transcript, and a label SHALL NOT shift them again.

#### Scenario: Two speakers in one recording

- **WHEN** the planner reports speakers with ids 0 and 1
- **THEN** the transcript carries "Speaker 1" and "Speaker 2", and no two speakers share a label

### Requirement: An unsupported option carries its own error code

A request rejected for a reason other than the language SHALL NOT be reported as an unsupported language. Each rejection SHALL name the option it concerns.

#### Scenario: A text prompt for an engine without prompts

- **WHEN** a request supplies a text prompt to an engine that does not support prompts
- **THEN** the response fails with an option-level code and a message naming the prompt, not with `unsupported_language`
