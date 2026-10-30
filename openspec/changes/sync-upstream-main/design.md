# Design

## Context

Fork point `2ea5ecef` (2026-10-06); upstream window `2ea5ecef..da8c2ca5` = 16 commits / 151 files, including ~4.4k deleted lines in `server/crates/diarize-rs` (Sortformer engine removal, Nemotron-3-Diarization in its place — #1619), stable/beta update channels (#1677–#1678), an in-app analytics client replacing `tauri-plugin-aptabase` (#1685), and the v3.3.0 bump. The fork side is 132 commits / 508 files. Overlap (files both sides touched): 79, concentrated in the diarization stack, `desktop/src/lib/config.ts`, `desktop/src-tauri/src/cmd/download.rs`, `tauri.conf.json`, workspace `Cargo.toml`/`Cargo.lock`, the i18n catalogs, and docs. Upstream did not touch any fork-only infrastructure: `.github/workflows/dev-build.yml`, `ci-janitor.yml`, `nsis-hooks.nsh`, `tauri.windows.conf.json` are all outside the window.

## Decisions

- **Merge, not rebase.** The fork's 132 commits include 21 signed `dev.*` tags that are the release record; rebase would orphan them. One `git merge upstream/main` with a merge commit; conflicts resolved per the zone table below.
- **Zone table for conflict resolution** (overlap → resolution; revised after the merge started — the fork's server workspace is `vibe-server` alone on the transcribe.cpp FFI engine, while upstream runs seven pure-Rust crates, so the original "diarization stack → upstream wholesale" was wrong for vibe-server itself):
  - `server/crates/{whisper-rs,vad-rs,parakeet-rs}` (delete/modify conflicts) + new upstream crates (`nemotron-rs`, `nemotron-diarize-rs`, `ggml-rs-sys`) → **upstream wholesale**: restore them as workspace members. They are self-contained (path deps on `ggml-rs-sys`), independent of the fork's C++ engine, and land dormant in stage 1.
  - `server/crates/vibe-server/**` (`engine.rs`, `diarization.rs`, `format.rs`, `stream.rs`, `transcription.rs`, `Cargo.toml`) → **fork** for the merge commit: the fork's unified-engine rewrite is coherent and catalog-driven; porting upstream's word-timing/speaker-split work onto it is stage-2 work, not merge-conflict resolution.
  - `desktop/src/lib/config.ts`, `model.ts`, `download.rs` → **both**: stage-1 keeps the fork's Sortformer v2.1 as the diarization model (the native engine is dormant); upstream's non-diarization additions land. Stage 2 switches the diarization constants to upstream's Nemotron and moves Sortformer v2.1 into `legacyDiarizationFilenames` + `LEGACY_DIARIZATION_FILES`. Fork's URL constants stay fork-pointed.
  - `tauri.conf.json`, updater → **both**: adopt upstream's channel mechanism; every endpoint → fork's `latest.json`; signing key stays the fork's minisign pair.
  - Analytics (`desktop/src-tauri/Cargo.toml`, `capabilities/main.json`) → **upstream** (in-app client), dropping the `tauri-plugin-aptabase` git fork. Open question recorded: whether the in-app client preserves the deterministic-daily-session behavior the fork's plugin branch carried — telemetry-continuity, not release-blocking.
  - Desktop hooks (`use-recording.ts`, `use-transcribe-queue.ts`) → **both**: upstream's selected-microphone shortcuts + fork's queue changes.
  - i18n catalogs → **union** (three-way JSON merge, then `pnpm i18n:generate`).
  - Workspace `Cargo.toml`s → **both**: `server/Cargo.toml` takes upstream's member list + fork's pins; root and lock files re-resolved by `cargo`/`pnpm` after.
  - `docs/**`, `website/**`, `.claude/skills/release/SKILL.md` → upstream content, fork's pointers stay where they name the fork.
- **Stage 2 wiring (in this change, after the merge commit):** `diarization.rs` routes by model arch — Sortformer GGUFs to the transcribe.cpp engine, Nemotron to `nemotron-diarize-rs`; upstream's word-timing speaker split (`speakers.rs`) ports only as far as the FFI exposes token timings, and that check happens during stage 2, not now.
- **The two GGML stacks cannot share a binary (discovered during 3.1).** transcribe.cpp vendors GGML 0.26, the native stack builds against the prebuilt GGML 0.22 libraries, and both export the same `ggml_*` symbols — a direct link fails with `duplicate symbol` (proven live), and the versions' ABIs differ too much to share one copy. The prebuilt libraries are also not `-fPIC`, so the native stack cannot become a runtime-loaded shared module either (proven live: `R_X86_64_PC32 … recompile with -fPIC`). Resolution: `server/crates/vibe-diarize-native`, a fork-owned helper binary that links the native stack alone; vibe-server runs it as a child process (mono 16 kHz float WAV in, JSON segments out) when a GGUF declares `nemotron3_diar`. Both vendored stacks stay untouched except one documented clippy-allow line in ggml-rs-sys (upstream never lints `server/` — its root workspace excludes it — while this fork's `server:clippy` is warnings-fatal).
- **Version base 3.3.0.** After the merge the fork's dev versions derive from upstream's bumped version; no fork-side bump is needed.
- **The archived diarization migration gets a second act, for free.** `model-capabilities`' migration requirement is model-agnostic; moving the Sortformer v2.1 GGUF into the legacy list re-runs the whole offer→download→cleanup flow for the users the first migration just moved. Nothing new to build — one list edit.
- **model-comparison (active, 0/9) targets the post-sync engine.** Its catalog and benchmarks should be planned against Nemotron-era `server/`; noted here so that change does not get applied against the pre-sync tree.

## Risks / Trade-offs

- [The 79-file overlap hides a semantic conflict outside the zone table] → validation is end-to-end (tests + a green dev build with live diarization), per the `upstream-sync` spec, not a clean-merge claim.
- [Nemotron's GGUF artifact differs from what installed forks hold] → exactly the case the legacy-list requirement covers; the migration dialog states the download before touching the preference.
- [Upstream's channel switch (#1678) changes updater JSON shape] → the fork's `latest.json` publisher (single-dev-release sets `includeUpdaterJson: false` on dev) is unaffected; stable-channel publishing is 4.3/5.1 territory and stays blocked on signed releases.

## Migration Plan

One merge commit + follow-up commits for the fork-side re-pointing and legacy-list edit, then the standing validation: suites green, dev build green, live diarization and winget-quiet checks on the build.

## Open Questions

- Does upstream's in-app analytics client keep the deterministic-daily-session semantics the fork's aptabase plugin branch provided? (Decide during apply; fallback is accepting upstream behavior and noting the delta.)
