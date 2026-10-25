# Spec Delta

## Purpose

Defines durable reuse of a chunk plan and finished chunk results so an interrupted long transcription can continue instead of starting over, without changing the transcript a user receives.

## ADDED Requirements

### Requirement: Content-addressed cache identity

The cache key SHALL be derived from the decoded audio content, the model file identity, the engine, every option that affects output, the chunk plan, and a cache schema version. Changing any of them MUST produce a different key.

#### Scenario: Same inputs

- **WHEN** the same audio is transcribed twice with the same model and options
- **THEN** both runs use the same cache key

#### Scenario: Changed option

- **WHEN** the language or chunk duration changes between runs
- **THEN** the second run uses a different cache key and does not reuse old results

#### Scenario: Changed model

- **WHEN** the model file is replaced but keeps the same name
- **THEN** the second run uses a different cache key

### Requirement: Finished chunks are reused

A chunk whose result is already cached SHALL be reused without running inference again, and the resulting transcript SHALL equal the transcript of an uncached run with the same inputs.

#### Scenario: Cached rerun

- **WHEN** a completed cached run is repeated
- **THEN** no inference runs for already completed chunks and the output text and timestamps are unchanged

#### Scenario: Uncached baseline

- **WHEN** the same inputs are transcribed once with the cache disabled and once with it enabled
- **THEN** both transcripts are identical

### Requirement: Resume after interruption

If a run is interrupted, a later run with the same inputs SHALL continue from the finished chunks and MUST NOT repeat their inference.

#### Scenario: Process killed mid-run

- **WHEN** a run is terminated after some chunks completed and the same request is repeated
- **THEN** only the unfinished chunks are processed and the final transcript is complete

#### Scenario: Failure before any chunk completes

- **WHEN** a run fails on the first chunk and is repeated
- **THEN** it starts from the beginning and reports the same error

### Requirement: Out-of-memory split is durable

When a chunk fails because memory is exhausted, the system SHALL split it into smaller chunks and SHALL persist the split so a resumed run does not retry the failing size.

#### Scenario: Split recorded

- **WHEN** a chunk fails with an out-of-memory error and the run continues after splitting
- **THEN** a resumed run of the same request uses the split boundaries directly

#### Scenario: Minimum chunk size

- **WHEN** a chunk cannot be split further
- **THEN** the run fails with an out-of-memory error naming the failing time range

### Requirement: Exclusive access

Two runs using the same cache key MUST NOT write concurrently. A second run SHALL wait for the first or fail with a clear busy error.

#### Scenario: Concurrent runs

- **WHEN** two processes transcribe the same audio with the same options at the same time
- **THEN** neither observes a partially written result and both either finish or report a clear error

### Requirement: Atomic result visibility

Cache entries SHALL become visible only when complete, so a crash never leaves a result that looks finished but is truncated.

#### Scenario: Crash during write

- **WHEN** the process is terminated while writing a chunk result
- **THEN** the next run treats that chunk as unfinished and recomputes it

### Requirement: Opt-in cache root

Caching SHALL be active only when a cache directory is configured. The desktop SHALL configure an application-owned directory; CLI and API users SHALL opt in explicitly.

#### Scenario: No cache directory

- **WHEN** no cache directory is configured
- **THEN** transcription runs normally and writes nothing to disk

#### Scenario: Desktop default

- **WHEN** the desktop app starts the server
- **THEN** the server uses a cache directory inside the app's local data directory

### Requirement: Cleanup is safe

Old cache entries SHALL be removable without affecting stored transcripts or any completed file, and removing the cache directory SHALL only cost recomputation.

#### Scenario: Age-based cleanup

- **WHEN** entries older than the configured age are removed
- **THEN** existing transcripts remain readable and the next run recomputes only the removed chunks

### Requirement: Local-only cache

Cached transcript content SHALL remain on the local machine and MUST NOT be transmitted to any remote service.

#### Scenario: Offline run

- **WHEN** transcription runs without network access
- **THEN** caching and reuse work exactly as with network access
