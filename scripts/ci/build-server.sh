#!/usr/bin/env bash
# Build vibe-server and stage it as the desktop sidecar. Requires TRIPLE and
# EXE (empty or ".exe"); VIBE_SERVER_VERSION, VIBE_SERVER_COMMIT and
# TRANSCRIBE_CMAKE_ARGS are inherited by cargo from the workflow environment.
set -euo pipefail

triple="${TRIPLE:?TRIPLE is required}"
exe="${EXE:-}"

cd server
cargo build -p vibe-server --release --target "$triple"
mkdir -p ../desktop/src-tauri/binaries
cp "target/$triple/release/vibe-server$exe" \
    "../desktop/src-tauri/binaries/vibe-server-$triple$exe"
