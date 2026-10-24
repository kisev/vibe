# Design

## Context

The server today runs four hand-written Rust engines over one vendored ggml (`ggml-rs-sys`): whisper (Rust port of the whisper.cpp loader), gigaam, parakeet, nemotron, each with its own loader and compute graphs. Adding Qwen3-ASR, canary, or voxtral means writing new LLM-class engines. Upstream `handy-computer/transcribe.cpp` already runs all target families on ggml with verified numerics, publishes per-quant GGUF models with WER benchmarks, and streams for the streaming families. Its own vendored ggml is the collision risk with `ggml-rs-sys`; the migration plan removes the second ggml by construction.

## Goals / Non-Goals

**Goals:**

- One inference core for every ASR family, with the shipped binary linking exactly one ggml.
- Output parity with today's engines before anything is deleted.
- Server HTTP/CLI/capability/cache contracts unchanged.
- Builds on all five CI platforms without regressing the CPU-variant story.

**Non-Goals:**

- ~~Replacing the diarization (sortformer) and Silero VAD Rust adapters in this change~~ — superseded by the user-approved VAD/diarization pivot below (both adapters sat on `ggml-rs-sys`, which the unified engine cannot link).
- Shipping a bundled model catalog (next change: `model-catalog`).
- Porting transcribe.cpp features beyond what the server's contract needs.

## Decisions

- **Consume transcribe.cpp as a crates.io dependency, exact-pinned (`=0.4.1`).** The
  published `transcribe-cpp` / `transcribe-cpp-sys` pair carries the C++ tree and
  builds it via cmake during `cargo build`, so a normal dependency gives source
  builds with no vendored copy in this repo and no external artifacts. The exact
  pin keeps engine upgrades deliberate (a bump changes transcripts, so it re-runs
  the parity proof), and `Cargo.lock` pins it further per build.
  *Revision history:* the change originally vendored the pinned upstream revision
  as a subtree under `server/crates/`; the user rejected that as a C++-world
  anachronism ("pulling dependencies is absolutely normal") and the swap to the
  published crates landed before archiving. The spike had pinned upstream commit
  `4d7c1ccefd39e5a9ea36cca5f8fefc6dcc14b99b`, which is the `release: 0.4.1`
  tag, so the published crates are the same code the parity proofs ran against.
- **The two ggmls never link into one binary (spike finding, task 1.2).** transcribe's ggml objects carry GLOBAL HIDDEN visibility, but rust-lld still rejects them next to `ggml-rs-sys`'s GLOBAL DEFAULT copies (`duplicate symbol: ggml_backend_register`, and the whole registry set); there is no upstream symbol-prefix mechanism, and objcopy redefine-sym surgery is MSVC-fragile. So the transition cannot coexist in-process: vibe-server switches its engine arm wholesale to the unified engine, the legacy crates stay in-tree unlinked until the delete phase, and parity (task 3.1) is proven by comparing transcripts of the pre-switch binary against the new binary on the same fixtures, not by one binary hosting both engines.
- **Phase the cutover so the binary never carries two live ggml paths in a release.** Phase 1 spike (link a hello-world inference into a test binary on WSL + one CI runner; answer: GGUF-only input? whisper decode options? CPU dispatch behavior?). Phase 2 wrapper crate + engine registry routing per family. Phase 3 family-by-family parity proofs. Phase 4 delete `whisper-rs`, `gigaam-rs`, `parakeet-rs`, `nemotron-rs`, `ggml-rs-sys`; the shipped binary then contains transcribe.cpp's ggml only.
- **Keep the `Engine` enum surface and capability tables.** Families route through existing `detect_model`-style metadata detection; each family maps to the capability flags its transcribe.cpp metadata and the handy catalog document. The planner's `max_input_seconds` per family carries over (25 s GigaAM, 30 s parakeet/nemotron; whisper unbounded).
- **CPU variants ride on ggml's runtime dispatch inside transcribe.cpp.** The AVX-baseline fallback (`server_cmd.rs`) keeps working by shipping the same two server builds; the spike verifies baseline x86_64 behavior before phase 3.
- **Cache schema version bumps.** Engine identity in cache keys changes; the bump makes old entries unreachable instead of mismatched. Desktop-owned cache directories simply orphan old entries.
- **Legacy `.bin` handling is an explicit loader error**, naming the format and pointing at the model catalog — never a silent ignore — because existing users have those files on disk.

## Spike answers (task 1.1, WSL, pinned 4d7c1cce)

- **GGUF-only input?** No. `transcribe_model_load_file` also loads legacy whisper.cpp `.bin` and Silero `.bin` files, so the vibe engine layer must reject `.bin` before load to honor the spec's named-format error.
- **Whisper decode options?** Core `RunOptions` carries language, translation task, prompts, vocabulary, timestamp kinds; the `Whisper` run extension adds initial_prompt, temperature(+inc), thresholds, prev-context tokens, seed, max_initial_timestamp. Beam search (`beam_size`/`best_of`/`sampling_strategy`) is NOT exposed — upstream decodes greedy with a multi-tier temperature fallback. Phase 2 must map those knobs to greedy or upstream a patch adding them.
- **C++ standard:** C++17 required (root CMakeLists), gcc 16.2 clean; no bindgen/libclang needed (bindings are committed upstream); cmake 4.4 works unpatched.
- **ggml coexistence:** transcribe's ggml objects carry GLOBAL HIDDEN visibility, so a transition binary linking both `ggml-rs-sys` and the vendored engine does not collide; final proof is the 1.2 CI spike linking both into one binary.
- **Build:** ~44 s cold for the whole C++ tree on the WSL host; the wrapper's test suite runs green; the crates.io build needs no patches (the vendoring-era patch was test-only and never ran in our CI). A canonical jfk.wav run through whisper-tiny Q5_K_M reproduces the reference transcript ("...my fellow Americans...") with segment timestamps and auto-detected `en`.

## Phase 2 findings and the VAD/diarization pivot (user-approved)

- **VAD and diarization move onto transcribe.cpp in this change.** The original plan kept the
  vad-rs and diarize-rs Rust adapters, but both depend on `ggml-rs-sys`, and the spike proved two
  ggmls cannot share a binary — so any server build with the unified engine would fail to link.
  Silero VAD now runs through the transcribe.cpp `VadSession` (the legacy `ggml-silero-v6.2.0.bin`
  container still loads), and diarization through `SortformerDiarizeSession`; the `diarize`
  cargo feature is gone because the engine is one library now.
- **vibe owns the input windows and engine names.** Upstream reports `max_audio_ms = 0` for every
  legacy family (it treats even GigaAM as long-form internally), so the capability mapping keeps
  the documented windows in a vibe-side table: gigaam 25 s, parakeet/nemotron 30 s, whisper
  unbounded. Nemotron models share the `parakeet` GGUF architecture; the `variant` string
  (`nemotron-*`) discriminates the engine name the metadata contract has always reported.
- **GigaAM emits text without segment rows** through the unified engine; when a model input
  yields no segments, the server synthesizes one row spanning that input, so the planner and the
  overlap matcher always place every chunk.
- **Whisper does not stream upstream** (catalog and engine agree): the streaming endpoint serves
  it as a single end-of-run batch. The whisper-only beam knobs (`beam_size`, `best_of`,
  `sampling_strategy`) and `max_segment_len`/`n_threads` are accepted for API compatibility and
  ignored with a one-time warning; decoding is greedy with the temperature fallback, which the
  task 3.1 parity fixtures must account for by comparing greedy on both sides.

## Phase 3 findings (new families)

- **New-family windows are long-form or unbounded, not planner windows.** Upstream reports
  `max_audio_ms = 0` for the legacy families but real bounds for some new ones (canary 400 s).
  A raw bound is only treated as a planner window when the model lacks long-form support and
  the bound is utterance-sized (≤ 60 s); canary's 400 s marks long-form support, so no VAD
  chunking is planned for it.
- **Text-only new families reject segment timestamps** (`unsupported timestamp granularity`,
  status 12): their capabilities cap `max_timestamp_kind` below Segment, so the engine maps the
  request to the highest kind the model supports (None for token/word-capped models) instead of
  failing the run. Whisper keeps full Word/Segment granularity.
- **Streaming families without snapshot segments** (text-only like nemotron/parakeet streaming)
  emit committed-text deltas as segments: each growth of the committed text becomes one segment
  spanning since the previous commit, so the incremental-events contract holds without upstream
  segment snapshots.
- **New-family gated tests** download catalog GGUFs (canary-1b-v2, Qwen3-ASR 0.6B/1.7B,
  voxtral mini 3B, voxtral realtime 4B; sha256 pinned) and assert load + fixture transcription
  + the catalog-documented capability flags per family.

## Phase 4 findings: CPU dispatch, five-platform builds, and the cache bump

- **The old two-backends-in-one-binary mechanism does not carry over, and is not
  needed.** The legacy build baked `ggml-cpu` twice (`_hsw` AVX2 + `_x64` AVX
  baseline, symbols suffixed by `chore build-libs`) and a Rust forwarder picked
  one at runtime. The transcribe.cpp ggml has no static multi-variant mode; its
  runtime-dispatch alternative (`TRANSCRIBE_GGML_BACKEND_DL` + per-ISA modules)
  forces a shared libtranscribe plus module files next to the sidecar — a
  packaging overhaul across all five platforms that this change does not buy.
- **Distribution builds pin the portable AVX floor instead.** The x86_64 Linux
  and Windows cells of `dev-build.yml` and `server-release.yml` pass
  `TRANSCRIBE_CMAKE_ARGS` with `GGML_NATIVE=OFF` + `GGML_SSE42/AVX/F16C=ON` +
  `GGML_AVX2/FMA/BMI2=OFF` — byte-for-byte the legacy `_x64` baseline tier, so
  one self-contained binary runs on every x86-64 CPU since 2011 (verified
  locally: the floored `libggml-cpu.a` disassembles to 0 AVX2/FMA/AVX512
  opcodes, 6172 AVX1, 282 SSE4.2; the native default has 1517). Local builds
  stay native-tuned.
- **The speed cost is small because tinyBLAS dispatches at runtime.** ggml's
  llamafile sgemm (`GGML_LLAMAFILE`, forced ON) selects AVX2/FMA/AVX512- class
  kernels per CPU at runtime for the matmul hot path, so the floored ggml
  kernels lose little on modern machines.
- **The desktop illegal-instruction fallback stays as a safety net and can no
  longer fire from our code** (the shipped binary needs no AVX2);
  `VIBE_SERVER_CPU_VARIANT` stays accepted and is simply inert. macOS floors are
  unchanged: the sys crate pins SSE4.2+AVX+F16C on x86_64 and a portable arm64
  build (native tuning is slower there anyway), so macOS needs no workflow flag.
- **Five-platform release builds proven in CI already.** The `Dev Build` run on
  `0bb3dddb` built `vibe-server --release` green on all five platforms
  (arm64+cross-x86_64 macOS, amd64+arm64 Linux, Windows MSVC), and the spike
  matrix (Linux + Windows) is green — cmake ≥ 3.16 is the only build-time
  requirement and every hosted runner has it; libclang is never needed
  (bindings are committed upstream).
- **GPU on Linux/Windows regresses to CPU-only in this change.** The legacy
  build linked a prebuilt `libggml-vulkan` and dlopened the Vulkan loader at
  runtime; the unified engine builds CPU-only there by default. Metal on macOS
  is unchanged (the sys crate's default feature). Restoring Vulkan is a
  follow-up wiring job, not a fork: the `vulkan` cargo feature exists in
  `transcribe-cpp-sys` (`TRANSCRIBE_VULKAN=ON`); what is missing is SDK/glslc
  provisioning in CI and runtime-loader packaging.
- **Cache schema bumped 1 → 2.** The key hashes the schema version, so every
  entry written by the hand-written engines lands at a directory the unified
  engine never opens: nothing is reused, nothing is corrupted, old entries
  simply orphan until the desktop's age cleanup removes them. A regression test
  pins the bump (same inputs, different key at version 1 vs 2) and one proves a
  schema-1 directory with stored output is left untouched by a fresh run.

## Phase 5: deletion (tasks 5.1–5.2)

- Removed: `whisper-rs`, `gigaam-rs`, `parakeet-rs`, `nemotron-rs`, `ggml-rs-sys`,
  `vad-rs`, `diarize-rs` (the workspace's only member is `vibe-server`), the
  prebuilt-libs pipeline (`server/libs/`, `server-libs.yml`, the dev-build fetch
  step, `chore fetch-libs` in server-release and the root chorefile's
  server-build), and vibe-server's legacy `build.rs` (cpu-variant linker
  surgery + Vulkan delayload — both meaningless without the second ggml).
- Link check on the release binary: 515 defined `ggml_*` symbols, zero
  duplicates; `ggml_backend_cpu_reg` and `ggml_time_init` defined exactly once.
  The binary transcribes the whisper fixture from GGUF correctly (25 MB).
- Post-deletion regression: the full gated suite (94 unit + 1 route + 10 CLI,
  all families incl. the five new ones) is green; clippy `-D warnings` clean.
- Docs updated: `server/README.md` (GGUF pull example, legacy .bin notice),
  `server/docs/ARCHITECTURE.md` and `docs/ARCHITECTURE.md` (unified engine,
  cmake-from-source build, one-ggml link).

## Post-approval revision: crates.io dependency instead of the vendored subtree

Before archiving the user reversed the vendoring decision: the vendored
`server/crates/transcribe-cpp{,-sys}` trees (and their VENDOR.md patch notes)
were deleted and vibe-server now depends on the published crates
(`transcribe-cpp = { version = "=0.4.1", default-features = false }`), which
carry the same C++ sources at the same revision the parity proofs ran against.
Verified after the swap: the release build reproduces the whisper fixture
transcript byte for byte, the full gated suite (94 + 1 + 10) is green, and the
link check still shows zero duplicate `ggml_*` definitions. The spike CI
workflow now builds vibe-server with the dependency and runs a real inference
on Linux and Windows (no libclang, no SDKs). The one vendoring-era local patch
lived in the wrapper's own test suite, which our CI never ran, so nothing was
lost; future patches go upstream-first and arrive as dependency releases.

## Risks / Trade-offs

- [C++ toolchain friction on one of the five platforms] → Spike covers WSL + a Windows runner first; MSVC/gcc/clang all support the required C++ standard, and dev-build already compiles C (ggml) everywhere.
- [Upstream drift breaks a pinned revision] → Pinned subtree + patch series; upgrades are deliberate.
- [Numerics differ subtly from the hand-written engines] → Phase 3 gates every family on side-by-side transcripts against today's output for the regression fixtures; deletion is refused until parity holds.
- [Streaming families change segment cadence] → The stream endpoint contract (newline-delimited events) is unchanged; cadence is engine-internal.
- [Scope creep into VAD/diarization] → Explicit non-goal; separate follow-up change.

## Migration Plan

Phases 1–4 above, each landing behind tests; users migrate by downloading catalog GGUFs when their `.bin` files stop loading (the catalog change follows immediately). Rollback per phase is a revert; the delete phase is irreversible only in that re-adding crates is git history away.

## Open Questions
