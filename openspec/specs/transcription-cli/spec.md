# transcription-cli Specification

## Purpose

Defines one-shot transcription from the command line: running any supported model family, optionally separating speakers, and writing the transcript in a chosen format to stdout or a file.

## Requirements

### Requirement: Transcribe any supported model
The CLI SHALL transcribe a local audio file with any model family the server supports, including GigaAM, using the model's required VAD model when the model metadata says VAD is required.

#### Scenario: GigaAM file
- **WHEN** the CLI is given a GigaAM GGUF, a VAD model, and a Russian audio file
- **THEN** it prints the transcript and exits with status 0

#### Scenario: Missing required VAD model
- **WHEN** the CLI is given a model that requires VAD without a VAD model
- **THEN** it exits non-zero with a message stating that a VAD model is required

#### Scenario: Unsupported language
- **WHEN** the CLI requests a language the model does not support
- **THEN** it exits non-zero with an `unsupported_language` message and prints no transcript

### Requirement: Optional speaker separation
The CLI SHALL accept a diarization model and, when provided, SHALL attribute each transcript segment to a speaker.

#### Scenario: Diarization enabled
- **WHEN** transcription runs with a diarization model
- **THEN** every transcript segment carries a speaker identifier where the diarizer found speech

#### Scenario: Diarization disabled
- **WHEN** transcription runs without a diarization model
- **THEN** the transcript omits speaker identifiers and otherwise succeeds

### Requirement: Selectable output format
The CLI SHALL write the transcript as plain text, Markdown, JSON, SRT, or VTT, defaulting to plain text on standard output.

#### Scenario: Markdown output
- **WHEN** the CLI is asked for Markdown
- **THEN** the output contains the transcript with timestamps and, when diarization ran, speaker labels

#### Scenario: JSON output
- **WHEN** the CLI is asked for JSON
- **THEN** the output is a JSON document containing the transcript text and its timestamped segments

#### Scenario: Subtitle output
- **WHEN** the CLI is asked for SRT or VTT
- **THEN** the output is a valid subtitle document with one cue per transcript segment

### Requirement: Safe file output
When an output path is given, the CLI SHALL write the complete transcript to that path and MUST NOT overwrite an existing file.

#### Scenario: New output file
- **WHEN** the CLI writes to a path that does not exist
- **THEN** the file contains the complete transcript after a successful run

#### Scenario: Existing output file
- **WHEN** the CLI writes to a path that already exists
- **THEN** it exits non-zero, reports the path, and leaves the existing file unchanged

#### Scenario: Failed transcription
- **WHEN** transcription fails after an output path was given
- **THEN** no output file is created or modified
