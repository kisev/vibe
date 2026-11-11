#!/usr/bin/env python3
"""Fetch the bundled ffmpeg sidecar for one target.

Linux takes a system ffmpeg; the other platforms bundle one as a sidecar, but
only where the model needs it, so this matches what tauri.*.windows.conf.json
and the macOS build expect. Python because the runners' tar differs: macOS has
bsdtar, which reads zip; the Windows runner's GNU tar does not.

Reads FFMPEG_URL, TRIPLE, EXE and RUNNER_TEMP from the environment.
"""

from __future__ import annotations

import os
import pathlib
import urllib.request
import zipfile


def main() -> None:
    url = os.environ["FFMPEG_URL"]
    triple = os.environ["TRIPLE"]
    exe = os.environ.get("EXE", "")
    tmp = pathlib.Path(os.environ["RUNNER_TEMP"]) / "ffmpeg-download"
    tmp.mkdir(parents=True, exist_ok=True)
    archive = tmp / "ffmpeg.zip"
    urllib.request.urlretrieve(url, archive)
    with zipfile.ZipFile(archive) as bundle:
        member = next(
            name
            for name in bundle.namelist()
            if pathlib.PurePosixPath(name).name == "ffmpeg" + exe
        )
        bundle.extract(member, tmp / "out")
    target = pathlib.Path("desktop/src-tauri/binaries") / f"ffmpeg-{triple}{exe}"
    target.parent.mkdir(parents=True, exist_ok=True)
    os.replace(tmp / "out" / member, target)
    os.chmod(target, 0o755)
    print(f"installed {target}")


if __name__ == "__main__":
    main()
