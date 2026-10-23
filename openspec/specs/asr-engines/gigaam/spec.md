# gigaam Specification

## Purpose

Defines how Vibe recognizes, loads, and runs the GigaAM v3 Russian speech-recognition family, including its supported variants, language contract, short-form input bound, and timestamp output.

## Requirements

### Requirement: GigaAM model detection
The system SHALL recognize a GGUF model as GigaAM when its metadata declares `general.architecture` = `gigaam`, and SHALL expose it through the same model-loading path as other families.

#### Scenario: Loading an RNN-T variant
- **WHEN** a model whose metadata declares architecture `gigaam`, variant `gigaam-v3-e2e-rnnt`, and head kind `rnnt` is loaded
- **THEN** the model loads successfully and reports engine `gigaam`

#### Scenario: Loading a CTC variant
- **WHEN** a model whose metadata declares architecture `gigaam` and head kind `ctc` is loaded
- **THEN** the model loads successfully and reports engine `gigaam`

#### Scenario: Unsupported head
- **WHEN** a model declares architecture `gigaam` with a head kind other than `rnnt` or `ctc`
- **THEN** loading fails with an error naming the unsupported head

### Requirement: Supported variants
The system SHALL transcribe with all four shipped v3 variants: `gigaam-v3-e2e-rnnt`, `gigaam-v3-e2e-ctc`, `gigaam-v3-rnnt`, and `gigaam-v3-ctc`.

#### Scenario: Punctuated output
- **WHEN** a sentence of Russian speech is transcribed with `gigaam-v3-e2e-rnnt` or `gigaam-v3-e2e-ctc`
- **THEN** the transcript includes capitalization and sentence punctuation

#### Scenario: Charwise output
- **WHEN** a sentence of Russian speech is transcribed with `gigaam-v3-rnnt` or `gigaam-v3-ctc`
- **THEN** the transcript is lowercased and contains no punctuation

### Requirement: Russian-only language contract
The system SHALL accept `ru` and `auto` as the transcription language for GigaAM and MUST reject any other language with an `unsupported_language` error.

#### Scenario: Automatic selection
- **WHEN** a request omits the language or sends `auto`
- **THEN** the transcription runs as Russian

#### Scenario: Unsupported language
- **WHEN** a request asks for a language other than `ru`, `auto`, or empty
- **THEN** the request fails with `unsupported_language` and no transcript is produced

### Requirement: Short-form input bound
The system MUST split input audio into chunks of at most about 25 seconds before each model invocation, using speech pauses detected by VAD. A whole recording SHALL never be passed as one model input.

#### Scenario: Long recording
- **WHEN** a 40-minute recording is transcribed
- **THEN** every model input is at most about 25 seconds long

#### Scenario: Uninterrupted speech
- **WHEN** speech continues longer than the bound without a usable pause
- **THEN** the audio is split at the bound rather than sent whole

#### Scenario: Silence only
- **WHEN** the recording contains no detected speech
- **THEN** the result contains no segments and reports no error

### Requirement: VAD is mandatory for GigaAM
A GigaAM transcription request that does not provide a VAD model MUST fail with a clear validation error before inference starts.

#### Scenario: Missing VAD model
- **WHEN** a GigaAM request has no VAD model configured
- **THEN** the request fails with an `invalid_request` error explaining that a VAD model is required

### Requirement: Timestamped output
The system SHALL report each transcript segment with a start and end time derived from the model's token timing at 40-millisecond resolution.

#### Scenario: Segment timing
- **WHEN** a chunk is transcribed
- **THEN** every emitted segment has a non-negative start time earlier than its end time

### Requirement: Unsupported options are rejected
The system MUST reject translation, text prompts, and stable-timestamps mode for GigaAM with a clear error, and SHALL ignore word-timestamp requests because the family exposes token timing only.

#### Scenario: Translation request
- **WHEN** a GigaAM request enables translation
- **THEN** the request fails with an error stating that translation is unsupported

#### Scenario: Prompt request
- **WHEN** a GigaAM request supplies a text prompt
- **THEN** the request fails with an error stating that prompts are unsupported

#### Scenario: Word timestamps request
- **WHEN** a GigaAM request enables word timestamps
- **THEN** transcription succeeds and returns segment-level timestamps instead of failing
