# Proposal

## Why

Since the unified engine landed (dev.37+), every Windows and Linux build ships ggml **without a GPU backend**: `transcribe-cpp` was pinned with `default-features = false` and only macOS got `features = ["metal"]`, so `vibe-server devices` returns `[]`, every GPU load fails, and the app silently falls back to CPU. The legacy whisper-era builds linked prebuilt ggml libraries with Vulkan baked in, which is why 3.2.2 worked. Any tree-built server — dev builds today, the next `server-v0.9.0` release — inherits the regression.

## What Changes

- `server/crates/vibe-server/Cargo.toml` enables `transcribe-cpp`'s `vulkan` feature for `cfg(windows)` and `cfg(target_os = "linux")` targets (macOS keeps `metal`); CPU stays the always-present fallback.
- Build workflows that compile the server from the tree (`dev-build.yml`, `server-release.yml`, `transcribe-spike.yml`; `server-test.yml` downloads release archives instead of building) install the Vulkan build prerequisites (headers + `glslc`) on their Windows and Linux cells; runners without them would fail the cmake configure.
- `server/docs/BUILDING.md` documents the Linux/Windows build prerequisite, and the WSL dev host gets the same packages once so the local gates keep building.
- Validation: a dev build cut after the fix must list the user's GPU in `devices` and transcribe on it; a machine without a usable Vulkan loader keeps working exactly as today (CPU enumeration, explicit CPU choice).

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `asr-engines/transcribe-cpp`: adds the GPU-backends-per-platform requirement the unified-engine port dropped — Vulkan on Windows and Linux, Metal on macOS, CPU everywhere, no new runtime dependencies for users (the Vulkan loader is opened from the GPU driver, as before the engine switch).
