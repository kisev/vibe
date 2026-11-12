# Tasks

- [x] 1. Add `rust:clippy` to `taskfile.yml`: `cargo clippy --manifest-path Cargo.toml --all-targets -- -D warnings` through `mise exec`, the same command `lint_rust.yml` runs.
- [x] 2. Add `verify` to `taskfile.yml`, running in order: `lint`, `format:check`, `rust:fmt-check` (`cargo fmt --all -- --check`), `server:clippy`, `server:deny`, `server:machete`, `test`, `rust:clippy`, `ci:e2e` — the expensive desktop clippy sits late so a host that cannot run it still reports every other gate.
- [x] 3. Point the pre-push hook at `task verify` instead of `task test`.
- [x] 4. Add a pre-commit `prettier` hook for staged `css` and `html`.
- [x] 5. Rewrite "Before you push" in `docs/how-to/check-your-change.md` around `task verify`, and add the rule to `AGENTS.md`: no push, no tag, before a green `task verify` on that revision.
- [ ] 6. Run `task verify` end to end; record how long it takes and which steps a host without the desktop build packages cannot run (the clippy step stops with a precondition naming `chore linux-deps` rather than dying inside `gdk-sys`).
- [ ] 7. Confirm a deliberate clippy warning and a deliberately unformatted HTML file are both refused locally.
