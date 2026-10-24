# Spec Delta

## Purpose

Defines the unified ASR inference engine: which model families it runs, how a model file is recognized, what capabilities each family reports, and how streaming, long-form input bounds, and legacy model files behave.

## ADDED Requirements

### Requirement: Supported families

The engine SHALL transcribe with the whisper, GigaAM v3, parakeet, nemotron, canary, Qwen3-ASR, voxtral, and voxtral-realtime families from GGUF model files, including the variants the model catalog publishes for them.

#### Scenario: Requested variants load

- **WHEN** a catalog-published GGUF of any supported family is loaded
- **THEN** the model loads and transcribes with that family's engine behavior

#### Scenario: Unsupported architecture

- **WHEN** a GGUF declares an architecture no supported family covers
- **THEN** loading fails with an error naming the unsupported architecture

### Requirement: Capability reporting per family

Model metadata SHALL report each family's supported languages, language detection, translation, prompts, timestamps, streaming, VAD requirement, and maximum input duration, and a loaded model's capabilities SHALL equal its metadata.

#### Scenario: Streaming family

- **WHEN** metadata is requested for a streaming model such as nemotron 3.5 streaming or voxtral realtime
- **THEN** the response reports streaming on and the family's documented languages

#### Scenario: Probe and load agree

- **WHEN** metadata for a canary GGUF is probed and then the model is loaded
- **THEN** both report the same capabilities

### Requirement: Streaming families stream incrementally

A model whose capabilities report streaming SHALL emit transcript segments incrementally while audio is processed, and non-streaming models SHALL keep emitting per-chunk segments as today.

#### Scenario: Streaming run

- **WHEN** a streaming-capable model transcribes through the streaming endpoint
- **THEN** segment events arrive before the run completes

### Requirement: Long-form bounds carry over

Families with a maximum input duration SHALL be split by the chunk planner at their documented window (about 25 seconds for GigaAM, about 30 seconds for parakeet and nemotron), and whisper SHALL keep its internal long-form path unsplit.

#### Scenario: Bounded family long recording

- **WHEN** a long recording is transcribed with a bounded family
- **THEN** every model input is within that family's window and the planner's pause-aware cutting applies

### Requirement: Legacy whisper binaries name their replacement

Whisper models in the legacy ggml `.bin` container SHALL no longer load, and the load error SHALL name the format and point at the model catalog, while previously downloaded GGUF models continue to load.

#### Scenario: Legacy file

- **WHEN** a `.bin` whisper model from the pre-catalog downloads is loaded
- **THEN** loading fails with an error naming the legacy format and pointing at the model catalog

#### Scenario: Existing GGUF keeps working

- **WHEN** a GGUF that loaded before the engine switch is loaded again
- **THEN** it loads and transcribes as before

# Removed Capability: asr-engines/gigaam

The GigaAM engine's own requirements are retired together with its crate; the family continues under the unified engine above.
