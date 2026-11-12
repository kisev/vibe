#!/usr/bin/env bash
# Fetch the sidecars the desktop build links against, for one target triple:
# `vibe-server-<triple>` and, outside Linux, `ffmpeg-<triple>`, into
# desktop/src-tauri/binaries.
#
# The asset names are the server release's own; the triple also becomes the
# sidecar's file name, because Tauri looks for `vibe-server-<triple>` beside the
# app binary. Called with no argument, the triple is this machine's.
#
#     scripts/setup_sidecars.sh [triple]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

triple="${1:-}"
if [ -z "$triple" ]; then
    triple="$(rustc -vV | sed -n 's/^host: //p')"
fi
[ -n "$triple" ] || {
    echo "could not determine the host triple; pass one explicitly" >&2
    exit 1
}

server="$(tr -d '[:space:]' <.server-version)"
bin="$ROOT/desktop/src-tauri/binaries"
is_linux=false
exe=""
case "$triple" in
*linux*) is_linux=true ;;
*windows*) exe=".exe" ;;
esac

mkdir -p "$bin"

case "$triple" in
aarch64-apple-darwin) asset="vibe-server-darwin-arm64-with-ffmpeg.tar.gz" ;;
x86_64-apple-darwin) asset="vibe-server-darwin-amd64-with-ffmpeg.tar.gz" ;;
x86_64-pc-windows-msvc) asset="vibe-server-windows-amd64-with-ffmpeg.zip" ;;
x86_64-unknown-linux-gnu) asset="vibe-server-linux-amd64" ;;
aarch64-unknown-linux-gnu) asset="vibe-server-linux-arm64" ;;
*)
    echo "the server publishes no build for $triple" >&2
    exit 1
    ;;
esac

# Linux ships the server alone; every other target gets ffmpeg beside it, so
# both have to be present before this is a no-op. Checking only the server
# would leave a half-populated directory and fail the Tauri build much later.
if $is_linux; then
    if [ -f "$bin/vibe-server-$triple" ]; then
        echo "sidecars for $triple are already in place"
        exit 0
    fi
else
    if [ -f "$bin/vibe-server-$triple$exe" ] && [ -f "$bin/ffmpeg-$triple$exe" ]; then
        echo "sidecars for $triple are already in place"
        exit 0
    fi
fi

tag="server-$server"

if $is_linux; then
    # Linux ships the bare binary, with no ffmpeg alongside it.
    gh release download "$tag" --repo kisev/vibe --pattern "$asset" --dir "$bin" --clobber
    mv "$bin/$asset" "$bin/vibe-server-$triple"
    chmod 755 "$bin/vibe-server-$triple"
    echo "installed vibe-server-$triple"
    exit 0
fi

# macOS and Windows ship an archive holding the server and ffmpeg; the archive's
# own directory layout is not part of the contract, so the members are found by
# name rather than assumed to sit at the root.
stage="$(mktemp -d)"
trap 'rm -rf "$stage"' EXIT
gh release download "$tag" --repo kisev/vibe --pattern "$asset" --dir "$stage"

mkdir -p "$stage/unpacked"
case "$asset" in
*.zip) unzip -q -o "$stage/$asset" -d "$stage/unpacked" ;;
*) tar -xzf "$stage/$asset" -C "$stage/unpacked" ;;
esac

member() {
    found="$(find "$stage/unpacked" -type f -name "$1" | head -1)"
    [ -n "$found" ] || {
        echo "$1 is missing from $asset" >&2
        exit 1
    }
    echo "$found"
}

mv "$(member "vibe-server$exe")" "$bin/vibe-server-$triple$exe"
mv "$(member "ffmpeg$exe")" "$bin/ffmpeg-$triple$exe"
if [ "$exe" = "" ]; then
    chmod 755 "$bin/vibe-server-$triple" "$bin/ffmpeg-$triple"
fi
echo "installed vibe-server-$triple and ffmpeg-$triple"
