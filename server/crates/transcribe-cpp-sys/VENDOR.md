# Vendored transcribe.cpp

- Upstream: https://github.com/handy-computer/transcribe.cpp
- Pinned revision: 4d7c1ccefd39e5a9ea36cca5f8fefc6dcc14b99b (2026-10-22, `release: 0.4.1`)
- Local patches: none (keep patches as a tracked series under `patches/` when the first one lands)
- Pruned from the upstream tree: `docs/`, `examples/`, `samples/`, `tests/`, `tools/`,
  `reports/`, `catalog/`, `patches/`, `scripts/`, `bindings/{python,swift,typescript}`,
  `bindings/rust/{transcribe-cpp,xtask}`, `ggml/examples`, `ggml/tests`, python packaging files.
  This mirrors the crate's own packaging allowlist in the upstream root `Cargo.toml`.
- The Rust sources under `bindings/rust/sys/` and this manifest layout are verbatim upstream;
  only the `[workspace]` section and the packaging `include` list were removed.

Upgrades are deliberate: re-vendor from a new pinned revision, never merge upstream into place.
- The crates are path dependencies OUTSIDE the vibe workspace members list on purpose: `cargo fmt --all` and workspace clippy leave the vendored trees verbatim.
