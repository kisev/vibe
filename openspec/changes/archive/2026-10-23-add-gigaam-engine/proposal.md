# Proposal

## Why

Russian transcription quality currently sits outside the product: users run an external PowerShell pipeline around `transcribe.cpp` and GigaAM because `vibe-server` loads only Whisper, Parakeet, and Nemotron. GigaAM v3 GGUFs already use the GGUF layout Vibe reads and the same ggml runtime the server links, so the family can be supported in-process without a new native dependency. Bringing it in removes the external script and makes the same engine reachable from the CLI, the HTTP API, and the desktop UI.

## What Changes

- Add a `gigaam-rs` crate on the shared ggml runtime implementing the GigaAM v3 family: a 16-layer Conformer encoder with rotary positional embeddings, plus either an RNN-T head (`pred` + `joint`) or a CTC head (`head.ctc`).
- Support all four v3 variants: `gigaam-v3-e2e-rnnt`, `gigaam-v3-e2e-ctc`, `gigaam-v3-rnnt`, `gigaam-v3-ctc`, including the SentencePiece (1024/256-piece) and charwise (33-entry) tokenizer paths.
- Detect the family from `general.architecture = "gigaam"` in both `Engine::load` and the model metadata endpoint.
- Report family capabilities: Russian only, auto-detection off, VAD required, no translation, no text prompts, no streaming, token timestamps.
- Enforce the family's short-form contract: VAD chunking bounded to roughly 25 seconds per model input, configured per engine instead of the global 30-second default.
- Reject unsupported languages with a clear error instead of decoding garbage; `auto` and `ru` both select Russian.
- Extend `vibe-server transcribe` with `--diarize-model`, `--output`, and `--format` (`md`, `json`, `srt`, `vtt`, `txt`) so the CLI can produce the speaker-labelled transcript the external script produced.
- Reflect the engine in the HTTP API (metadata, OpenAPI) and in the desktop UI through existing capability-driven gates: language list, VAD download, diarization toggle, unsupported-option hints, model icon, and model documentation.
- No breaking changes: existing models and clients keep their current behavior; the global VAD default is unchanged for other engines.

Out of scope: diarization-guided chunk planning and per-chunk resumable caching from the external script; they are proposed as a separate change. Also out of scope: other `transcribe.cpp` model families (Qwen3-ASR, Canary, Voxtral, and others).

## Capabilities

### New Capabilities

- `asr-engines/gigaam`: loading, metadata detection, decoding, language contract, timestamp output, and the short-form chunk bound for the GigaAM v3 family.
- `model-capabilities`: the metadata contract that lets every client (CLI, HTTP API, desktop UI) discover an engine's languages, VAD requirement, timestamp support, and unsupported options, and adapt without engine-specific branches.
- `transcription-cli`: one-shot CLI transcription behavior, including speaker-labelled output and selectable transcript file formats.

### Modified Capabilities

None. The project has no existing specs; no current requirement is being changed.

## Impact

- New crate `server/crates/gigaam-rs`, added to the `server/` workspace and depended on by `vibe-server`.
- `server/crates/vibe-server`: `engine.rs` (new variant, detection, capabilities, per-engine VAD options), `server/routes/models.rs` (metadata branch), `cli.rs` (diarization, output, formats), `server/format.rs` (Markdown/JSON output), OpenAPI schema.
- Desktop: `desktop/src/lib/model.ts` capability typing and engine gating, `settings` sections for whisper-only options, brand glyph, translations.
- Documentation: model catalog entry, limitations (Russian only, 25-second inputs, no translation), CLI help.
- Runtime dependencies: none beyond the existing ggml libraries and backends; CPU, Vulkan, and Metal support comes from the shared `ggml-rs-sys` linkage.
