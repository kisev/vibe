# Tooling

The project's task scheme is `taskfile.yml` and `lefthook`; `task --list` is the entry surface.

## `task` (`taskfile.yml`)

`task --list` is the index. Tasks are grouped by prefix:

| Prefix | Covers |
| --- | --- |
| `hooks` | Install the lefthook git gates once per checkout |
| `setup`, `dev`, `dev:web`, `app:*` | Local setup, sidecars, the desktop dev loop, production bundles |
| `server:*` | Build the engine sidecar, fetch pinned headers, package a release archive, and run its tests, clippy, deny, machete |
| `linux-deps` | Install the Linux build packages with apt, zypper or dnf |
| `libs:*` | ggml library fetch/build/upload, tree id, release tag, platform id |
| `website:dev`, `website:build`, `phone:*` | Website dev/build and the phone handoff |
| `upstream:*` | Remote isolation, branch fetches, namespaced tag fetches |
| `i18n:*`, `stamp-translations` | Paraglide generation, source-hash stamping, coverage audit |
| `docs:models*` | Regenerate or check the generated models page |
| `sync:catalog*` | Refresh or check the vendored model catalog |
| `desktop:*`, `website:test`, `website:typecheck` | Per-area tests and type checks |
| `test`, `lint`, `format`, `format:check`, `check-types` | Whole-tree gates |
| `deps:*` | Outdated report, in-range updates, majors, Renovate |
| `ci:*` | Build and release helpers that workflows call |
| `dev:*`, `release:*` | Dev build guard/prepare/cleanup/tag and release version override |

Every `task` resolves its tools through `mise exec`, so local runs use the versions pinned in `mise.toml`.

## Local development tasks

| Task | Effect |
| --- | --- |
| `task setup` | Download the `vibe-server` (and `ffmpeg`) sidecars for this machine; pass `-- <triple>` for an explicit target |
| `task server:build` | Build `server/` and stage it as the sidecar; pass `-- <triple>` to cross-compile |
| `task linux-deps` | Install the Linux build packages with the host package manager |
| `task dev` | `setup`, then `tauri dev` |
| `task dev:web` | Run only the frontend in a browser, with Tauri mocked |
| `task app:build` | `setup`, then `tauri build` |
| `task app:upgrade` | macOS only: rebuild `vibe.app`, replace the installed copy, relaunch |

## Package managers

- **JavaScript**: `pnpm` only. No npm or yarn.
- **Python**: `uv`. Dependencies live in the root `pyproject.toml` + `uv.lock`; `uv run` resolves them from anywhere in the tree. Do not add per-script PEP 723 blocks.
- **Rust**: the root workspace plus the separate `server/` workspace.

## Git hooks

```console
task hooks
```

Installs the lefthook gates defined in `lefthook.yml`. The pre-commit and pre-push checks use the same `task` targets as CI.

## CI

Workflows are thin by design: checkout, toolchain setup, then a `task` call. If a workflow step grows past a couple of lines of shell, it belongs in a task or a script under `scripts/`. See [Check your change](../how-to/check-your-change.md) for the local equivalents.
