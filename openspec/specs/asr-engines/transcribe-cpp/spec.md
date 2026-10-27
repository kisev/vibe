# asr-engines/transcribe-cpp Specification

## Purpose

Defines the unified ASR inference engine: which model families it runs, how a model file is recognized, what capabilities each family reports, and how streaming, long-form input bounds, and legacy model files behave.

## Requirements

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

### Requirement: GPU backends per platform

The engine SHALL ship with the Vulkan GPU backend on Windows and Linux and the Metal backend on macOS, so a machine with a working GPU driver lists its devices and loads models on them; strict-CPU requests SHALL keep running without any GPU backend, and a machine without a usable Vulkan loader SHALL behave exactly like a CPU-only build.

#### Scenario: Enumeration on a Vulkan machine

- **WHEN** the server's device listing runs on a Windows or Linux machine with a Vulkan-capable GPU and current driver
- **THEN** the GPU appears in the device list and selecting it loads the model on that GPU

#### Scenario: Machine without a usable loader

- **WHEN** the server runs where no Vulkan loader or driver is available
- **THEN** the device list is empty and transcription proceeds on CPU, with no crash or new runtime dependency

#### Scenario: Explicit CPU choice is untouched

- **WHEN** a load requests strict CPU
- **THEN** the model loads and transcribes on CPU regardless of the GPU backends compiled in

#### Scenario: GPU failure keeps the CPU fallback

- **WHEN** a GPU load fails on a machine whose GPU otherwise enumerates
- **THEN** the desktop reloads the model on CPU and reports the fallback, as it does today
