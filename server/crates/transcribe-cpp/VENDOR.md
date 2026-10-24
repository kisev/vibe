# Vendored transcribe-cpp (safe wrapper)

- Upstream: https://github.com/handy-computer/transcribe.cpp, same pinned revision
  as ../transcribe-cpp-sys (4d7c1ccefd39e5a9ea36cca5f8fefc6dcc14b99b, 0.4.1).
- Local patches (upstream-first; re-post before the next re-vendor):
  1. `tests/common/mod.rs` `repo_root()` also resolves the C++ tree from the
     sibling `../transcribe-cpp-sys` crate, which is where it lives in the vibe
     workspace instead of at the repo root.
- Manifest changes: the `transcribe-cpp-sys` dependency points at the sibling
  vendored crate instead of the upstream repo root.
- This crate stays outside the workspace members list so `cargo fmt --all` leaves the vendored tree verbatim.
