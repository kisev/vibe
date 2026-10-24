# Design

## Context

See `proposal.md` for motivation and `specs/` for the behavior contract.

Today each engine owns long-form chunking: Parakeet and Nemotron call `vad.segments` and loop over speech ranges, GigaAM (from `add-gigaam-engine`) follows the same shape, and Whisper keeps its internal long-form decoding. Diarization runs on the whole decoded audio before transcription, and speakers are attached afterwards by interval overlap. The server already serializes transcription with a global mutex, and the desktop starts the server with environment variables for FFmpeg and the unload timeout.

The external pipeline this project replaces does the opposite: it builds a plan from diarization turns and VAD pauses first, then transcribes each planned chunk, and caches every finished chunk.

## Goals / Non-Goals

**Goals:**

- A deterministic, testable chunk plan computed before inference.
- Speaker-consistent model inputs for engines that accept externally chunked audio.
- Per-chunk reuse that survives interruption and does not change the resulting transcript.
- No change for Whisper and no change when diarization is disabled.

**Non-Goals:**

- Streaming or real-time planning.
- Speaker naming or identity across recordings.
- Reusing cache entries across different models or engines.
- Replacing the engine-internal VAD APIs; they remain as fallbacks.

## Decisions

### The plan is a pure server value type

New module `server/crates/vibe-server/src/plan.rs` defines:

```rust
struct Chunk {
    input_start: f64, input_end: f64,   // audio sent to the model, including padding
    core_start: f64, core_end: f64,     // time range the transcript belongs to
    speakers: Vec<u16>,                 // one id, or several at an uncertain boundary
}

struct Plan { chunks: Vec<Chunk>, max_input_seconds: f64 }
```

Planning inputs are decoded samples, diarization segments (optional), speech segments from `vad-rs`, and the engine's maximum input. The planner is a pure function, so determinism is a unit test rather than an integration property.

Alternatives: planning inside each model crate (duplicates diarization handling and makes Cargo graphs worse) and splitting transcripts after the fact (cannot fix mixed-speaker audio). Both rejected.

### Pauses come from the existing VAD output

`vad-rs` returns speech ranges, so pauses are their complement. No new VAD API is needed. When no VAD model is available the planner falls back to fixed-size chunks bounded by the engine limit, matching the existing "uniform" behavior.

### Turn construction follows the established union rule

Diarization segments are swept into turns: intervals are merged when a gap is below a small threshold, and sub-threshold boundary slivers are absorbed into a neighbor while preserving the union of speaker ids. This is the same semantics the external script used, and it is why a boundary chunk carries `[1, 2]` rather than picking one speaker.

### Speech diarization missed still reaches the model

Diarization does not cover every speech range: a speaker past the model's limit, or a noisy passage, stays unlabeled. The planner keeps those speech ranges — the ones VAD found and no turn covers — as their own chunks with an empty speaker set, because dropping them would silently lose words. Their segments carry no planned speaker and fall back to overlap matching, exactly as they do without a plan.

### Cut selection

For each turn: left and right limits are the midpoints to neighboring turns; the preferred length is the engine target (about 20 seconds for GigaAM, the existing default elsewhere); when a cut is required, the planner searches pauses within the allowed window, stays inside the pause by a small inset, and picks the pause nearest the preferred length. If no pause fits, the cut lands on the bound. Cut boundaries are rounded to samples to keep the plan deterministic.

### Explicit chunk entry point on engines

`Engine` gains `transcribe_chunks(samples, plan, options, callbacks)`. Parakeet, Nemotron, and GigaAM implement it by reusing their per-chunk decode path; their existing `transcribe` methods become a "plan from VAD internally, then call the chunk path" wrapper. Whisper returns `unsupported` for the chunk path and the server keeps the existing call.

`EngineCapabilities` gains `max_input_seconds: Option<f64>`. Its presence marks an engine as plan-capable; Whisper reports `None`. This field is also what validates `chunk_seconds` requests and what lets clients explain the limit.

Alternatives: a trait object per engine (larger refactor for the same effect) and passing the plan inside `TranscribeOptions` (mixes one-shot options with model input and forces every engine to parse it). Rejected.

### Speaker sets, not a single id

`verbose_json` and NDJSON segment events keep `speaker` for compatibility and add `speakers: [u16]`. A single-speaker chunk fills both; an uncertain chunk fills `speakers` with the union and leaves `speaker` as the dominant id. Desktop `Segment` gains an optional `speakers` array and the transcript view renders a union label with an ambiguity note.

### Cache layout and identity

New module `server/crates/vibe-server/src/cache.rs`. Cache root comes from `--cache-dir` (serve and transcribe) or `VIBE_SERVER_CACHE_DIR`, which the desktop sets to `<app local data dir>/transcribe-cache`.

```
<cache_root>/<key>/
    manifest.json     schema, audio hash, model stamp, engine, options, plan
    plan.json
    parts/part-XXXXXX.json   finished chunk results
    splits.json       OOM split decisions
    run.lock          exclusive advisory lock
```

`key` is a truncated SHA-256 over: cache schema version, SHA-256 of the decoded 16 kHz samples, model path + size + modification time, engine name, every option that affects output, and the serialized plan. Decoded samples are hashed rather than the uploaded bytes so the same recording in two containers shares a key; the model stamp avoids hashing hundreds of megabytes on every run.

Writes go to a temporary file and are renamed into place, so a crash never leaves a readable partial result. The lock is an advisory OS lock (`fs4`), released automatically when the process dies; a second run waits briefly and then reports a busy error.

Alternatives: a database (adds a dependency and migration surface for a handful of JSON files) and memory-only caching (does not survive the crash this change exists to survive). Rejected.

### Out-of-memory handling

A failed chunk whose error classifies as out-of-memory is split in half, the split is persisted in `splits.json`, and both halves are retried. A resumed run reads the splits and goes straight to the smaller ranges. Splitting stops at a minimum chunk length, at which point the original error is reported with its time range.

### Request surface

- CLI: `--chunk-seconds` and `--cache-dir`; the existing `--diarize-model` supplies turns.
- API: `chunk_seconds` on the transcription form; the cache root is a server startup concern, not a per-request one.
- Desktop: passes the cache directory when spawning the server and cleans entries by age at startup, next to the existing log and temp-file cleanup.

## Risks / Trade-offs

- **Transcript changes when diarization is enabled** (new boundaries and speaker sets) → document the change; existing stored transcripts are untouched; golden tests capture the intended output.
- **Extra planning cost** (whole-file VAD and diarization were already paid when diarization is enabled; the planner adds only arithmetic) → measure planning overhead on an hour-long file and require it to stay marginal.
- **Cache growth on disk** → app-managed age cleanup, cache disabled without a configured root, and removal is always safe.
- **Privacy of cached text** → local-only, documented, and opt-in outside the desktop app.
- **Heuristic OOM classification** → conservative match on existing error text; persisted splits are safe even if suboptimal.
- **Platform locking differences** → advisory locking through a cross-platform crate; the lock is not required for correctness of a single server, only to protect concurrent CLI runs.
- **Model stamp collisions** (same size and second-resolution mtime) → accepted; a content hash can be added later without changing the layout because the stamp is inside the key input.
- **Plan API duplication** in three crates → the shared code is small; a trait extraction can follow if a fourth chunked engine appears.

## Migration Plan

- Additive: without a cache directory nothing is written, and without a diarization model the planner reproduces the current pause-based behavior.
- Ship with the next `vibe-server` release; the desktop starts passing the cache directory.
- Rollback: stop configuring the cache directory and revert the server version pin; any cache directory can be deleted without affecting transcripts.
