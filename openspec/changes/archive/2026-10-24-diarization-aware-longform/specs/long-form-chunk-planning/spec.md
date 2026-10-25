# Spec Delta

## Purpose

Defines how a long recording is divided into model inputs so that each input stays within the engine's limit and, when diarization is available, contains one speaker's speech.

## ADDED Requirements

### Requirement: Diarization-guided chunks

When a diarization model is supplied, the system SHALL derive a chunk plan from diarization turns and SHALL assign each chunk the set of speakers active in it, so that a chunk never merges two speakers' speech except at an explicitly marked uncertain boundary.

#### Scenario: Single-speaker turn

- **WHEN** a turn contains only speaker 1 and fits within the input bound
- **THEN** one chunk is produced whose speaker set is exactly speaker 1

#### Scenario: Overlapping speakers

- **WHEN** diarization reports overlapping speech from speakers 1 and 2 over part of a turn
- **THEN** the affected chunk carries the speaker set containing both identifiers

#### Scenario: No diarization model

- **WHEN** transcription runs without a diarization model
- **THEN** the plan is built from speech pauses only and speakers remain assigned by overlap matching as before

### Requirement: Engine input bound

The system MUST NOT send a model more than its declared maximum input duration. The bound SHALL be configurable per request and SHALL default to the engine's documented limit.

#### Scenario: GigaAM bound

- **WHEN** a GigaAM model processes a 40-minute recording with the default setting
- **THEN** every model input is at most about 25 seconds

#### Scenario: Custom bound

- **WHEN** a request sets a chunk duration smaller than the engine bound
- **THEN** every chunk respects the smaller value

#### Scenario: Bound larger than the engine allows

- **WHEN** a request sets a chunk duration larger than the engine's maximum
- **THEN** the request fails with a validation error naming the allowed maximum

### Requirement: Maximum input is discoverable

The system SHALL report each engine's maximum input duration through model metadata so that clients can validate a requested chunk duration before starting a run.

#### Scenario: Metadata reports the bound

- **WHEN** metadata is requested for a GigaAM model
- **THEN** the response reports a maximum input duration of about 25 seconds

#### Scenario: Client validation

- **WHEN** a client requests a chunk duration above the reported maximum
- **THEN** the request is rejected before any audio is processed

### Requirement: Pause-aware cuts

When a turn exceeds the bound, the system SHALL prefer cutting inside a detected pause nearest the preferred chunk length, adding configured padding, and SHALL cut at the bound only when no usable pause exists.

#### Scenario: Pause near the target

- **WHEN** a long turn contains a pause near the preferred length
- **THEN** the chunk boundary falls inside that pause

#### Scenario: Uninterrupted speech

- **WHEN** a long turn contains no usable pause
- **THEN** the chunk is cut at the bound and the run still completes

#### Scenario: Padding

- **WHEN** a chunk boundary is placed in a pause
- **THEN** the model input includes the configured padding without exceeding the input bound

### Requirement: Speaker propagation to segments

Every transcript segment produced from a planned chunk SHALL carry the chunk's speaker set, with a single identifier for a single-speaker chunk and multiple identifiers only for an uncertain boundary.

#### Scenario: Segment speakers

- **WHEN** a chunk with speaker set {1} produces three segments
- **THEN** all three segments carry speaker 1

#### Scenario: Boundary chunk

- **WHEN** a chunk carries speaker set {1, 2}
- **THEN** its segments are marked as ambiguous rather than attributed to one speaker

### Requirement: Plan determinism

Given the same audio, model, diarization result, and options, the system SHALL produce the same chunk plan.

#### Scenario: Repeated planning

- **WHEN** the same request is executed twice
- **THEN** both runs produce identical chunk boundaries and speaker sets

### Requirement: Whisper keeps its long-form path

Whisper models SHALL continue to use their internal long-form decoding and SHALL NOT be split by the planner, because their output depends on internal segmentation and prompt context.

#### Scenario: Whisper with diarization

- **WHEN** a whisper model is transcribed with diarization enabled
- **THEN** audio is passed to the engine as it is today and speakers are attached by overlap as before
