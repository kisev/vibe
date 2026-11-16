#!/usr/bin/env python3
"""Validate and apply the release version override to tauri.conf.json.

A candidate is the same build as a release, only its version and tag differ:
`X.Y.Z-rc.N` sorts below `X.Y.Z`, which keeps Dev -> Beta -> Release moving
forward. Overrides are cut from main only. Reads VERSION and GITHUB_REF.
"""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path

TAURI_CONFIG = Path("desktop/src-tauri/tauri.conf.json")
VERSION_PATTERN = re.compile(r"[0-9]+\.[0-9]+\.[0-9]+(-rc\.[0-9]+)?")


def env(name: str) -> str:
    value = os.environ.get(name)
    if value is None:
        raise SystemExit(f"{name} is required")
    return value


def main() -> int:
    version = env("VERSION")
    ref = env("GITHUB_REF")
    if ref != "refs/heads/main":
        print(f"::error::release overrides are cut from main only (on {ref})")
        return 1
    if not VERSION_PATTERN.fullmatch(version):
        print(f"::error::version must be X.Y.Z or X.Y.Z-rc.N, got {version}")
        return 1
    # Replace the field in place: json.dumps would reflow every one-line array
    # in the file, turning a local run into a diff of the whole config.
    text = TAURI_CONFIG.read_text(encoding="utf-8")
    updated, count = re.subn(
        r'("version"\s*:\s*")[^"]*"',
        lambda match: f'{match.group(1)}{version}"',
        text,
        count=1,
    )
    if count != 1:
        print("::error::no version field to override in tauri.conf.json")
        return 1
    TAURI_CONFIG.write_text(updated, encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
