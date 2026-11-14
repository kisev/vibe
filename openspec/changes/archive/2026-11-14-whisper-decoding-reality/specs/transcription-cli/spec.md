# Spec Delta

## ADDED Requirements

### Requirement: Only options the engine honours are offered

The desktop SHALL expose a decoding option only when the engine implements it: beam-search settings and a segment-length cap are not offered while `transcribe-cpp` has no such parameters. Thread count SHALL be passed to the engine's session options rather than exposed and discarded.

#### Scenario: Beam-search controls

- **WHEN** the Whisper options surface renders
- **THEN** no sampling-strategy, best-of, beam-size or max-sentence-length control is shown

#### Scenario: Threads reach the engine

- **WHEN** a transcription carries a thread count
- **THEN** the server opens the session with that value, and its absence keeps the library default

#### Scenario: An older desktop sends a removed option

- **WHEN** a request still carries a removed field
- **THEN** the server accepts it and ignores it without failing the transcription
