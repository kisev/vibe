# Tasks

## 1. Manifest

- [x] 1.1 Enable the Vulkan feature for Windows and Linux targets in `server/crates/vibe-server/Cargo.toml` (`cfg(windows)` and `cfg(target_os = "linux")` entries, macOS `metal` unchanged, plain dependency line stays CPU-only)
- [x] 1.2 Install the local build prerequisites on the openSUSE dev host (`sudo zypper install vulkan-devel shaderc-devel` — manual, user-run) and confirm `cargo build -p vibe-server` configures with `GGML_VULKAN=ON`

## 2. CI

- [x] 2.1 Add the Vulkan SDK prerequisite step to the Windows cells and `libvulkan-dev glslc` to the Linux cells of `dev-build.yml`; confirm jammy has `glslc` or wire the LunarG tarball fallback
- [x] 2.2 Add the same prerequisite steps to `server-release.yml` and `transcribe-spike.yml` (`server-test.yml` downloads release archives instead of building, so it needs none)
- [x] 2.3 Keep the local gates green: `task server:clippy server:test server:deny server:machete` pass with the feature enabled

## 3. Docs and validation

- [x] 3.1 Document the Linux/Windows build prerequisite in `server/docs/BUILDING.md`
- [ ] 3.2 Cut a dev build (dev.41) and confirm the Windows `vibe-server.exe devices` lists the RTX 5070 Ti and a transcription runs on the GPU; enumeration stays empty-but-working on machines without Vulkan
