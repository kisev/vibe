# Build the server

The engine lives in `server/` and ships as the `vibe-server` sidecar. To run the app against a build from the tree instead of the pinned release:

```console
chore setup            # fetch the released server and ffmpeg once
chore server-build     # build server/ and stage it as the sidecar
chore dev
```

`chore server-build` builds `vibe-server` in release mode and copies it to `desktop/src-tauri/binaries/vibe-server-<triple>`, where `tauri dev` and `tauri build` look for it. An explicit target triple works the same way for a cross-compile:

```console
chore server-build x86_64-pc-windows-msvc
```

The sidecar name and location come from Tauri's `externalBin` configuration, so no app-side change is needed when the server build changes.

## Engine on its own

`server/docs/BUILDING.md` covers fetching the prebuilt ggml libraries, building the server crate alone, bumping the ggml tag, and packaging release archives. See also [Architecture](../reference/architecture.md) for how the sidecar fits into the app.
