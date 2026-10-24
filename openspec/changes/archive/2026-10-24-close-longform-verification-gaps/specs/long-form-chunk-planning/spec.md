# Spec Delta

## Purpose

Defines how a long recording is divided into model inputs so that each input stays within the engine's limit and, when diarization is available, contains one speaker's speech.

## ADDED Requirements

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
