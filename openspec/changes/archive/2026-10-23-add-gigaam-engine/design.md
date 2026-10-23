# Design

## Context

See `proposal.md` for motivation and `specs/` for the behavior contract.

Relevant current state:

- `vibe-server` links one static ggml build (`server/crates/ggml-rs-sys`) and one backend set (Vulkan on Windows/Linux, Metal on macOS, CPU with per-variant x86 libraries).
- `engine::Engine` is an enum with one loaded model at a time: Whisper, Parakeet (FastConformer + TDT), Nemotron (streaming RNN-T). GGUF families load through `gguf_init_from_file` and upload weights to a selected device.
- `parakeet-rs` and `nemotron-rs` already implement the patterns a new ggml family needs: GGUF metadata reading, tokenizer loading from `tokenizer.ggml.*`, VAD-driven long-form chunking, streaming callbacks, and sentence splitting.
- `vad-rs` exposes Silero segmentation with `Options { max_chunk_ms, overlap_ms, ... }`; the default cap is 30 s.
- Model detection is duplicated between `Engine::load` and `POST /v1/models/metadata`.
- Desktop clients adapt to models through `ModelCapabilities` returned by that endpoint.

The GigaAM v3 GGUF layout is verified against published `handy-computer` files: `general.architecture = gigaam`, `stt.gigaam.head_kind = rnnt | ctc`, a shared 16-layer Conformer encoder (`enc.pre_encode.*`, `enc.blocks.*`), an RNN-T head (`pred.embed`, `pred.lstm.0.*`, `joint.*`) or a CTC head (`head.ctc.*`), plus baked frontend buffers (`frontend.mel_filterbank`, `frontend.window`) and a `tokenizer.ggml.tokens` vocabulary.

## Goals / Non-Goals

**Goals:**

- One in-process engine variant that reuses the existing ggml runtime, device selection, and backends.
- A crate layout that mirrors `parakeet-rs` so future model families have a repeatable shape.
- A single detection routine shared by load and metadata paths.
- Capability-driven behavior in CLI, HTTP API, and desktop without engine checks leaking into clients beyond the capability contract.

**Non-Goals:**

- Diarization-guided chunk planning and per-chunk resumable caching (separate change).
- Other `transcribe.cpp` families and any second inference runtime.
- Streaming inference for GigaAM (the family is not streaming).

## Decisions

### Port the family to ggml instead of linking `transcribe.cpp`

Linking the upstream C++ library would bring 16 model families at once, but its vendored ggml exports the same symbols as `ggml-rs-sys`; a static link cannot coexist, and a shared link would place a second ggml and a second Vulkan context inside the server process. A port keeps one runtime, one backend registry, one device selection, and the existing release pipeline. It also matches how `diarize-rs` and `parakeet-rs` were added. The cost is numerical validation and ownership of the model code.

### New crate `server/crates/gigaam-rs` mirroring `parakeet-rs`

```
lib.rs        Error, public types
load.rs       GGUF metadata and weight upload
mel.rs        64-mel HTK frontend using the baked filterbank and window
ops.rs        layer norm, FFN, macaron, rotary attention, depthwise conv
encoder.rs    16-layer Conformer with conv subsampling
decoder.rs    RNN-T greedy decode and CTC argmax
tokenizer.rs  SentencePiece/charwise detokenization, blank id
segment.rs    token-to-sentence grouping
model.rs      Model::metadata / load / transcribe_with
runtime.rs    device and backend selection copied from parakeet-rs
```

Tokenizer loading is copied rather than extracted into a shared crate: the loader is small, and a shared crate would couple three model crates that currently evolve independently. If a fourth family appears, extraction becomes worthwhile.

Both heads live in one crate because they share the encoder and only differ in the final layers and decode loop. The RNN-T path keeps predictor state per chunk and deduplicates tokens by frame offset across chunk boundaries, as `parakeet-rs` does.

### Shared model detection

Add one detection function that reads GGUF metadata once and returns either capabilities or an unsupported-model error. `Engine::load` and the metadata route both call it, so a model cannot be listed as supported by one path and rejected by the other. Detection order: whisper (non-GGUF), gigaam, parakeet, nemotron fallback.

### Per-engine VAD options

GigaAM's training window is about 25 seconds, while the current VAD default caps chunks at 30 seconds. The engine selection gains family-specific options: `max_chunk_ms: 24_000`, `overlap_ms: 0`, and the existing threshold, silence, and padding defaults. The VAD cache becomes keyed by path and options instead of path alone. Other engines keep their current 30-second behavior, so this is not a global change.

### Capabilities use the existing schema

GigaAM maps onto the current fields: `engine = "gigaam"`, `requires_vad = true`, `languages = ["ru"]`, `language_detection = false`, `streaming = false`, `translation = false`, `timestamps = true`, `text_prompts = false`. No new wire fields are required for the first release. Word timestamps stay ignored, as they already are for Parakeet and Nemotron.

Desktop changes follow from these fields. The only new client-side rule is that whisper-only controls (stable timestamps, word timestamps, sentence length, sampling) are hidden when `engine != "whisper"`.

### Language selection inside the engine

`None`, empty, and `auto` all select Russian. Any other code returns `unsupported_language` before inference. The same error text is returned from the CLI, the HTTP API, and the handoff path because the check lives in the engine, not in each caller.

### CLI output pipeline

`transcribe` gains `--diarize-model`, `--format`, and `--output`. Diarization reuses `diarization::diarize` and the existing overlap-based speaker matching, so CLI and app produce the same attribution. Formatting is added to `format.rs`: Markdown with timestamped, speaker-labelled blocks, and a JSON document carrying text plus segments. `--output` opens with create-new semantics and writes only after transcription succeeds, so a failed run never truncates an existing transcript.

### Metadata route and OpenAPI

The route gains the GigaAM branch through the shared detection function. utoipa schemas stay unchanged unless `chunk_seconds` is added later; the capability struct is already serialized.

## Risks / Trade-offs

- **Numerical divergence** (rotary embeddings, HTK mel with baked buffers, conv subsampling padding, LSTM gate order, joint activation order) → stage-by-stage comparison against `transcribe.cpp` source and the upstream PyTorch reference, with a token-level golden test and a FLEURS-ru WER gate before release.
- **GPU decode throughput**: RNN-T greedy decoding issues many small matmuls; a naive per-frame joint may underuse the GPU → measure real-time factor on CPU and Vulkan; if needed, batch the joint projection across frames without changing output.
- **GGUF layout evolution**: upstream may revise `stt.gigaam.*` keys → accept only known keys and fail with a clear error naming the unsupported variant or layout.
- **VAD bound semantics**: the bound applies to detected speech before padding, so a chunk can slightly exceed 24 s → keep the 24 s cap below the model's 25 s window as headroom; add a test that no chunk exceeds the bound.
- **Detection cost**: metadata is read twice (probe, then load) → acceptable for local files; the shared function prevents divergent answers.
- **CPU fallback for GGUF engines**: `no_gpu` currently affects Whisper only → GigaAM follows the existing GGUF behavior and documents it; unifying the path is a separate change.
- **Model distribution**: GigaAM GGUFs live under `handy-computer`, not `vibe-app` → document direct download URLs and the `vibe://download` flow rather than mirroring weights.

## Migration Plan

- Ship with the next `vibe-server` release and bump `.server-version` in the app.
- No data migration and no behavior change for existing model families.
- Rollback is reverting the server version pin; GigaAM models remain normal GGUF files and are simply rejected by the older server with an unsupported-architecture error.
