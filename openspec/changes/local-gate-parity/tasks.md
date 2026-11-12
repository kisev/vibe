# Tasks

- [x] 1. Add `rust:clippy` to `taskfile.yml`: `cargo clippy --manifest-path Cargo.toml --all-targets -- -D warnings` through `mise exec`, the same command `lint_rust.yml` runs.
- [x] 2. Add `verify` to `taskfile.yml`, running in order: `lint`, `format:check`, `rust:fmt-check` (`cargo fmt --all -- --check`), `server:clippy`, `server:deny`, `server:machete`, `test`, `rust:clippy`, `ci:e2e` — the expensive desktop clippy sits late so a host that cannot run it still reports every other gate.
- [x] 3. Point the pre-push hook at `task verify` instead of `task test`.
- [x] 4. Add a pre-commit `prettier` hook for staged `css` and `html`.
- [x] 5. Rewrite "Before you push" in `docs/how-to/check-your-change.md` around `task verify`, and add the rule to `AGENTS.md`: no push, no tag, before a green `task verify` on that revision.
- [x] 6. Ran `task verify` end to end: lint, format:check, rustfmt, server clippy, deny, machete, the three unit suites (286 + 33 + server) and 21 E2E specs are green in about seven minutes warm; the E2E server starts in ~29 s and its output is piped. `rust:clippy` stops on the precondition naming `chore linux-deps` — this host has no GTK/WebKit development packages and they need sudo.
- [x] 7. An unformatted HTML file is refused by the new prettier hook (`prettier --check` warns and exits non-zero). A deliberate clippy warning could not be demonstrated here because the desktop step is blocked by the missing packages; the server workspace does fail on warnings, which the same wrapper now runs locally.
