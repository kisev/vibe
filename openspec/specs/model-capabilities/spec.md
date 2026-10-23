# model-capabilities Specification

## Purpose

Defines the model metadata contract that lets the CLI, the HTTP API, and the desktop UI discover what a loaded model supports and adapt their options without engine-specific branches.

## Requirements

### Requirement: Metadata reports engine capabilities
The model metadata endpoint SHALL report, for any supported model file, the engine name, supported languages, whether language detection is available, whether VAD is required, whether streaming and translation are available, whether prompts are accepted, and whether timestamps are produced.

#### Scenario: GigaAM metadata
- **WHEN** metadata is requested for a GigaAM v3 GGUF
- **THEN** the response reports engine `gigaam`, languages `["ru"]`, language detection off, VAD required, streaming off, translation off, prompts off, and timestamps on

#### Scenario: Unsupported model
- **WHEN** metadata is requested for a GGUF whose architecture is not supported
- **THEN** the response is a `400` error with code `unsupported_model` and names the unsupported architecture

### Requirement: Loaded and probed capabilities agree
The capabilities reported by the loaded model SHALL equal the capabilities reported by metadata for the same file, so a client can gate options before loading and rely on the same answer after loading.

#### Scenario: Probe then load
- **WHEN** a client probes metadata for a GigaAM GGUF and then loads it
- **THEN** both describe the same engine and the same language, VAD, translation, prompt, streaming, and timestamp support

### Requirement: Clients gate unsupported options
Clients SHALL NOT send or present options that the reported capabilities mark unsupported.

#### Scenario: Language selection
- **WHEN** a GigaAM model is selected
- **THEN** the UI offers Russian and does not offer automatic language detection

#### Scenario: VAD requirement
- **WHEN** a model that requires VAD is selected and no VAD model is installed
- **THEN** the UI offers to download the VAD model before transcription

#### Scenario: Whisper-only controls
- **WHEN** a non-whisper model is selected
- **THEN** whisper-only controls such as stable timestamps and word timestamps do not appear enabled or effectual

#### Scenario: Translation and prompts
- **WHEN** a model reports translation or prompt support as off
- **THEN** those options are neither sent with a request nor shown as active
