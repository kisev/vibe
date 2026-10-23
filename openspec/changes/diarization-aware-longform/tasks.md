# Tasks

> Depends on `add-gigaam-engine`: the planner's third chunked engine and its 25-second bound come from that change.

## 1. Chunk planning

- [ ] 1.1 Add the plan types (`Chunk`, `Plan`) and a pure planning entry point; verify unit tests cover empty audio, a single short turn, and an exact-boundary turn
- [ ] 1.2 Implement the turn sweep with gap merging and union preservation for boundary slivers; verify tests for overlap, adjacent turns, and sub-threshold slivers
- [ ] 1.3 Derive pauses from VAD speech ranges and implement fixed-size fallback when no pauses or no VAD exist; verify pause ranges tile the non-speech intervals
- [ ] 1.4 Implement cut selection with neighbor limits, preferred length, pause search window, inset, padding, and sample rounding; verify no chunk exceeds the bound and the same inputs produce identical plans across repeated runs
- [ ] 1.5 Verify the plan bounds against engine limits: a GigaAM plan stays at or below the model window, and a configured smaller duration is respected

## 2. Engine chunk entry point

- [ ] 2.1 Add `max_input_seconds` to engine capabilities, report it for Parakeet, Nemotron, and GigaAM, and leave it absent for Whisper; verify metadata tests assert the field per engine
- [ ] 2.2 Add the chunked transcription entry point to the engine API and implement it for Parakeet and Nemotron by reusing their per-chunk decode path; verify their existing transcription tests still pass through the new wrapper
- [ ] 2.3 Implement the chunked entry point for GigaAM, respecting its 25-second bound and token deduplication; verify the GigaAM tests pass through both the old and new paths
- [ ] 2.4 Verify Whisper is excluded: a request with a plan and a Whisper model keeps the current internal long-form path and returns segments without plan speaker sets

## 3. Server planning integration

- [ ] 3.1 Wire planning into both the non-streaming and NDJSON streaming paths; verify both produce chunks from the same plan and the same segments
- [ ] 3.2 Propagate chunk speaker sets to segments and emit both `speaker` and `speakers`; verify a single-speaker chunk yields one id and a boundary chunk yields a union with the ambiguity marker
- [ ] 3.3 Keep overlap-based speaker matching as the fallback when no diarization model is supplied; verify a run without diarization produces the same speakers as before
- [ ] 3.4 Validate `chunk_seconds` against `max_input_seconds` and reject values above the engine maximum before decoding audio; verify HTTP and CLI validation errors
- [ ] 3.5 Measure planning overhead on an hour-long recording and verify it stays a marginal fraction of total transcription time

## 4. Cache core

- [ ] 4.1 Implement cache identity from schema version, decoded-audio hash, model stamp, engine, output-affecting options, and plan; verify changing any input changes the key
- [ ] 4.2 Implement the on-disk layout, atomic temp-and-rename writes, and manifest/plan persistence; verify a simulated crash during a write leaves no visible finished result
- [ ] 4.3 Implement the exclusive advisory lock and busy handling; verify two concurrent runs on the same key neither corrupt results nor observe partial files
- [ ] 4.4 Verify cache-disabled operation: no directory is created and no file is written when no root is configured

## 5. Cache integration

- [ ] 5.1 Reuse finished chunks during a run and across runs; verify a repeated run performs no inference for cached chunks and produces a byte-identical transcript
- [ ] 5.2 Implement resume after interruption; verify a run killed mid-file continues from finished chunks on the next attempt
- [ ] 5.3 Implement out-of-memory split detection, persistence, and reuse; verify a resumed run does not retry the failing chunk size and stops splitting at the minimum length
- [ ] 5.4 Verify cache identity invalidation end-to-end: changing language, chunk duration, or model forces recomputation and produces the expected transcript

## 6. CLI and server startup

- [ ] 6.1 Add `--chunk-seconds` and `--cache-dir` to the transcribe command and `--cache-dir` to the serve command; verify help output and that the flags reach the planner and cache
- [ ] 6.2 Verify the CLI path end-to-end: a long file with diarization produces speaker-consistent chunks, and a killed run resumes from the cache directory
- [ ] 6.3 Document the flags and cache location in CLI help and user docs; verify every documented command runs as written

## 7. Desktop integration

- [ ] 7.1 Pass an app-owned cache directory when spawning the server; verify the server receives it and writes entries there
- [ ] 7.2 Add age-based cache cleanup next to the existing log and temp cleanup; verify stale entries are removed and fresh ones survive
- [ ] 7.3 Extend the desktop transcript model and view with the optional speaker set; verify a union label renders with an ambiguity note and single-speaker lines are unchanged
- [ ] 7.4 Verify batch and retranscription flows with diarization enabled: chunks are speaker-consistent and a retranscription reuses finished chunks

## 8. Documentation, validation, and release

- [ ] 8.1 Update long-recording behavior, cache privacy, and cleanup documentation; verify the docs match the implemented flags and defaults
- [ ] 8.2 Add regression tests comparing transcripts with and without diarization to capture the intended boundary changes for Parakeet, Nemotron, and GigaAM
- [ ] 8.3 Bump the `vibe-server` version and the app's server pin; verify the release build and that the cache is never required for a successful run

## Workflow follow-up

- Archive the change after review requirements are satisfied.
- Verify the archived specs match the implemented behavior.
