#!/usr/bin/env python3
"""Assemble the GitHub release body for a stable or candidate release.

The body is the version's English changelog entry, unchanged, under one line
that points the reader at the same entry in their own language on the website.
Reads VERSION (required) and RELEASE_NOTES (optional path; stdout otherwise).
"""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path

CHANGELOG = Path("i18n/changelog")
SITE = "https://kisev.github.io/vibe/changelog"
VERSION_PATTERN = re.compile(r"[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z][0-9A-Za-z.-]*)?")


def env(name: str) -> str:
    value = os.environ.get(name)
    if value is None:
        raise SystemExit(f"{name} is required")
    return value


def entry_body(text: str) -> str:
    """The Markdown after the frontmatter, matched the way the website does."""
    match = re.match(r"^---\n([\s\S]*?)\n---\n?([\s\S]*)$", text)
    return match.group(2) if match else text


def main() -> int:
    version = env("VERSION")
    if not VERSION_PATTERN.fullmatch(version):
        print(
            f"::error::VERSION must be X.Y.Z or X.Y.Z-<pre-release>, got {version}",
            file=sys.stderr,
        )
        return 1
    path = CHANGELOG / f"{version}.md"
    if not path.is_file():
        print(
            f"::error::{path} is missing; write the release notes before releasing",
            file=sys.stderr,
        )
        return 1
    body = entry_body(path.read_text(encoding="utf-8")).strip("\n")
    if not body:
        print(f"::error::{path} has no body after its frontmatter", file=sys.stderr)
        return 1
    notes = f"Read this changelog in your language: {SITE}/{version}\n\n{body}\n"
    output = os.environ.get("RELEASE_NOTES")
    if output:
        Path(output).write_text(notes, encoding="utf-8")
    else:
        sys.stdout.write(notes)
    return 0


if __name__ == "__main__":
    sys.exit(main())
