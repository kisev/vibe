# Notes

## Prerequisite audit — every workflow that compiles the server

| Workflow | Linux (noble) | Linux (jammy) | Windows |
|---|---|---|---|
| `dev-build.yml` | `apt libvulkan-dev glslc glslang-tools spirv-headers` | LunarG apt repo (`vulkan-sdk`) | LunarG installer headless (llama.cpp flags, pinned 1.4.357.0) + `LIB` export for the by-name loader link |
| `server-release.yml` | same | same | same |
| `transcribe-spike.yml` | same noble apt | — (n/a) | same Windows SDK step |
| `lint.yml` | `apt libvulkan-dev glslc glslang-tools spirv-headers` (landed in e429a999 after seven red runs — clippy compiles the engine with `GGML_VULKAN=ON`) | — (n/a) | — (clippy runs on Linux only) |

Workflows that never compile the server from the tree — `server-test.yml` (downloads release archives) — need none.

## Janitor dry test (2026-10-26)

The first selection rule (all `failure`/`cancelled` runs within 24h, `run_attempt < 3`) matched 17 runs: 8 failures and 8 cancels on dev-build, 1 website failure. Most were deliberately cancelled debug iterations or superseded revisions — resurrecting them would have burned ~16 full matrix runs on builds known to be broken. The rule became **latest run of each workflow only**, re-validated against the same data: dev-build's latest is dev.43 (green, untouched), website's latest was mid-rerun (left alone; a later failure would be healed once, attempt 2 < 3).
