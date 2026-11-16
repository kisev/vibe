#!/usr/bin/env python3
"""Fetch the bundled ffmpeg sidecar for one target.

Linux takes a system ffmpeg; the other platforms bundle one as a sidecar, but
only where the model needs it, so this matches what tauri.*.windows.conf.json
and the macOS build expect. Python because the runners' tar differs: macOS has
bsdtar, which reads zip; the Windows runner's GNU tar does not.

Reads FFMPEG_URL, TRIPLE, EXE and RUNNER_TEMP from the environment, and
FFMPEG_SHA256 for a URL this script does not already pin.
"""

from __future__ import annotations

import hashlib
import os
import shutil
import pathlib
import urllib.request
import zipfile

# The workflow names a source; this table pins exactly which archive it must
# produce, as (pinned URL, SHA-256 of the archive, SHA-256 of the binary inside
# or None).
#
# * gyan.dev's ffmpeg-release-essentials.zip is a rolling alias whose contents
#   change with every ffmpeg release, so the pin names the versioned package it
#   resolved to and the digest gyan.dev publishes beside it (.zip.sha256). The
#   vendor publishes no per-file digest, so only the archive is checked.
# * osxexperts.net publishes the SHA-256 of the binary inside each download, not
#   of the zip. Both archives below were downloaded on 2026-11-15 and their
#   `ffmpeg` member hashes equal the vendor's published values, so that is what
#   is checked after extraction; the zip digest freezes the exact download.
PINS: dict[str, tuple[str, str, str | None]] = {
    "https://www.osxexperts.net/ffmpeg80intel.zip": (
        "https://www.osxexperts.net/ffmpeg80intel.zip",
        "2d24d22db78c87f394a5822867acd5c5dc5e762cd261a44bd26923f3a5af3e07",
        "df3f1e3facdc1ae0ad0bd898cdfb072fbc9641bf47b11f172844525a05db8d11",
    ),
    "https://www.osxexperts.net/ffmpeg902arm.zip": (
        "https://www.osxexperts.net/ffmpeg902arm.zip",
        "4597f0f3a397cc0027bfd03dc4dd9c3066be15943cc788370846b4305d178bcb",
        "6deb2860c3dc0c08e0f96bab119196c024103046fa3cc7ef72e3a77797d8553c",
    ),
    "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip": (
        "https://www.gyan.dev/ffmpeg/builds/packages/ffmpeg-9.0.2-essentials_build.zip",
        "60f467265b1e312373dbcd92200c2618a74850f98d3d078e94296bb3fa2047ba",
        None,
    ),
}


def pin_for(url: str) -> tuple[str, str, str | None]:
    """The archive to download for `url`, its digest, and the binary digest if known."""
    pinned = PINS.get(url)
    if pinned is not None:
        return pinned
    digest = os.environ.get("FFMPEG_SHA256", "").strip().lower()
    if not digest:
        raise SystemExit(
            f"no pinned digest for {url}; add it to PINS in this script or set FFMPEG_SHA256"
        )
    return url, digest, None


def main() -> None:
    url = os.environ["FFMPEG_URL"]
    triple = os.environ["TRIPLE"]
    exe = os.environ.get("EXE", "")
    pinned_url, expected, binary_expected = pin_for(url)
    tmp = pathlib.Path(os.environ["RUNNER_TEMP"]) / "ffmpeg-download"
    tmp.mkdir(parents=True, exist_ok=True)
    archive = tmp / "ffmpeg.zip"
    urllib.request.urlretrieve(pinned_url, archive)
    with archive.open("rb") as handle:
        digest = hashlib.file_digest(handle, "sha256").hexdigest()
    if digest != expected:
        raise SystemExit(
            f"checksum mismatch for {pinned_url}: got {digest}, expected {expected}"
        )
    with zipfile.ZipFile(archive) as bundle:
        member = next(
            (
                name
                for name in bundle.namelist()
                if pathlib.PurePosixPath(name).name == "ffmpeg" + exe
            ),
            None,
        )
        if member is None:
            raise SystemExit(f"no ffmpeg{exe} member in the archive from {url}")
        if binary_expected is not None:
            payload = bundle.read(member)
            binary_digest = hashlib.sha256(payload).hexdigest()
            if binary_digest != binary_expected:
                raise SystemExit(
                    f"binary checksum mismatch inside {pinned_url}: got {binary_digest}, "
                    f"expected {binary_expected} (the vendor's published digest)"
                )
        bundle.extract(member, tmp / "out")
    target = pathlib.Path("desktop/src-tauri/binaries") / f"ffmpeg-{triple}{exe}"
    target.parent.mkdir(parents=True, exist_ok=True)
    # RUNNER_TEMP and the workspace sit on different drives on Windows runners, and
    # os.replace cannot cross devices; shutil.move copies and removes instead.
    shutil.move(str(tmp / "out" / member), str(target))
    os.chmod(target, 0o755)
    print(f"installed {target}")


if __name__ == "__main__":
    main()
