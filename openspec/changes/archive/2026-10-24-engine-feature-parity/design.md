# Design

## Context

`plan_for` (`server/crates/vibe-server/src/server/transcription.rs:153`) returns `None` when `diar_segments` is empty, so without diarization even bounded engines fall back to engine-internal VAD chunking: no plan, no cache, no resume, no speaker sets. The planner itself (`plan.rs`) already handles empty turn lists — `unattributed()` turns detected speech into chunks with empty speaker sets — so the gate, not the planner, is the gap. On the desktop, `models.tsx:94` shows a limitations note under `engine === 'gigaam'`, and `chunk_seconds` exists as a server/CLI request field with no UI.

## Goals / Non-Goals

**Goals:**

- One plan path for all bounded runs, diarization or not.
- Chunk-duration control where transcription is configured, clamped by metadata.
- Engine-name conditionals gone from the desktop.

**Non-Goals:**

- Streaming indicators in the model list (owned by `model-catalog`).
- Planner algorithm changes; cache mechanics changes.
- Whisper behavior changes (its internal long-form path stays).

## Decisions

- **Drop the `diar_segments.is_empty()` gate in `plan_for`, not add a planner mode.** With empty turns, `plan()` already produces unattributed chunks from speech; speaker attribution by overlap is the existing no-plan behavior and stays. This makes the spec's "plan built from speech pauses" scenario true for the external plan, not just the engine-internal fallback.
- **Keep whisper exempt via the existing `max_input_seconds() == None` rule.** No new engine list to maintain; capability-driven by construction.
- **Chunk-duration control in transcription tuning settings**, a numeric input with the metadata maximum as its clamp, sent as the existing `chunk_seconds` form field; empty = absent field. Validation stays server-side (single source of truth); the UI only pre-clamps for friendliness.
- **Limitations note from capability flags.** The note appears when a model lacks common capabilities (single language without detection, no translation, no streaming, no prompts), listing exactly the missing ones — replacing the gigaam string match.
- **Whisper-only gates read two new capability flags, not the engine name.** `EngineCapabilities` grows `stable_timestamps` and `decoding_options` (true only for Whisper today); the desktop's `isWhisperEngine` string match is gone, replaced by `hidesStableTimestamps` / `hidesDecodingOptions`, which treat a missing flag as "unknown, keep the control". The desktop-Rust `ModelCapabilities` mirror now also carries `max_input_seconds` and both flags as `Option`, so `/v1/models/metadata` no longer drops the bound at the Rust boundary.

## Risks / Trade-offs

- [Planned runs without diarization change chunk boundaries for existing users] → Boundaries stay within the same engine bound and pause-aware cutting applies; output text is unaffected beyond segmentation, which the cache equality requirement already covers for the diarized path.
- [VAD failure now disables caching silently] → Same as today's diarization-missing behavior; the run still completes via engine-internal chunking.

## Migration Plan

Server change first (tests prove plan-without-diarization plus cache reuse), desktop control second. No data migration; cache keys already include the plan, so old entries never collide with new boundaries.

## Open Questions
