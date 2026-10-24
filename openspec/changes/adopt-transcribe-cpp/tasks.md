# Tasks

## 1. Spike

- [ ] 1.1 Vendor the pinned transcribe.cpp revision under `server/crates/` with a build script that compiles it, and build a trivial inference (tiny whisper GGUF, one utterance) into a local test binary on WSL; verify the transcript matches expectations and record the answers: GGUF-only input, whisper decode options exposed, C++ standard needed
- [ ] 1.2 Build the same spike in the CI matrix (one Linux runner + one Windows runner) and verify linking, symbol visibility (no `ggml_*` clashes with `ggml-rs-sys` in the same test binary), and baseline x86_64 execution; record CPU dispatch findings in the design's decisions

## 2. Wrapper and engine registry

- [ ] 2.1 Create the FFI wrapper crate (model load, metadata, transcribe, stream, free) with safe Rust types and verify unit tests over a tiny model cover load/transcribe/free without leaks (run under the existing test harness)
- [ ] 2.2 Route family detection through GGUF metadata into the new engine arm in the server's registry, mapping each family to its capability table (languages, detection, translation, prompts, timestamps, streaming, VAD requirement, `max_input_seconds`); verify with tests that metadata for a GigaAM, parakeet, and nemotron GGUF reports the same flags as today's engines do

## 3. Family enablement

- [ ] 3.1 Enable the existing families (whisper, GigaAM v3 all variants, parakeet tdt-0.6b-v3, nemotron) through the wrapper and prove side-by-side transcript parity against the current engines on the regression fixtures (multi.wav and the gated CLI models); verify text and segment timestamps match within tolerance before proceeding
- [ ] 3.2 Enable the new families (canary incl. 1b-v2, Qwen3-ASR 0.6b/1.7b, voxtral mini 3b, voxtral realtime mini 4b, nemotron 3.5 streaming) with catalog GGUFs downloaded for the gated tests; verify each loads, transcribes its fixture, and reports its documented capabilities
- [ ] 3.3 Verify streaming for a streaming family through the stream endpoint (incremental segment events) and planner chunking for a bounded family (every input within its window on a long recording)
- [ ] 3.4 Verify the legacy `.bin` loader error names the format and points at the model catalog, and that existing GGUF files keep loading

## 4. Platform and variant hardening

- [ ] 4.1 Wire the wrapper into all five dev-build/release platforms and verify `cargo build -p vibe-server --release` succeeds on each; confirm the AVX-baseline fallback path still swaps to a working baseline binary on the Windows test path
- [ ] 4.2 Bump the cache schema version so old cache entries are unreachable, and verify a pre-change cache directory does not collide (new keys written, old ignored)

## 5. Removal

- [ ] 5.1 Delete `whisper-rs`, `gigaam-rs`, `parakeet-rs`, `nemotron-rs`, and `ggml-rs-sys` from the workspace once every family's parity proofs pass, and verify the workspace builds with exactly one ggml (link check for a single set of `ggml_*` definitions)
- [ ] 5.2 Run the full server test suite plus the gated CLI regression across families and verify zero failures; update `server/README.md` engine documentation to describe the unified engine and families

## Workflow follow-up

- Archive the change after verification; the `model-catalog` change builds on this one.
