#!/usr/bin/env python3
"""Assemble the GitHub release body for a stable or candidate release.

The body is the version's English changelog entry, unchanged, under one line
that points the reader at the same entry in their own language on the website.
Reads VERSION (default: the committed tauri.conf.json version) and
RELEASE_NOTES (optional path; stdout otherwise). `--github-output` appends the
body to $GITHUB_OUTPUT as the `body` output, for tauri-action.

A prerelease must be a candidate, `X.Y.Z-rc.<n>`: the pipeline publishes no
other kind, so a body assembled for one would describe a release that can never
ship.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path

CHANGELOG = Path("i18n/changelog")
TAURI_CONFIG = Path("desktop/src-tauri/tauri.conf.json")
SITE = "https://kisev.github.io/vibe/changelog"
VERSION_PATTERN = re.compile(r"[0-9]+\.[0-9]+\.[0-9]+(-rc\.[0-9]+)?")
FRONTMATTER_PATTERN = re.compile(r"^---\n([\s\S]*?)\n---\n?([\s\S]*)$")
FIELD_PATTERN = re.compile(r"^([A-Za-z_][A-Za-z0-9_-]*):(?:[ \t]+(.*))?$")
GITHUB_OUTPUT_DELIMITER = "__RELEASE_NOTES_EOF__"


class EntryError(Exception):
    """A changelog entry the release body cannot be assembled from."""


def env(name: str) -> str:
    value = os.environ.get(name)
    if value is None:
        raise SystemExit(f"{name} is required")
    return value


def version_from_config() -> str:
    return json.loads(TAURI_CONFIG.read_text(encoding="utf-8"))["version"]


def split_frontmatter(text: str) -> tuple[dict[str, str], str]:
    """Parse the flat `key: value` frontmatter the changelog entries carry.

    A missing or unparseable block raises `EntryError`, so the release never
    ships a body assembled from a file the website would read differently.
    """
    match = FRONTMATTER_PATTERN.match(text)
    if not match:
        raise EntryError("frontmatter is missing (a leading --- block)")
    fields: dict[str, str] = {}
    for number, line in enumerate(match.group(1).splitlines(), start=2):
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        field = FIELD_PATTERN.match(line)
        if not field:
            raise EntryError(f"frontmatter line {number} is malformed: {line!r}")
        value = (field.group(2) or "").strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        fields[field.group(1)] = value
    return fields, match.group(2)


def entry_body(text: str, wanted: str) -> str:
    """The Markdown after the frontmatter, checked against the released version."""
    fields, body = split_frontmatter(text)
    if "version" not in fields:
        raise EntryError("frontmatter has no version field")
    if fields["version"] != wanted:
        raise EntryError(f"frontmatter version {fields['version']!r} does not match {wanted}")
    return body


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Assemble the GitHub release body.")
    parser.add_argument(
        "--github-output",
        action="store_true",
        help="append the body to $GITHUB_OUTPUT as the `body` output",
    )
    args = parser.parse_args(argv)

    version = os.environ.get("VERSION") or version_from_config()
    if not VERSION_PATTERN.fullmatch(version):
        print(
            f"::error::VERSION must be X.Y.Z or X.Y.Z-rc.<n>, got {version}",
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
    try:
        body = entry_body(path.read_text(encoding="utf-8"), version).strip("\n")
    except EntryError as error:
        print(f"::error::{path}: {error}", file=sys.stderr)
        return 1
    if not body:
        print(f"::error::{path} has no body after its frontmatter", file=sys.stderr)
        return 1
    notes = f"Read this changelog in your language: {SITE}/{version}\n\n{body}\n"
    if args.github_output:
        with open(env("GITHUB_OUTPUT"), "a", encoding="utf-8") as handle:
            handle.write(f"body<<{GITHUB_OUTPUT_DELIMITER}\n{notes}\n{GITHUB_OUTPUT_DELIMITER}\n")
    else:
        output = os.environ.get("RELEASE_NOTES")
        if output:
            Path(output).write_text(notes, encoding="utf-8")
        else:
            sys.stdout.write(notes)
    return 0


if __name__ == "__main__":
    sys.exit(main())
