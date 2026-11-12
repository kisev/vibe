# Repository layout

| Path | What it holds |
| --- | --- |
| `desktop/` | Tauri app: React frontend, Rust backend in `desktop/src-tauri/`, Playwright e2e suite, and the sidecar drop point `desktop/src-tauri/binaries/` |
| `server/` | The `vibe-server` workspace: the engine, native crates, prebuilt ggml inputs, and its own docs |
| `crates/meeting-detect/` | Meeting detection used by the desktop app |
| `handoff/` | Phone handoff: PWA, wasm client, and probe CLI over iroh |
| `website/` | The Vite site, including the updater manifests under `website/public/updater/` |
| `i18n/` | Translation catalogs (`desktop/`, `website/`), changelog entries (`changelog/`), and site docs pages (`docs/`) |
| `docs/` | These repository docs, organized by [Diátaxis](../README.md) |
| `scripts/` | Python and shell automation that the `task` and `chore` tasks call |
| `openspec/` | Spec-driven change proposals and the stable capability specs |
| `plans/` | Plan documents and their validation scripts |
| `design/` | Logos, screenshots, and the DMG background |
| `taskfile.yml` | The `task` facade: CI, lint, format, dependency, release, and dev-build tasks |
| `chorefile` | The `chore` facade: local setup, sidecars, dev/build, and area includes (`handoff/`, `website/`) |
| `server/chorefile` | The engine workspace's local tasks |
| `mise.toml` | Pinned versions for `task`, linters, formatters, and scanners |
| `pyproject.toml`, `uv.lock` | The root Python project for every `uv run` script |
| `Cargo.toml` | Root Rust workspace (desktop backend and `crates/`) |
| `.github/workflows/` | Thin CI: checkout, toolchain setup, and a `task` or `chore` call |

## Generated and vendored paths

Do not edit these by hand:

- `desktop/src/paraglide/` — compiled i18n messages (`task i18n:generate`)
- `desktop/src-tauri/gen/` — Tauri-generated schemas
- `i18n/docs/en-US/models.md` — generated from the model catalog (`task docs:models`)
- `server/libs/` — vendored ggml inputs and patches, upstream-owned
- `desktop/src-tauri/binaries/` — sidecars fetched by `chore setup` or built by `chore server-build`

The root `.markdownlint-cli2.jsonc` and `.mdformat.toml` exclude the generated Markdown; the lint and format tasks apply the same exclusions.

## Documentation folders

- `docs/tutorials/` — first-success lessons
- `docs/how-to/` — task instructions
- `docs/reference/` — facts and tables
- `docs/explanation/` — design decisions and trade-offs

Site docs (`i18n/docs/<locale>/`) are separate from this folder; they are served on `/docs`.
