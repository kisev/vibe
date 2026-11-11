#!/usr/bin/env python3
"""Validate and apply the release version override to tauri.conf.json.

A candidate is the same build as a release, only its version and tag differ:
`X.Y.Z-rc.N` sorts below `X.Y.Z`, which keeps Dev -> Beta -> Release moving
forward. Overrides are cut from main only. Reads VERSION and GITHUB_REF.
"""

from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

TAURI_CONFIG = Path("desktop/src-tauri/tauri.conf.json")
VERSION_PATTERN = re.compile(r"[0-9]+\.[0-9]+\.[0-9]+(-rc\.[0-9]+)?")


def main() -> int:
    version = os.environ["VERSION"]
    ref = os.environ["GITHUB_REF"]
    if ref != "refs/heads/main":
        print(f"::error::release overrides are cut from main only (on {ref})")
        return 1
    if not VERSION_PATTERN.fullmatch(version):
        print(f"::error::version must be X.Y.Z or X.Y.Z-rc.N, got {version}")
        return 1
    config = json.loads(TAURI_CONFIG.read_text())
    config["version"] = version
    TAURI_CONFIG.write_text(json.dumps(config, indent=2) + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
