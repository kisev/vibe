# Spec Delta

## Purpose

Defines durable reuse of a chunk plan and finished chunk results so an interrupted long transcription can continue instead of starting over, without changing the transcript a user receives.

## ADDED Requirements

### Requirement: Out-of-memory failure names the range

When a chunk fails because memory is exhausted and cannot be halved further, the run SHALL fail with an error that names the chunk's start and end times, so the failing span can be identified from the message alone.

#### Scenario: Splitting is exhausted

- **WHEN** a chunk covering 12.0–14.0 s runs out of memory and its halves would fall below the minimum chunk length
- **THEN** the run fails with an error naming 12.0–14.0 s

#### Scenario: A resumed run hits the limit again

- **WHEN** a persisted split is resumed and the failing leaf still exhausts memory
- **THEN** the error names that leaf's range, not the range of the original chunk
