# Build the server

The engine lives in `server/` and ships as the `vibe-server` sidecar. To run the app against a build from the tree instead of the pinned release:

```console
task setup            # fetch the released server and ffmpeg once
task server:build     # build server/ and stage it as the sidecar
task dev
```

`task server:build` builds `vibe-server` in release mode and copies it to `desktop/src-tauri/binaries/vibe-server-<triple>`, where `tauri dev` and `tauri build` look for it. An explicit target triple works the same way for a cross-compile:

```console
task server:build -- x86_64-pc-windows-msvc
```

The sidecar name and location come from Tauri's `externalBin` configuration, so no app-side change is needed when the server build changes.

## Versions

The server is its own product with its own version line: releases are tagged `server-v<version>`, start at `server-v1.0.0`, and advance independently of the app and of upstream. `.server-version` names the release `task setup` downloads, and it moves only after that release exists with every platform's assets — a pin ahead of the release breaks every build that downloads the sidecar. See [Publish a release](publish-a-release.md#the-server-has-its-own-version-line) for the release steps.

## Engine on its own

`server/docs/BUILDING.md` covers fetching the prebuilt ggml libraries, building the server crate alone, bumping the ggml tag, and packaging release archives. See also [Architecture](../reference/architecture.md) for how the sidecar fits into the app.
