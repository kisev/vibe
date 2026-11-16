# Engine and GPU choices

Vibe separates the desktop shell from the transcription engine. The shell is a Tauri app in Rust and React; the engine is `vibe-server`, a Rust process that calls the transcribe.cpp C++ library on ggml.

## Why the engine is a separate process

The server owns model loading and the heavy compute. Keeping it out of the desktop process means:

- the window can restart without reloading a multi-gigabyte model;
- the same binary serves the app, the CLI, and the local HTTP API;
- a crash in the engine does not take the window with it;
- the engine can be updated on its own schedule, pinned by the app build.

The desktop app talks to the server over local HTTP. Nothing in that path leaves the machine; [Privacy and offline design](/vibe/docs#privacy) covers the network surface.

## One engine, many model families

Every supported family runs through the same ggml build: Whisper, Parakeet, Nemotron, Canary, Qwen3-ASR, Voxtral, and GigaAM. Silero VAD and Nemotron-3 diarization also run on that stack. One engine keeps memory handling, quantization, and GPU dispatch the same for every model.

The trade-off is version coupling: a model whose GGUF needs a newer transcribe.cpp than the bundled build is listed in [Models](/vibe/docs#models) but cannot load until the engine moves. That pin is deliberate, because engine upgrades are parity events, not background dependency updates.

## GPU backends

ggml chooses a backend for the machine it runs on:

| Platform | Backend |
| --- | --- |
| macOS | Metal |
| Windows | Vulkan |
| Linux | Vulkan |

A machine without a usable GPU runs on the CPU. **Settings → Models** carries **Transcribe on CPU** and, on Windows and Linux, a GPU device picker. If a GPU load fails, the app retries on the CPU and reports that it did.

The GPU matters most for large models and long files. Small models on a modern CPU can be fast enough, and the CPU path is the fallback when a driver or the Vulkan loader is missing.

## Related pages

- [Models](/vibe/docs#models) for the catalog and per-family limits.
- [Command line](/vibe/docs#cli) for `vibe-server` options such as `--gpu-device`.
- [Privacy and offline design](/vibe/docs#privacy) for what stays on the machine.
