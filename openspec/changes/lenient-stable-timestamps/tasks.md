# Tasks

## 1. Engine gate

- [x] 1.1 Downgrade the unsupported `stable_timestamps` check in `validate_request` to a warning that drops the flag; keep translation, prompts, and language strict (`server/crates/vibe-server/src/engine.rs`)
- [x] 1.2 Make every caller pass mutable options so the dropped flag reaches the chunk-cache key untouched (`transcribe`, `transcribe_stream`, the chunk-plan path, the HTTP handler, the CLI)
- [x] 1.3 Update `gigaam_request_contract_and_segments`: the rejection loop keeps translate and prompts only, and a new assertion checks the stable-timestamps flag is dropped, not rejected

## 2. Validation

- [ ] 2.1 Cut a dev build and confirm a GigaAM transcription that sends `stable_timestamps` succeeds (on the 5070 Ti it doubles as the GPU validation) and the log carries the warning
