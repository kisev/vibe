# Build and run Vibe locally

This tutorial takes you from a fresh checkout to a local build that transcribes an audio file. It is the shortest path to a working development setup; the other pages assume you have finished it.

## What you need

- Git and a checkout of this repository
- [Rust](https://www.rust-lang.org/tools/install) through `rustup`
- [Node.js](https://nodejs.org/) 22 and [pnpm](https://pnpm.io/)
- [uv](https://docs.astral.sh/uv/) for the Python scripts
- [mise](https://mise.jdx.dev/) for the `task` runner and the pinned lint and format tools (`mise install`)
- Platform build dependencies (below)

**Linux**

```console
task linux-deps
```

That installs the packages from [Tauri's Linux prerequisites](https://v2.tauri.app/start/prerequisites/#linux) plus what Vibe adds: ALSA for audio, `xdo` for the global shortcut, and the appindicator bindings for the tray icon. The release workflow runs the same task, so CI and your machine get the same packages.

**macOS**

Install Xcode from the App Store and open it once so it downloads the platform SDKs.

**Windows**

Install the WebView2 runtime if it is not already present, and the Visual Studio Build Tools with the C++ workload.

## Build and run

Fetch the sidecars for this machine, install the frontend dependencies, and start the app:

```console
task setup
pnpm --dir desktop install
task dev
```

`task setup` downloads the `vibe-server` sidecar (and `ffmpeg` on macOS and Windows) from the server release pinned by `.server-version` into `desktop/src-tauri/binaries/`. `task dev` then runs `tauri dev`.

The same steps by hand:

```console
task setup
pnpm --dir desktop install
cd desktop
pnpm exec tauri dev
```

For a production bundle instead of the dev server:

```console
task app:build
```

The bundle lands under `target/release/bundle/`. On macOS, `task app:upgrade` builds the app, replaces `/Applications/vibe.app`, and relaunches it.

## Confirm the setup

The app window should open. Drop an audio file onto it, or use the record action, and start a transcription. The desktop process starts `vibe-server`, which does the transcription; the first run may download the default model.

If the window opens but transcription fails, the server or its GPU backend is the usual cause. Run the app from a terminal with logs enabled and see [Troubleshoot a crash](../how-to/troubleshoot-a-crash.md).

## Next steps

- [Check your change](../how-to/check-your-change.md) before opening a pull request.
- [Build the server](../how-to/build-the-server.md) if you are changing the engine rather than the UI.
- [Repository layout](../reference/repository-layout.md) and [tooling](../reference/tooling.md) explain where things live.
