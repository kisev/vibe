# Architecture

Vibe is a desktop transcription app built with Tauri (Rust plus a TypeScript/React frontend). Transcription runs in a local server process; nothing leaves the machine.

## Components

### Desktop app (`desktop/`)

- **Frontend**: TypeScript and React. UI, settings, transcript views, and the meeting browser.
- **Backend**: Rust in `desktop/src-tauri/`. Owns the window, file management, settings, model downloads, recording, and the updater.
- Spawns `vibe-server` and talks to it over local HTTP.

### Server (`server/`)

- **Language**: Rust on ggml, through the `transcribe-cpp` dependency (`=0.4.1`, exact-pinned).
- **Workspace**: its own Cargo workspace; the crate and binary are `vibe-server`.
- **Purpose**: one local process for audio transcription, model loading, streaming, and diarization, behind an OpenAI-compatible HTTP API.
- Every ASR family (whisper, gigaam, parakeet, nemotron, canary, qwen3, voxtral) plus Silero VAD and Sortformer diarization runs through the one ggml — exactly one `ggml_*` symbol set links into the binary.
- **Native diarization helper**: `vibe-diarize-native` runs Nemotron-3 diarization beside the server, because the native stack's prebuilt ggml cannot share a binary with transcribe.cpp's ggml.
- **Build**: cmake compiles the transcribe.cpp C++ sources during `cargo build`; there are no prebuilt engine libraries. `server-release.yml` publishes `server-v*` prereleases; `server-test.yml` runs a release across platforms.
- **Distribution**: the app downloads the release named by `.server-version` at build time through the `setup` task in the root `chorefile`. `chore server-build` stages an in-tree build instead. See [Build the server](../how-to/build-the-server.md).

### Other crates

- `crates/meeting-detect/`: meeting detection shared with the desktop app.
- `handoff/`: phone-to-desktop audio handoff over iroh — the PWA (`pwa/`), the wasm client (`wasm/`), and a probe CLI (`probe/`). The desktop half lives in `desktop/src-tauri`.

### FFmpeg

- macOS and Windows bundles ship `ffmpeg` from the server release archives.
- Linux uses the system `ffmpeg` (the `.deb` declares the dependency).
- Vibe passes the bundled path to the server with `VIBE_SERVER_FFMPEG_PATH`.

## Build flow

1. The release workflow runs `chore setup <target-triple>`.
1. `setup` downloads the prebuilt `vibe-server` (and `ffmpeg` where the platform bundles it) from the `server-v*` release named in `.server-version`.
1. The binaries land in `desktop/src-tauri/binaries/` with the target triple in the name.
1. Tauri bundles the sidecars named by `externalBin` into the final app.

## Key point for agents

Native runtime compatibility problems in transcription usually come from the server or its linked ggml libraries, not the Vibe UI.

To fix one, change `server/` (a ggml fix goes in `server/libs/patches/` with a revision bump), tag a `server-v*` release, then bump `.server-version` here. See `server/docs/BUILDING.md` for the engine workspace.
