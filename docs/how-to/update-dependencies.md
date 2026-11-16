# Update dependencies

Python dependencies live in the root uv project (`pyproject.toml` + `uv.lock`), not in per-script blocks, so `uv run` resolves them from anywhere in the tree. Cargo has four manifests (`Cargo.toml`, `server/Cargo.toml`, `handoff/wasm/Cargo.toml`, `handoff/probe/Cargo.toml`); pnpm has three packages (`desktop`, `website`, `handoff/pwa`).

## Check what is outdated

```console
task deps:check
```

This is read-only and reports Cargo, pnpm, and Python packages across every manifest.

## Update within declared ranges

```console
task deps:update
```

This runs `cargo update` for each manifest, `pnpm update` for each package, and `uv lock --upgrade`. Ranges stay put, so a major version does not move here.

## Update across major versions

```console
task deps:update:major
```

The task prompts before running `cargo upgrade --incompatible` and `pnpm update --latest`. Review the diff and the test suite; major upgrades are explicit events, not a routine refresh.

## Renovate

Two paths share `renovate.json`:

```console
task deps:renovate:dry   # show what Renovate would change, touches nothing
task deps:renovate       # apply to a clean working tree
```

`deps:renovate` refuses a dirty tree. Review and commit the diff like any other change; it does not open pull requests.

CI runs `.github/workflows/dependency-updates.yml` weekly: one grouped pull request per ecosystem, majors separate, no automerge. The workflow needs a fine-grained `RENOVATE_TOKEN` repository secret with contents and pull-request write access; it fails with a named-secret message when the secret is missing.

## Policy

- Update crates and the lockfile in a dedicated commit so a revert is one step.
- Do not bump important crates such as Tauri while the current version is stable and the bump has no concrete need.
- The `transcribe-cpp` pin is exact (`=0.4.1`) because engine upgrades are deliberate parity events, not a `cargo update` side effect. Treat a change to it as an engine change and follow `server/docs/BUILDING.md`.
