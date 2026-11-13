# Proposal

## Why

Manual acceptance of app changes waits on the GitHub runner pool: a dev tag costs a matrix build, and the macOS cells in particular are cancelled at random, while Linux and Windows cells take tens of minutes. The workstation can build Windows itself — the Windows host already has the MSVC toolchain, pnpm and WebView2 — so a revision can be turned into an installer in minutes, locally, without publishing anything.

WSL is used for the terminal and the repository; the GUI the app is tested in is Windows. A local build therefore targets Windows first. Linux bundles are not required for acceptance and are left out until asked for.

## What Changes

- New `scripts/local_windows_build.sh`, driven by `task app:build`: sync the working tree to a Windows checkout (path from `VIBE_WIN_CHECKOUT`, default `<Windows home>\vibe-build`), install dependencies there, and run `pnpm tauri build --bundles nsis` through `powershell.exe`.
- The build carries `1.0.0-local.<YYYYMMDD>.<sha>` through a Tauri `--config` override, so a local build is always distinguishable from a release or a dev build.
- `update_check` returns no update when the running version contains `-local`: a local build must never be moved onto a release line by the updater.
- `task app:build:verified` runs `task verify` first; `task app:build` builds immediately for the fast loop.
- `docs/how-to/build-and-run.md` documents the local build, the path knob and what it does not do (no tag, no signature).

## Capabilities

- `dev-tooling` (existing): how the repository is built and checked.

## Impact

- `scripts/local_windows_build.sh`, `taskfile.yml`, `desktop/src-tauri/src/updater.rs`, `docs/how-to/build-and-run.md`.
- No release pipeline change: tags and uploads still come from `dev-build.yml`; a local build publishes nothing.
- Disk: the Windows checkout holds its own `target/` (several GB) at the configured path.
