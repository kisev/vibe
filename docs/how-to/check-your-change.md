# Check your change

Run the same gates CI runs. A green local run means the same commands ran as in `.github/workflows/lint.yml` and `.github/workflows/lint_rust.yml`.

## Tests

```console
task desktop:test      # desktop frontend (vitest)
task website:test      # website
task server:test       # vibe-server crate
task test              # all three
```

The desktop Rust tests run from the root workspace:

```console
RUST_LOG=trace cargo test -- --nocapture
```

The browser-mode end-to-end suite installs Playwright and runs the desktop suite:

```console
task ci:e2e
```

## Lint and format

```console
task lint            # yaml, toml, markdown, json, js, shell, editorconfig, workflows, secrets
task format          # every formatter, in place
task format:check    # fail when anything is unformatted
```

Rust formatting and clippy for the server workspace:

```console
task server:fmt
task server:clippy
```

`task server:clippy` lints the fork-owned crates (`vibe-server`, `vibe-diarize-native`) with warnings fatal. Vendored upstream crates are upstream's lint target.

## Type checks

```console
task desktop:typecheck
task website:typecheck   # runs the website build
```

## Before you push

```console
task verify
```

`task verify` runs everything a push or pull request triggers that can run locally: `task lint`, `task format:check`, `cargo fmt --all -- --check`, clippy over the desktop/CLI workspace and the server, `cargo-deny` and `cargo-machete`, the three unit suites, and the browser E2E suite. The pre-push hook runs the same command, so a push that would go red is refused on the machine that made it.

On Linux the desktop clippy step needs the build packages from [the build tutorial](../tutorials/build-and-run.md) (`task linux-deps`, once, with sudo). Without them `task verify` stops at that step and says so instead of failing inside `gdk-sys`.

A fresh checkout needs `task setup` first: the desktop clippy step links the `vibe-server` and `ffmpeg` sidecars, and the server workspace links the prebuilt ggml libraries that `task libs:fetch` stages. Both are downloaded artifacts and are not committed.

Nothing is pushed, and no `dev.<n>` or release tag is created, before `task verify` is green on that revision. CI is the backstop: the individual commands above stay available for a fast loop while working, but the check that counts before a push is the whole set — several defects (an unformatted page, a clippy warning in the desktop workspace, an E2E server that could not start) were each found in CI while every narrower local check was green.
