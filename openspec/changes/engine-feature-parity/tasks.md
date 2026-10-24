# Tasks

## 1. Planner without diarization (server)

- [x] 1.1 Remove the `diar_segments.is_empty()` early return in `plan_for` (`server/crates/vibe-server/src/server/transcription.rs`) so bounded engines plan from detected speech with empty turn lists; verify with a unit test that a bounded engine without diarization produces a plan whose chunks honor the input bound and carry no speaker sets
- [x] 1.2 Verify whisper stays exempt: unit test that `plan_for` returns `None` for a whisper context regardless of diarization, and that the cache path is untouched for unbounded engines
- [x] 1.3 Update `server/README.md` where it ties planning to diarization so it states planning now applies to every bounded engine; verify the wording matches the new behavior

## 2. Cache reuse without diarization (server regression)

- [x] 2.1 Extend the gated CLI regression suite to transcribe the same recording twice with the cache root set and no diarization model, and verify the second run reuses cached chunks (unchanged mtimes, no re-inference) for a bounded engine

## 3. Chunk-duration control (desktop)

- [x] 3.1 Add a chunk-duration input to the transcription settings section, clamped to `modelMetadata.capabilities.max_input_seconds` when present and empty by default, persisted and sent as the `chunk_seconds` request field; verify with a unit test that the value flows into transcribe options and that an above-maximum entry is clamped/rejected naming the maximum
- [x] 3.2 Add the i18n keys for the control (en-US + all locales via the `/translate` flow), regenerate paraglide, stamp, and verify the i18n audit is clean

## 4. Capability-driven limitations (desktop)

- [x] 4.1 Replace the `engine === 'gigaam'` conditional in `desktop/src/pages/settings/sections/models.tsx` with a limitations note derived from capability flags (single language without detection, no translation, no streaming, no prompts), listing the actual gaps; verify with a component test that two capability-equal models with different engine names render identical notes and that no desktop code path branches on an engine-name string (grep check)
- [x] 4.2 Update the transplanted gigaam limitation copy into capability-driven text in en-US + locales via the `/translate` flow; verify the i18n audit is clean
- [x] 4.3 Derive the Whisper-only gates from the new `stable_timestamps` and `decoding_options` capability flags instead of the engine name; extend `EngineCapabilities` and the desktop-Rust mirror (which also stops dropping `max_input_seconds`); verify with unit tests on both sides and a UI test that a non-Whisper engine name with Whisper-grade flags renders the same controls

## 5. Integration

- [x] 5.1 Run the server test suite (`cargo test -p vibe-server`, plus the gated CLI regression with the local GigaAM/Parakeet/Nemotron models) and the desktop suites (`tsc`, `vitest`); verify zero failures
