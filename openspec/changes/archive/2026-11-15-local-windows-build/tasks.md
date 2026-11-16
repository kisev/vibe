# Tasks

- [x] 1. `scripts/local_windows_build.sh`: resolve `VIBE_WIN_CHECKOUT` (default: the Windows profile's `vibe-build`, mapped with `wslpath`; a UNC path is refused), stage the Windows sidecars and ggml libraries, rsync the tree, and run `pnpm exec tauri build --config local-build.json --bundles nsis` from a generated `local-build.ps1` through `powershell.exe` with the version overlay.
- [x] 2. `task app:build:windows` and `task app:build:windows:verified` in `taskfile.yml`, the latter running `task verify` first.
- [x] 3. `update_check` returns `None` for a version containing `-local`.
- [x] 4. `docs/tutorials/build-and-run.md` documents the local Windows build, the path knob, and that it publishes nothing.
- [x] 5. Ran it on this host: two clean runs end with `Finished 1 bundle` and `vibe_1.0.0-local.20261113.c5302d1f_x64-setup.exe` (~50 MB) in `C:\Users\kisev\vibe-build\target\release\bundle\nsis`. No tag, release or upload was created. The script's contract (checkout resolution, version stamp, verified gate, no publishing) is covered by `scripts/local_windows_build_test.py` with stubbed Windows commands, and the updater guard by `updater::tests::a_local_build_never_joins_a_channel`.
