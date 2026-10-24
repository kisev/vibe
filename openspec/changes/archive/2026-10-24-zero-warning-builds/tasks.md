# Tasks

## 1. Model crates

- [x] 1.1 Apply clippy's fixer and hand edits in `gigaam-rs` (excessive float precision in tests, `div_ceil` in `encoder.rs`, loop-variable indexing in `decoder.rs`, too-many-arguments and the missing `# Safety` section in `ops.rs`); verify `cargo clippy -p gigaam-rs --tests` is silent and its tests still pass
- [x] 1.2 Fix the `chunks_exact` findings in `whisper-rs/src/model_file.rs`; verify `cargo clippy -p whisper-rs` is silent and its tests still pass
- [x] 1.3 Silence the generated `bindings.rs` in `ggml-rs-sys` with targeted crate-level allows for the three lint families bindgen trips; verify `cargo clippy -p ggml-rs-sys` is silent and hand-written files in the crate stay linted

## 2. vibe-server

- [x] 2.1 Fix the mechanical findings: single-character `push_str` in `format.rs`, the dead `MINUTE` constant and items-after-test-module in `cli.rs`, the two redundant struct updates in `format.rs` tests, `Option::unwrap_or_else` and the `match` that reads as `?`; verify `cargo clippy -p vibe-server --bins --tests` reports no mechanical warnings
- [x] 2.2 Group `stream_transcription`'s eight arguments into one request struct built at the call site; verify the too-many-arguments warning is gone and the stream tests pass
- [x] 2.3 Box the `Err` variant in `transcribe` and the transcriptions handler the way `stream.rs` already does, adjusting `format_response`'s error path; verify the large-`Err` warnings are gone and the route test still passes

## 3. Desktop crate

- [x] 3.1 Remove the trailing semicolons after `bail!` at the nine expression-position sites (`cmd/audio.rs`, `cmd/download.rs`, `cmd/server_cmd.rs`, `ffmpeg.rs`, `handoff/devices.rs`, `handoff/transfer.rs` ×2, `server/mod.rs`, `server/process.rs`); verify `cargo check --tests` on Windows reports zero warnings

## 4. Artifact correction and verification

- [x] 4.1 Correct the error-wrapping sentence in `openspec/changes/close-longform-verification-gaps/design.md` to describe the inline-cause message that shipped; verify the sentence matches `with_range` in `server/chunk_cache.rs`
- [x] 4.2 Run the full server suite with the gated models (GigaAM, Parakeet, Nemotron, diarization), `cargo fmt --check`, and `cargo clippy --workspace --tests`; verify zero failures and zero warnings
- [x] 4.3 Run the desktop type check and unit tests; verify they pass and no warning reappears

## Workflow follow-up

- Archive the change after review.
