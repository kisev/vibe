# vibe-server 🎧

vibe-server is a local transcription runner built on top of ggml.cpp.

It runs as a standalone process and exposes an OpenAI-compatible HTTP API, so other apps (desktop apps, Python scripts, etc.) can spawn it and talk to it easily.

Think of it as a small, fast, local Whisper server you control.

It is the engine of [Vibe](https://github.com/thewh1teagle/vibe) and lives in this repository under `server/`; it also runs on its own.

---

## Why vibe-server ✨

- Fully local transcription
- Cross-platform single binary
- GPU-accelerated by default
- OpenAI-compatible API
- Designed to be spawned and owned by another process
- No heavy setup, no long-running system service

---

## Platform & GPU Support 🚀

vibe-server ships prebuilt binaries for:

- macOS (x86_64 and arm64)
- Linux (x86_64 and arm64)
- Windows (x86_64)

GPU acceleration is enabled by default:

- macOS: CoreML / Metal
- Linux: Vulkan
- Windows: Vulkan

vibe-server automatically uses the best available backend for the platform.

---

## How It Works 🧠

1. Your app starts the vibe-server process
2. vibe-server binds to a local port (optionally chosen by the OS)
3. Your app talks to vibe-server over HTTP
4. Models are loaded and unloaded at runtime
5. Transcription requests go through an OpenAI-compatible endpoint

vibe-server is intentionally simple and predictable, so it can be embedded into larger systems.

---

## Quick Start ⚡

### 1. Download a release binary

https://github.com/thewh1teagle/vibe/releases?q=server-v

### 2. Download a model

Models are GGUF files (the legacy whisper.cpp `.bin` container is no longer
supported; the error names it and points at the catalog).

```console
./vibe-server pull https://huggingface.co/handy-computer/whisper-tiny-gguf/resolve/main/whisper-tiny-Q5_K_M.gguf
```

### 3. Start vibe-server

```console
./vibe-server serve --port 0
```

Using port 0 lets the OS assign a free port automatically.

When ready, vibe-server prints a single machine-readable line to stdout:

```json
{ "status": "ready", "port": 52341 }
```

This is intended for parent processes to detect readiness and discover the bound port.

---

## Using vibe-server 🔌

vibe-server exposes an OpenAI-compatible transcription API.

This means:

- You can use existing OpenAI SDKs
- You don’t need custom client code
- Switching between local (vibe-server) and remote (OpenAI) is trivial

See the full API reference here:

- API docs: /docs
- OpenAPI spec: /openapi.json

### Long recordings and the chunk cache

Long files are split into model inputs before inference. Every engine with an
input bound is planned, with or without a diarization model. With one, the
split follows speaker turns, so one input never mixes two speakers except at
an explicitly marked boundary, and speech the diarization model missed — a
speaker past its limit, a noisy passage — is still transcribed, in its own
input without a speaker. Without one, the split follows detected speech
pauses, the chunks carry no speakers, and speakers stay attributed by overlap.
Whisper is never planned: its internal long-form decoding owns the whole file.
Segments from a planned chunk carry the chunk's
`speakers` array: one id, or several on a boundary line, whose `speaker` names
the one covering most of it.

- The planner aims at about 20 seconds per input, never exceeds the engine
  maximum, and prefers cutting in a pause near that target.
- `--chunk-seconds <n>` lowers that ceiling. It defaults to the engine maximum
  (25 s for GigaAM, 30 s for Parakeet and Nemotron) and cannot exceed it.
- `--cache-dir <path>` (or `VIBE_SERVER_CACHE_DIR`) stores the chunk plan and
  every finished chunk, so a run killed half-way resumes instead of starting
  over. The key covers the decoded audio, the model, the engine, the options
  and the plan, so changing any of them starts a fresh entry.
- A chunk the engine cannot fit in memory is split in half and the halves are
  tried, down to a one-second minimum. The split is stored with the entry, so a
  resumed run starts from the halves instead of failing on the full size again,
  and every half that finished is reused.
- The cache is opt-in: without a directory nothing is written. Cached files
  hold transcript text, the plan and the model stamp — never the audio — and
  live only on the local disk. Delete the directory at any time; the desktop
  app keeps its own under the app's local data directory and removes entries
  untouched for 30 days at startup.

---

## Notes & Limitations

- One transcription runs at a time per process  
  concurrent requests return 429
- Non-WAV audio is automatically converted using ffmpeg
    - system ffmpeg or a bundled binary next to vibe-server

---

## When to Use vibe-server 🎯

vibe-server is a good fit if you want:

- Local or offline transcription
- Low-latency transcription in desktop apps
- Full control over models and hardware
- An OpenAI-like API without the OpenAI dependency

---

## Documentation 📚

- API reference: /docs
- OpenAPI schema: /openapi.json
- Releases: https://github.com/thewh1teagle/vibe/releases?q=server-v
