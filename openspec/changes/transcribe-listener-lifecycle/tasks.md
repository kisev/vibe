# Tasks

- [ ] 1. Add a guard type in `desktop/src-tauri/src/cmd/transcribe.rs` that owns the `EventId` returned by `app_handle.listen("abort_transcribe", …)` and calls `unlisten` on drop; keep the `AtomicBool` it shares with the command.
- [ ] 2. Replace the bare `listen` call with the guard, created before the preprocessing pass and bound for the whole command so it drops on every return path.
- [ ] 3. Unit-test the guard's drop behaviour (the unlisten call happens exactly once, including when the command returns early).
- [ ] 4. `cargo test -p vibe --bin vibe cmd::transcribe` and `cargo clippy -p vibe --bin vibe --all-targets` stay clean.
