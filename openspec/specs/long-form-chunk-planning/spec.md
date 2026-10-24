# long-form-chunk-planning Specification

## Purpose

Defines how a long recording is divided into model inputs so that each input stays within the engine's limit and, when diarization is available, contains one speaker's speech.

## Requirements

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

### Requirement: Unattributed speech is transcribed

When speech detection reports speech that no diarization turn covers, the planner SHALL keep that range in the plan as its own chunk with an empty speaker set, so a planned run transcribes every detected speech range instead of silently dropping the ones diarization missed.

#### Scenario: Speech between turns

- **WHEN** diarization reports turns at 0–4 s and 10–14 s, and speech detection reports speech at 5–9 s that no turn covers
- **THEN** the plan contains a chunk covering 5–9 s with no speakers

#### Scenario: Segments from an unattributed chunk

- **WHEN** a chunk carries no speaker set
- **THEN** its segments carry no planned speaker set and speakers are attributed by overlap as they are without a plan

#### Scenario: Only detected speech is planned

- **WHEN** the range between two turns contains no detected speech
- **THEN** no chunk is created for it

### Requirement: Dominant speaker for a boundary chunk

When a chunk's speaker set holds more than one identifier, the segment's singular `speaker` SHALL name the speaker whose diarization turns cover the largest share of the chunk's core, and the lowest identifier when shares tie; `speakers` SHALL keep the full set. A single-speaker chunk names that speaker in both fields.

#### Scenario: Majority speaker

- **WHEN** a chunk carries speakers 1 and 2 and speaker 2 covers most of its core
- **THEN** its segments report `speaker` 2 and `speakers` [1, 2]

#### Scenario: Equal coverage

- **WHEN** two speakers in a chunk cover its core equally
- **THEN** `speaker` is the lower identifier and `speakers` keeps both

#### Scenario: No ranking data

- **WHEN** diarization data cannot rank the speakers of a chunk
- **THEN** `speaker` is the lowest identifier and `speakers` is unchanged

#### Scenario: Single-speaker chunk

- **WHEN** a chunk carries exactly one speaker
- **THEN** both `speaker` and `speakers` name that speaker, as before

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
