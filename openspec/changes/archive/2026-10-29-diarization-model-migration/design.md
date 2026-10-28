# Design

## Context

`b3b4ea5b` switched the diarization model from ONNX to GGUF for the unified engine, and the old segmentation/embedding pair (`segmentation-3.0.onnx`, `wespeaker_en_voxceleb_CAM++.onnx`) was superseded even earlier. The download gates in `model-gates.ts` only run on toggle, so a persisted `diarizeEnabled` from before the switch points at a file that no longer exists, and `server/diarization.rs` logs-and-continues on the load error — the user sees transcripts without speakers and no message anywhere.

## Decisions

- **Revalidate at startup, not at request time.** The preference is hydrated before the first transcription in every session, so a one-shot effect in the preference provider covers every path (record button, retranscribe, CLI handoff) without touching the request builders. Request-time checks would need the same logic in three places.
- **Reuse the gate's building blocks.** The migration is `isModelFileUsable` + `ask` + `downloadModel` + a best-effort cleanup — the same pieces `model-gates.ts` uses, so behavior (progress toast, integrity check) is identical to a manual toggle.
- **Extend `delete_model_file` with an explicit legacy allowlist.** Its extension guard (`bin`/`gguf` only) correctly refuses arbitrary deletion; the four legacy names — the broken v2 GGUF mirror the engine rejects (added during validation, alongside the switch to the v2.1 Q8_0 GGUF) and the three ONNX files — are added by exact file name so nothing else gains a delete path.
- **Best-effort cleanup.** A cleanup failure must not fail the migration: the new model already works, and a leftover ONNX only wastes disk space.

## Risks / Trade-offs

- [Startup dialog on a machine that deliberately kept the toggle on without a model] → the alternative was silent feature loss; declining is one click and states the consequence.
- [Users who never enable speaker detection] → the effect returns before any I/O; zero cost.

## Migration Plan

One commit: Rust allowlist, `legacyDiarizationFilenames` in config, `runDiarizationMigration` module + preference-provider wiring, en-US/ru-RU strings, vitest coverage. Validation: dev build where a pre-port profile with the toggle on and no GGUF on disk gets the dialog, downloads, and diarizes again.
