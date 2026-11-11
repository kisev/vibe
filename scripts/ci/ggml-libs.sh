#!/usr/bin/env bash
# Fetch the prebuilt GGML libraries pinned in server/libs for one target.
# Requires TRIPLE (e.g. x86_64-unknown-linux-gnu).
set -euo pipefail

triple="${TRIPLE:?TRIPLE is required}"
case "$triple" in
aarch64-apple-darwin) asset=darwin-arm64 ;;
x86_64-apple-darwin) asset=darwin-x86_64 ;;
x86_64-unknown-linux-gnu) asset=linux-x86_64 ;;
aarch64-unknown-linux-gnu) asset=linux-aarch64 ;;
x86_64-pc-windows-msvc) asset=windows-amd64-msvc ;;
*)
    echo "no ggml libraries asset for $triple" >&2
    exit 1
    ;;
esac

tag="libraries-ggml-$(cat server/libs/ggml-version)-r$(cat server/libs/revision)"
curl --location --fail --retry 3 -o /tmp/ggml-libs.tar.gz \
    "https://github.com/thewh1teagle/vibe/releases/download/$tag/ggml-libs-$asset.tar.gz"
tar -xzf /tmp/ggml-libs.tar.gz -C /tmp
mv /tmp/lib server/libs/lib
