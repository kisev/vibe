# Notes

## Task 1.1 — actual conflict list (61 files) vs design zone table

Merge `upstream/main` (`da8c2ca5`) into fork `main` (`62a31f9` + uncommitted change artifacts), merge-base `2ea5ecef`.

Zones (from design.md) and the files that actually landed in each:

- **Diarization stack → upstream wholesale**: `server/crates/vibe-server/src/engine.rs`, `src/server/diarization.rs`, `src/server/format.rs`, `src/server/stream.rs`, `src/server/transcription.rs`, `server/crates/vibe-server/Cargo.toml`, `server/crates/parakeet-rs/scripts/export.py`, `server/crates/vad-rs/src/model.rs`, `server/crates/whisper-rs/src/{context,lib,vocab}.rs` (12)
- **Desktop model config → both**: `desktop/src/lib/config.ts`, `desktop/src/lib/model.ts`, `desktop/src-tauri/src/cmd/download.rs` (3)
- **Updater/channel → both**: `desktop/src-tauri/tauri.conf.json` (1)
- **Analytics → upstream**: `desktop/src-tauri/Cargo.toml`, `desktop/src-tauri/src/main.rs` (auto-merged, only Cargo.toml conflicted), `desktop/src-tauri/capabilities/main.json` (1 + 2 auto)
- **i18n catalogs → union**: `i18n/desktop/*.json` × 23 (23)
- **i18n docs → union**: `i18n/docs/*/models.md` × 14 (14)
- **Workspace locks → both, re-resolve**: `Cargo.toml` (root), `server/Cargo.toml`, `server/Cargo.lock` (3)
- **Docs/skill → upstream content, fork pointers**: `docs/ARCHITECTURE.md`, `server/docs/ARCHITECTURE.md`, `.claude/skills/release/SKILL.md` (3)
- **Desktop hooks (outside zone table — inspect)**: `desktop/src/pages/home/hooks/use-recording.ts`, `desktop/src/pages/main/hooks/use-transcribe-queue.ts` (2) — fork changed transcribe-queue (diarization migration mocks) and recording; upstream changed both (mic selection #1689, diarization switch)

61 total. Notes per zone as they resolve below.

## Resolution log (tasks 1.2–1.5)

- Native stack restored **whole-tree** from `upstream/main`: delete/modify conflicts resolved theirs (`whisper-rs`, `vad-rs`, `parakeet-rs` single files), and the files upstream never touched in the window (so the merge left deleted) restored explicitly: `ggml-rs-sys`, unmodified halves of `whisper-rs`/`vad-rs`/`parakeet-rs`, `nemotron-rs` additions, and `server/libs/` (headers are committed; prebuilt `libs/lib` fetched per machine from the public `libraries-ggml-v0.22.0-r6` release — not tracked, already ignored by `server/.gitignore`).
- `vibe-server` resolved fork-side in full (`engine.rs`, `diarization.rs`, `format.rs`, `stream.rs`, `transcription.rs`, `Cargo.toml`, `mod.rs`); upstream's new `speakers.rs` (word-timing split, stage-2/3.2) removed from this merge — it imports `whisper_rs`, which the fork's vibe-server does not depend on. Auto-merged `mod speakers;` line removed with it.
- Updater: upstream's runtime channel picker (`src-tauri/src/updater.rs`) auto-merged in pointing at `thewh1teagle.github.io/vibe/updater` — repointed to `https://kisev.github.io/vibe/updater`; the channel JSONs shipped under `website/public/updater/` replaced with empty-platform stubs (`version 0.0.0`): the fork has no stable releases, so the updater must offer nothing rather than upstream's signed binaries. `tauri.conf.json`: upstream structure + version 3.3.0, fork pubkey + fork endpoint default.
- Analytics: upstream's in-app client landed (mod.rs/client.rs + `analytics.rs` → `analytics/` move); fork builds are inert without `APTABASE_APP_KEY`. Session delta recorded: upstream keeps a store-stable session id; the fork's plugin branch rotated daily — accepted difference (deferred list).
- Desktop model zone fork-side (`config.ts`, `model.ts`, `download.rs`, both hooks); upstream's legacy-name exclusion ported into `model.ts` under the fork's `legacyDiarizationFilenames` export. Desktop `Cargo.toml` theirs (drops aptabase/cpal/nspanel forks; adds analytics + system-audio deps). capabilities theirs (+start-dragging, −aptabase permission).
- i18n: 23 catalogs three-way unioned (fork +~40 keys, upstream +3 keys each); 14 docs pages `git merge-file` unioned — the only conflicting line in every one was the translation `<!-- source: hash -->` stamp, kept fork-side (stale until /translate re-stamps).
- Workspace: root `Cargo.toml` takes upstream `eyre 0.6.14`; `server/Cargo.toml` seven members + comment; `server/Cargo.lock` theirs then re-resolved by cargo.

## Verification (stage 1)

- Desktop: `pnpm i18n:generate`, `pnpm tsc` clean, `pnpm vitest run` 40 files / 221 tests passed.
- Server: `cargo test --workspace` green on all seven members (133 tests; 94 in vibe-server, 39 across the native crates). Local build needed the libclang wheel workaround (memory: wsl-libclang) — CI unaffected.

## Stage 2 (3.1–3.3)

- The two GGML stacks cannot share a binary: transcribe.cpp vendors GGML 0.26, the native stack pins the prebuilt GGML 0.22 (`server/libs`), same exported symbols, incompatible ABIs — direct link proven to fail (`rust-lld: duplicate symbol: ggml_backend_device_register`). The prebuilt libraries are not `-fPIC`, so a runtime-loaded shared module fails too (`R_X86_64_PC32 … recompile with -fPIC`). Resolution: fork-owned `server/crates/vibe-diarize-native` helper binary (native stack alone; WAV in, JSON segments out), spawned by vibe-server when a GGUF declares `nemotron3_diar`. Probed live with both GGUFs on `fixtures/6_speakers.wav` — sortformer v2.1 (sha matched the shipped constant) and Nemotron Q8_0 (sha matched upstream's constant); the two engines' speaker maps agree to tenths of a second.
- ggml-rs-sys carries the one fork-side deviation from byte-identical: three clippy allows over its generated bindings (missing_safety_doc, unnecessary_transmutes, ptr_offset_with_cast). Upstream never lints `server/` — its root workspace excludes it — while this fork's `server:clippy` is warnings-fatal over every workspace member in the graph.
- 3.2 FFI gaps recorded: the transcribe.cpp FFI exposes word rows (`Transcript.words`, word-or-finer families only), so upstream's split ports for the batch path; streaming deltas and the GigaAM synthetic row carry no word timings and keep overlap attribution; `srt`/`vtt` are not speaker formats and stay unsplit.
- 3.2 surfaced a pre-existing chunk-offset bug, now fixed: `segments_for` mapped chunk-relative engine times to output verbatim, so bounded families (parakeet/nemotron chunked runs) reported every chunk starting at ~0 s — and diarization matched them all to the first speaker turn. GigaAM (synthetic row, already offset) and long-form whisper were unaffected. Live probe after the fix: absolute times across the recording, speaker changes split correctly (2,2,3,4,4,4,5,5,3 on the six-speaker fixture).
