# Building vibe-server

## Architecture

The C library (ggml) and the vibe-server binary are built separately:

1. **`libs/`** holds everything that determines the libraries: `libs/ggml-version` (the ggml release tag) and `libs/patches/` (fixes ggml has not taken yet). The build recipe is `scripts/ggml_libs.sh`; every task reads the tag from `libs/`.
1. **`task libs:build`** clones ggml at that tag, applies the patches, builds the static libraries for the current platform, and packages them; **`task libs:upload`** does that and uploads the archive to the GitHub release tagged `libraries-ggml-{tag}-r{revision}`, with the revision from `libs/revision` (`task libs:tag` prints the whole name). Bump the revision in the same commit as any change under `libs/`, and reset it to 1 when the ggml tag moves, so a changed bundle never replaces the one older server tags still link against. The release notes record the git tree hash of `libs/` (`task libs:id`); `task libs:upload` fails when the tag already exists for another tree, which is what a forgotten bump looks like, and refuses uncommitted changes under `libs/`.
1. **`task libs:fetch`** downloads the prebuilt static libraries for the current platform from the release named by the current `libs/` into `libs/lib/` (ignored by git).
1. **`task server:fetch-headers`** fetches the C headers into `libs/include/`, checked into git: they come from the same ggml tag as the libraries, so a header change changes the `libs/` tree like any other input.
1. The binary links against `libs/include/` and `libs/lib/`.

This separation means contributors never need to build ggml locally; they just fetch the libraries.

Tasks live in `taskfile.yml` at the repository root. `task --list` shows them all.

## Prerequisites

- [Rust](https://www.rust-lang.org/tools/install)
- [mise](https://mise.jdx.dev/) for the pinned `task` runner

## Quick start

```bash
task server:fetch-headers
task libs:fetch
cargo build -p vibe-server --release
```

On Windows, the vibe-server binary uses Rust's default MSVC target. The Vulkan loader is opened at runtime, so running vibe-server needs no Vulkan SDK. Building does need the Vulkan headers plus `glslc`, `glslangValidator`, and the SPIRV-Headers cmake config:

- **Ubuntu 24.04 / openSUSE**: `sudo apt install libvulkan-dev glslc glslang-tools spirv-headers` / `sudo zypper install vulkan-devel shaderc glslang-devel spirv-headers`
- **Ubuntu 22.04**: no `glslc` package and a config-less `spirv-headers` — use the [LunarG repo](https://packages.lunarg.com/) and install `vulkan-sdk`
- **Windows**: `choco install vulkansdk` (or the LunarG installer), with `VULKAN_SDK` on the environment

```bash
cargo build -p vibe-server --release
```

The library workflow also builds a `windows-amd64-gnu` ggml bundle for compatibility (`VIBE_SERVER_WINDOWS_LIB_FLAVOR=gnu`), but release binaries use `windows-amd64-msvc`.

### Two CPU backends on x86_64

AVX2 is compiled into every ggml CPU kernel, so one build cannot serve a CPU without it. On x86_64 the bundle carries the CPU backend twice, `ggml-cpu-hsw` (AVX2, FMA, BMI2) and `ggml-cpu-x64` (AVX baseline), with every symbol suffixed so both link into the one binary. `ggml-rs-sys` defines `ggml_backend_cpu_reg` in Rust and forwards to the build the CPU can run. The suffixing needs `nm` and `objcopy` (`llvm-nm` and `llvm-objcopy` for MSVC), which `task libs:build` runs (`stage_cpu_variant` in `scripts/ggml_libs.sh`); `task libs:fetch` users need nothing extra.

### Patches

`libs/patches/` holds fixes ggml has not taken yet; `task libs:build` applies every `*.patch` there after the checkout. Each patch starts with a note saying what it is for and where upstream stands. When a bumped tag already carries a fix, `git apply` fails the build: delete the patch.

## Bumping ggml

1. Update the tag in `libs/ggml-version`
1. Run `task server:fetch-headers` and commit the updated headers
1. Set `libs/revision` to 1, commit, then run `task libs:upload` on each platform. The same applies to any change under `libs/`, with the revision bumped instead: the bundle for the new tag must exist before a server release can fetch it

## Packaging a release archive

`task server:package-release -- <binary> <darwin|windows> <amd64|arm64> <out.tar.gz|out.zip>` bundles a built `vibe-server` binary with ffmpeg the way the release workflow does.

## Releasing binaries

`Release vibe-server` workflow builds and uploads Rust `vibe-server` binaries for:

- Linux: `amd64`, `arm64`
- macOS: Apple Silicon and Intel
- Windows: `amd64`

It also injects the CLI version at build time via environment variables:

```bash
VIBE_SERVER_VERSION=<tag> VIBE_SERVER_COMMIT=<sha> cargo build -p vibe-server --release
```

You can run releases in two ways:

1. Push a tag like `v0.1.0` (workflow trigger: `push tags: v*`)
1. Manual dispatch with input `version` (example: `v0.1.0`)
