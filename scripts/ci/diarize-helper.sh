#!/usr/bin/env bash
# Build the native diarization helper and stage it as a desktop sidecar.
# vibe-diarize-native statically links the prebuilt GGML fetched by
# ci:ggml-libs. Requires TRIPLE and EXE (empty or ".exe").
set -euo pipefail

triple="${TRIPLE:?TRIPLE is required}"
exe="${EXE:-}"

cd server
cargo build -p vibe-diarize-native --release --target "$triple"
cp "target/$triple/release/vibe-diarize-native$exe" \
    "../desktop/src-tauri/binaries/vibe-diarize-native-$triple$exe"
