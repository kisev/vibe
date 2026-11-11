#!/usr/bin/env bash
# Type-check the desktop crate. tauri's build script wants the frontend dist
# and the sidecar binaries to exist; both are only real in a release build, so
# placeholders with the host target-triple suffix stand in for them.
set -euo pipefail

mkdir -p desktop/dist desktop/src-tauri/binaries
triple="$(rustc -vV | sed -n 's/host: //p')"
touch "desktop/src-tauri/binaries/vibe-server-$triple" \
    "desktop/src-tauri/binaries/vibe-diarize-native-$triple"
chmod +x desktop/src-tauri/binaries/*
cargo check --manifest-path desktop/src-tauri/Cargo.toml --all-targets
