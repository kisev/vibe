#!/usr/bin/env bash
# Fetch the prebuilt GGML libraries pinned in server/libs for the CI matrix cell.
# Requires TRIPLE (e.g. x86_64-unknown-linux-gnu); the mapping to the archive's
# platform id lives here because that is what the matrix names.
set -euo pipefail

triple="${TRIPLE:?TRIPLE is required}"
case "$triple" in
aarch64-apple-darwin) platform=darwin-arm64 ;;
x86_64-apple-darwin) platform=darwin-x86_64 ;;
x86_64-unknown-linux-gnu) platform=linux-x86_64 ;;
aarch64-unknown-linux-gnu) platform=linux-aarch64 ;;
x86_64-pc-windows-msvc) platform=windows-amd64-msvc ;;
*)
    echo "no ggml libraries asset for $triple" >&2
    exit 1
    ;;
esac

exec bash "$(dirname "${BASH_SOURCE[0]}")/../ggml_libs.sh" fetch "$platform"
