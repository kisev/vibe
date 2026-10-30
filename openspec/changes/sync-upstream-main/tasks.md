# Tasks

## 1. Merge (stage 1: both engines present, native dormant)

- [x] 1.1 Run `git merge upstream/main` (fetch already done; merge-base `2ea5ecef`) and record the actual conflict list against the design's zone table (`design.md`) in this change's notes (61 conflicts; zone table revised after the fork's single-crate server workspace and the transcribe.cpp/Nemotron incompatibility — live probe: `unsupported architecture (status 5)` — were discovered)
- [x] 1.2 Restore the native stack wholesale: `whisper-rs`, `vad-rs`, `parakeet-rs` (delete/modify → upstream), keep `nemotron-rs`/`nemotron-diarize-rs`/`ggml-rs-sys` as they arrived; `server/Cargo.toml` takes upstream's seven-member list plus the fork's pins; vibe-server's five conflicted sources + its Cargo.toml resolve fork-side
- [x] 1.3 Resolve the updater/channel zone: upstream's channel mechanism adopted; every endpoint → `https://github.com/kisev/vibe/releases/latest/download/latest.json`; minisign key unchanged (`tauri.conf.json`)
- [x] 1.4 Resolve analytics: upstream's in-app client replaces `tauri-plugin-aptabase` (Cargo.toml, main.rs, capabilities); record whether deterministic-daily-session survives, else note the delta as an accepted follow-up
- [x] 1.5 Resolve the remainder per the table: desktop hooks both-sided (upstream mic selection + fork queue changes), `config.ts`/`model.ts`/`download.rs` fork-side diarization + upstream's non-diarization additions, i18n catalogs as a three-way union + `pnpm i18n:generate`, locks re-resolved, docs/website upstream content with fork pointers kept

## 2. Merge validation

- [x] 2.1 Desktop suites green on the merge result: `pnpm tsc` + `pnpm vitest` (`desktop/`)
- [x] 2.2 Server workspace green: `cargo test` on all seven members (`server/`)
- [x] 2.3 Cut a dev build of the merge; it publishes green under the one-dev-release scheme with version base 3.3.0
- [ ] 2.4 Live checks on that build: transcription carries speaker labels from Sortformer v2.1 (unchanged this stage), `winget upgrade` stays quiet, and the ARP identity is `vibe-kisev-fork`

## 3. Stage 2: wire the native engine in

- [x] 3.1 `server/crates/vibe-server/src/server/diarization.rs` routes by model arch: Sortformer GGUFs to the transcribe.cpp engine, Nemotron-3-Diarization to `nemotron-diarize-rs`; probe locally with both GGUFs on disk before committing
- [ ] 3.2 Port upstream's word-timing speaker split (`speakers.rs` + segment splitting) as far as the transcribe.cpp FFI exposes token timings; if the FFI lacks them, keep the fork's overlap-based attribution for transcribe.cpp models and use word timings for native-stack models, and record the FFI gap
- [x] 3.3 Desktop switches the diarization constants to upstream's Nemotron (`vibe-app/nemotron-3-diarization-gguf`, Q8_0, size/sha from upstream config) and moves Sortformer v2.1 into `legacyDiarizationFilenames` + `LEGACY_DIARIZATION_FILES`; the standing startup migration gives Sortformer users the new model automatically
- [ ] 3.4 Validation after stage 2: suites green, dev build green, live transcription carries speaker labels from Nemotron, and a Sortformer-artifact profile gets the re-migration offer

## 4. Deferred (recorded, not this change)

- ASR routing to the native stack for models transcribe.cpp rejects (no known model needs it today; the routing seam from 3.1 is where it lands)
- Analytics deterministic-daily-session parity, if the in-app client differs
