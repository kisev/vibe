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

The git hooks installed by `task hooks` run the staged-file gates. Running `task lint` and `task test` before a push is the same check CI performs, so a red CI run should be rare.
