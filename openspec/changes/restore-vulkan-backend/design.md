# Design

## Context

The engine port replaced the prebuilt-ggml linking (`ggml-rs-sys` + `libs/` bundles built with the Vulkan SDK) with a from-source cmake build inside `transcribe-cpp-sys`. GPU backends became cargo features (`vulkan`, `metal`, `cuda`, `rocm`), all default-off; the port enabled `metal` for macOS ("matching the legacy build") but enabled nothing for Windows and Linux, so those builds compile ggml CPU-only. `transcribe-cpp-sys`'s build script maps the `vulkan` feature to `TRANSCRIBE_VULKAN=ON` → `GGML_VULKAN=ON`.

## Decisions

- **Vulkan only, no CUDA/ROCm.** Vulkan is what the legacy builds shipped on Windows/Linux, needs no vendor toolchain, and opens the loader from the GPU driver at runtime — users install nothing. CUDA/ROCm remain opt-in upstream features; adding them is a later decision, not this fix.
- **Target-gated features in the server manifest.** `[target.'cfg(windows)'.dependencies]` and `[target.'cfg(target_os = "linux")'.dependencies]` entries add `transcribe-cpp = { version = "=0.4.1", default-features = false, features = ["vulkan"] }`; macOS keeps its existing `metal` entry. The plain non-macOS dependency line stays CPU-only so no target accidentally double-pins conflicting feature sets.
- **Build-time SDK, runtime loader.** Compiling GGML_VULKAN needs Vulkan headers and `glslc` at build time only; the binary still opens `vulkan-1`/`libvulkan` from the driver at runtime, so distribution size and user requirements do not change.
- **CI prerequisites per runner.** Windows runners: the official LunarG installer run headless exactly as llama.cpp's build-vulkan CI does (`--accept-licenses --default-answer --confirm-command install`, version pinned at 1.4.357.0, `VULKAN_SDK` and the `Bin` dir exported for cmake, plus the SDK's `vulkan-1.lib` directory prepended to `LIB` because cmake links the loader by absolute path while `transcribe-cpp-sys` links `vulkan-1` by name) — well under a minute on the runner; the `/S` and `--mode unattended` forms hang headless runners, and a vcpkg source build of shaderc ran 10+ minutes, so the installer is the keeper. Linux runners: noble gets `apt-get install -y libvulkan-dev glslc glslang-tools spirv-headers`; jammy has no `glslc` package and its `spirv-headers` ships no cmake config, so that cell uses the LunarG apt repo (`vulkan-sdk`) instead of a runner bump (the 22.04 cell exists for the older glibc floor). macOS cells are untouched. Workflows that build the server from the tree get the same step: `dev-build.yml`, `server-release.yml`, `transcribe-spike.yml`, and `lint.yml` (clippy compiles the engine too; `server-test.yml` downloads release archives instead of building).
- **Local builds document the prerequisite.** `server/docs/BUILDING.md` gains a distro-neutral line (Vulkan headers + `glslc`). The dev host is openSUSE Tumbleweed: `sudo zypper install vulkan-devel shaderc-devel` once (manual, run by the user; `shaderc-devel` carries the `glslc` binary there) so `server:clippy`, `server:test` and the pre-push gate keep building.

## Risks / Trade-offs

- \[jammy `glslc` availability\] → verify during apply; fallback is the versioned LunarG tarball, not a runner bump that would raise the glibc floor.
- [Windows SDK install adds ~1 min per cell] → the headless installer finishes in 30–60 s (llama.cpp's CI does the same daily); a step-level `timeout-minutes: 8` fails fast if a future SDK release regresses the silent mode.
- [Vulkan shader compilation lengthens the ggml build] → one-time cost per build, minutes scale with the existing cmake step.
- [Machines with broken/mismatched drivers] → already the pre-port reality: enumeration returns nothing or the load fails and the desktop falls back to CPU; the fallback path is unchanged.

## Migration Plan

One commit on the manifest + CI + docs; validation is a dev build (dev.41) whose Windows `vibe-server.exe devices` lists the reporter's GPU (RTX 5070 Ti) followed by a real transcription run on it. No data or config migration.

## Open Questions

- None blocking. CUDA opt-in for large-VRAM NVIDIA rigs can be its own later change.
