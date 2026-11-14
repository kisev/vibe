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
# Windows resolves the sidecar by its full name, so the extension is part of the contract.
ffmpeg_name="ffmpeg"
[ "$goos" = "windows" ] && ffmpeg_name="ffmpeg.exe"
mv "$found" "$stage/$ffmpeg_name"
rm -f "$stage/ffmpeg.zip"
chmod 755 "$stage/$ffmpeg_name"

# Everything at the staging root goes into the archive root, so the app finds the
# two files by name whether it unpacks a .zip or a .tar.gz.
case "$archive" in
/*) out="$archive" ;;
*) out="$PWD/$archive" ;;
esac
case "$archive" in
*.zip)
    # Git Bash on the Windows runners has no `zip`; Python is the one tool every runner has,
    # and its members sit at the archive root, which setup_sidecars expects.
    py="$(command -v python3 || command -v python)"
    [ -n "$py" ] || {
        echo "no python to build $archive" >&2
        exit 1
    }
    "$py" - "$out" "$stage" <<'PY'
import pathlib, sys, zipfile

out, stage = sys.argv[1], pathlib.Path(sys.argv[2])
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as archive:
    for path in sorted(stage.rglob("*")):
        if path.is_file() and not path.name.endswith(".zip"):
            archive.write(path, path.relative_to(stage).as_posix())
PY
    ;;
*) tar -czf "$out" -C "$stage" . ;;
esac
echo "packaged $archive"
