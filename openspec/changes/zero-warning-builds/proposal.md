# Proposal

## Why

A clean build is the project's baseline: the desktop and server crates are meant to compile without warnings so that a new one is visible the moment it appears. Today `cargo clippy --workspace --tests` in `server/` emits ~95 warnings and the desktop crate emits 8 on `cargo check --tests`, and verification keeps surfacing the design-wording mismatch in the long-form change record. Every one of them is noise the next real warning hides behind.

## What Changes

- Fix every warning `cargo clippy --workspace --tests` reports in the server workspace: mechanical lint fixes in `gigaam-rs` (loop indexing, `div_ceil`, excessive float precision in tests), `whisper-rs` (`chunks_exact`), and `vibe-server` (single-character `push_str`, struct-update leftovers, unused constant, `Option::unwrap_or_else`, `match` to `?`, items after the test module).
- Restructure the two real design smells clippy names: `stream_transcription`'s eight arguments become a parameter struct, and the two `Result<Response, Response>` returns that clippy calls too large box their `Err` variant like `stream.rs` already does.
- Silence generated code instead of fixing it: the bindgen `bindings.rs` in `ggml-rs-sys` gets crate-level targeted allows, because its warnings come from generated FFI shapes that regenerate on every build.
- Fix the desktop crate's eight "trailing semicolon in macro used in expression position" warnings at the `bail!` sites.
- Correct one sentence in `close-longform-verification-gaps/design.md` so the error-wrapping description matches the implementation that shipped.

No behavior changes; every fix is refactoring, literal cleanup, or a lint allow on generated code.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None — `skip_specs: true`: a warning sweep changes no observable behavior, so no requirement changes.

## Impact

- `server/crates/gigaam-rs`, `server/crates/whisper-rs`, `server/crates/ggml-rs-sys`, `server/crates/vibe-server`: lint fixes and two small signature cleanups (`stream_transcription` parameters, boxed `Err` in the transcription handlers).
- `desktop/src-tauri/src`: remove the trailing semicolons after `bail!` in expression position across nine sites.
- `openspec/changes/close-longform-verification-gaps/design.md`: one corrected sentence.
- Callers of `stream_transcription` and of the handlers' `Err` type adjust mechanically; no wire or file format changes.
