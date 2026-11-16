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

# Each entry pins the exact archive: the URL and its SHA-256. gyan.dev's
# .../ffmpeg-release-essentials.zip is a rolling alias, so the pin names the
# versioned package it resolves to and the digest gyan.dev publishes beside it;
# osxexperts.net publishes the digest of the binary inside, not of the zip, and
# both macOS archives below carry the binary their page lists (verified
# 2026-11-15). Keep these in step with PINS in scripts/ci/fetch_ffmpeg.py.
case "$goos/$goarch" in
darwin/amd64)
    url="https://www.osxexperts.net/ffmpeg80intel.zip"
    sum="2d24d22db78c87f394a5822867acd5c5dc5e762cd261a44bd26923f3a5af3e07"
    ;;
darwin/arm64)
    url="https://www.osxexperts.net/ffmpeg902arm.zip"
    sum="4597f0f3a397cc0027bfd03dc4dd9c3066be15943cc788370846b4305d178bcb"
    ;;
windows/amd64)
    url="https://www.gyan.dev/ffmpeg/builds/packages/ffmpeg-9.0.2-essentials_build.zip"
    sum="60f467265b1e312373dbcd92200c2618a74850f98d3d078e94296bb3fa2047ba"
    ;;
*)
    echo "unsupported target for the ffmpeg URL: $goos/$goarch" >&2
    exit 1
    ;;
esac

# macOS ships shasum, not sha256sum; Git Bash on Windows has both.
sha256_of() {
    if command -v sha256sum >/dev/null 2>&1; then
        sha256sum "$1" | cut -d' ' -f1
    else
        shasum -a 256 "$1" | cut -d' ' -f1
    fi
}

curl -fsSL --retry 3 --connect-timeout 20 --max-time 180 -o "$stage/ffmpeg.zip" "$url"
got="$(sha256_of "$stage/ffmpeg.zip")"
[ "$got" = "$sum" ] || {
    echo "checksum mismatch for $url: got $got, expected $sum" >&2
    exit 1
}
unzip -q -o "$stage/ffmpeg.zip" 'ffmpeg' 'ffmpeg.exe' -d "$stage" 2>/dev/null ||
    unzip -q -o "$stage/ffmpeg.zip" -d "$stage"
found="$(find "$stage" -type f \( -name ffmpeg -o -name ffmpeg.exe \) ! -name '*.zip' -print -quit)"
[ -n "$found" ] || {
    echo "the ffmpeg archive holds no binary" >&2
    exit 1
}
# Windows resolves the sidecar by its full name, so the extension is part of the contract.
ffmpeg_name="ffmpeg"
[ "$goos" = "windows" ] && ffmpeg_name="ffmpeg.exe"
# The macOS archives already hold ffmpeg at their root; moving a file onto
# itself is an error under `set -e`.
if [ "$found" != "$stage/$ffmpeg_name" ]; then
    mv "$found" "$stage/$ffmpeg_name"
fi
rm -f "$stage/ffmpeg.zip"
# The gyan.dev archive nests its binary (bin/ffmpeg.exe) and carries ffprobe,
# ffplay, docs and licenses; only the two files above belong in the archive.
find "$stage" -mindepth 1 -maxdepth 1 ! -name "$name" ! -name "$ffmpeg_name" -exec rm -rf {} +
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
