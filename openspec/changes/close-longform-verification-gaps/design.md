# Design

## Context

See `proposal.md` — Why. The implementation these fixes touch lives in `server/crates/vibe-server/src/plan.rs`, `server/format.rs`, `server/stream.rs`, and `server/transcription.rs`, with the desktop cache directory in `desktop/src-tauri/src/cmd/server_cmd.rs`. The base long-form behavior is defined by `diarization-aware-longform`, whose delta specs are not synced yet, so this change's spec deltas are ADDED-only and apply cleanly whichever change archives first.

## Goals / Non-Goals

**Goals:**

- One definition of the singular `speaker` for planned chunks, shared by the HTTP document and the NDJSON stream.
- An out-of-memory failure that identifies the span it could not process.
- Test evidence for the four scenarios verification found untested.
- `server/transcription.rs` back under the project's 700-line limit without changing its public surface.

**Non-Goals:**

- No change to the plan format or the cache key; existing entries stay valid.
- No change to how speaker sets are formed, merged, or split.
- No new user-facing mode, flag, or setting.

## Decisions

### Dominant speaker is computed from diarization coverage, not stored in the plan

`speaker` for a multi-speaker chunk is the id whose diarization segments overlap the chunk's core the most; ties go to the lower id, and a chunk with no attributable overlap falls back to the lowest id in the set. The helper lives beside the segment mapping (`format.rs`) and takes the chunk plus the diarization segments, so the HTTP path and the stream call the same code.

Alternatives: storing a dominant id in `Chunk` at plan time — it would change the serialized plan and therefore every cache key for no gain, since the diarization input is already on hand wherever the field is needed. Keeping `set[0]` and rewriting the design instead — cheaper, but it would attribute a boundary line to an arbitrary speaker in SRT/VTT/TXT exports, which is the observable problem.

The formatter takes the plan rather than precomputed sets, so `speakers` and `speaker` are derived in one place and cannot drift. `planned_speakers` stays as the set-level helper the tests and callers use.

### The split failure carries its range through anyhow context

When halving stops — the halves would fall below the minimum, or the depth cap is reached — the original error is wrapped with the chunk's core range. `anyhow` keeps the source chain, so the out-of-memory classifier still recognizes a wrapped error and a resumed run classifies a leaf exactly as before.

Alternative: a dedicated error type — more ceremony for one message, and it would need its own classification path.

### The pre-decode bound check is pinned with a route test

The handler already rejects an oversized `chunk_seconds` before reading the audio. A model-gated test calls the handler directly with a multipart request built from a string body — an oversized bound plus junk "audio" — and asserts `invalid_request` rather than `invalid_audio`, which is only possible if the bound is checked before decoding. Building the `Multipart` from a plain request keeps the test inside the existing test module: no router refactor and no new dependencies. Alternative: calling the validation helper alone — it would not distinguish "checked first" from "checked after decoding", which is the behavior at stake.

### Missing evidence is added where the behavior already lives

- Cache disabled vs enabled: a gated CLI test runs the same file with and without `--cache-dir` and compares stdout byte for byte.
- Failure before any chunk completes: a unit test drives the split resolver with a runner that always exhausts memory on a chunk too short to halve, and asserts the second identical attempt reports the same error and leaves no stored part.
- Desktop cache directory: the path composition is split from the `AppHandle` lookup into a pure function and unit-tested.

### `transcription.rs` splits by responsibility

The cached pass — `transcribe_cached`, the split tree walk, `halve`, slot naming, the stored-segment type, and the out-of-memory classifier — moves to `server/chunk_cache.rs` together with its tests. `transcription.rs` keeps request handling, option building, plan construction, and validation. Items crossing the boundary become `pub(super)`.

## Risks / Trade-offs

- **Exports change for boundary lines** → the proposal marks it breaking; single-speaker lines are untouched, and tests pin both cases.
- **Route test depends on a loaded engine** → gated on `GIGAAM_MODEL` like the other model tests; without it the test skips.
- **Two new dev-dependencies** → test-only, no shipped weight.
- **Module move can quietly lose coverage** → tests move with the code and the full suite, including the gated CLI tests, must pass before the change is marked done.
- **The old change's design record still says `set[0]`** → this change's spec and design supersede it; a task updates the old record if it is still active, so the archived history matches the shipped behavior.

## Migration Plan

No data migration: the plan format, the cache schema version, and the cache key are unchanged, so existing entries remain valid. Rollback is a revert of this change; cached results stay readable either way.
