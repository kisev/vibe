# Proposal

## Why

Four hand-written Rust crates (`whisper-rs`, `gigaam-rs`, `parakeet-rs`, `nemotron-rs`) over a shared vendored ggml are four sources of inference truth to build, verify, and extend. Every requested new model family (Qwen3-ASR, canary-1b-v2, voxtral realtime, nemotron 3.5 streaming) would need another hand-written engine. The upstream `transcribe.cpp` project runs all of today's families plus the new ones — with verified numerics, per-family benchmarks, and streaming — from one C++ core on the same ggml runtime family.

## What Changes

- **BREAKING**: The server's ASR inference moves wholesale to a vendored `transcribe.cpp`. The four hand-written Rust engine crates and the shared `ggml-rs-sys` bindings are deleted once every family runs with proven output parity; the shipped binary carries exactly one ggml.
- Supported families become (at least): whisper (all variants), GigaAM v3 (all four variants), parakeet (including tdt-0.6b-v3), nemotron (3.5 streaming 0.6b, speech streaming en 0.6b), canary (including 1b-v2), Qwen3-ASR (0.6b, 1.7b), voxtral (mini 3b 2507, small 24b 2507), and voxtral realtime (mini 4b 2602).
- Streaming families stream incrementally; bounded families keep planner chunking at their documented windows; whisper keeps its internal long-form path.
- Legacy whisper `.bin` (ggml-format) model files no longer load; the loader error names the format and points at the model catalog.
- The server HTTP API, CLI surface, capability metadata, cache, and diarization integration are unchanged.
- Diarization (sortformer) and Silero VAD keep their current Rust adapters in this change; moving them onto transcribe.cpp is a separate follow-up.

## Capabilities

### New Capabilities

- `asr-engines/transcribe-cpp`: the unified inference engine — which families it runs, how they are detected, what capabilities each reports, and how legacy files behave.

### Modified Capabilities

## Impact

- `server/crates/`: new transcribe.cpp vendor + wrapper crate; deletion of `whisper-rs`, `gigaam-rs`, `parakeet-rs`, `nemotron-rs`, `ggml-rs-sys`; `vibe-server` engine registry, capability tables, detection, CPU-variant build configuration, and CI on all five platforms.
- Cache: engine identity in cache keys changes; the schema version bumps so old entries never collide.
- Desktop: no protocol changes; model downloads for removed formats surface through the loader error until the model catalog lands (next change).
