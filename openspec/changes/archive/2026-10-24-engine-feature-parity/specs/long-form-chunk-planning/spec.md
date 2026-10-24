# Spec Delta

## ADDED Requirements

### Requirement: Plans exist without diarization

When an engine with an input bound transcribes without a diarization model, the system SHALL still build a chunk plan from detected speech, so planned chunking, cache reuse, and resume apply to every bounded run; speaker attribution SHALL follow overlap matching as it does without a plan.

#### Scenario: Bounded engine without diarization

- **WHEN** a 40-minute recording is transcribed with a VAD model but no diarization model
- **THEN** a plan exists and every model input is within the engine's bound

#### Scenario: Cache works without diarization

- **WHEN** the same recording is transcribed twice with the cache root configured and no diarization model
- **THEN** the second run reuses the cached chunk results

#### Scenario: Whisper stays exempt

- **WHEN** a whisper model transcribes without a diarization model
- **THEN** audio is passed to the engine as one input and no external plan is built

### Requirement: Clients expose the input bound

The desktop UI SHALL let the user set the chunk duration for a transcription run within the maximum reported by model metadata, defaulting to the engine's limit when unset.

#### Scenario: Shorter chunks requested

- **WHEN** the user sets a chunk duration below the engine maximum and starts a transcription
- **THEN** the request carries that duration and every model input respects it

#### Scenario: Request above the maximum

- **WHEN** the user enters a chunk duration above the reported maximum
- **THEN** the UI prevents or rejects the value and names the allowed maximum

#### Scenario: Unset means the default

- **WHEN** the user leaves the control empty
- **THEN** the request carries no chunk duration and the engine default applies
