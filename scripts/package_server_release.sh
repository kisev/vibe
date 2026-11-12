#!/usr/bin/env bash
# Package a built vibe-server binary with ffmpeg into the release archive the app
# extracts: `package_server_release.sh <binary> <goos> <goarch> <archive>`.
#
# The archive holds `vibe-server` (or `.exe`) and `ffmpeg` at its root, which is
# what scripts/setup_sidecars.sh looks for by name.
set -euo pipefail

binary="${1:?usage: package_server_release.sh <binary> <goos> <goarch> <archive>}"
goos="${2:?}"
goarch="${3:?}"
archive="${4:?}"

[ -f "$binary" ] || {
    echo "binary not found: $binary" >&2
    exit 1
}

stage="$(mktemp -d)"
trap 'rm -rf "$stage"' EXIT

name="vibe-server"
case "$goos" in
windows) name="vibe-server.exe" ;;
esac
cp "$binary" "$stage/$name"
chmod 755 "$stage/$name"

case "$goos/$goarch" in
darwin/amd64) url="https://www.osxexperts.net/ffmpeg80intel.zip" ;;
darwin/arm64) url="https://www.osxexperts.net/ffmpeg80arm.zip" ;;
windows/amd64) url="https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip" ;;
*)
    echo "unsupported target for the ffmpeg URL: $goos/$goarch" >&2
    exit 1
    ;;
esac

curl -fsSL --retry 3 --connect-timeout 20 --max-time 180 -o "$stage/ffmpeg.zip" "$url"
unzip -q -o "$stage/ffmpeg.zip" 'ffmpeg' 'ffmpeg.exe' -d "$stage" 2>/dev/null ||
    unzip -q -o "$stage/ffmpeg.zip" -d "$stage"
found="$(find "$stage" -type f \( -name ffmpeg -o -name ffmpeg.exe \) ! -name '*.zip' | head -1)"
[ -n "$found" ] || {
    echo "the ffmpeg archive holds no binary" >&2
    exit 1
}
mv "$found" "$stage/ffmpeg"
rm -f "$stage/ffmpeg.zip"
chmod 755 "$stage/ffmpeg"

# Everything at the staging root goes into the archive root, so the app finds the
# two files by name whether it unpacks a .zip or a .tar.gz.
case "$archive" in
/*) out="$archive" ;;
*) out="$PWD/$archive" ;;
esac
case "$archive" in
*.zip) (cd "$stage" && zip -q -r "$out" .) ;;
*) tar -czf "$out" -C "$stage" . ;;
esac
echo "packaged $archive"
