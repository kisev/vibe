#!/usr/bin/env -S uv run

"""Point an update channel at a release. See docs/reference/update-channels.md.

    uv run scripts/channel.py 1.1.0-rc.1 --channel beta
    uv run scripts/channel.py 1.0.0 --channel stable

Writes website/public/updater/<channel>.json from the release's own latest.json. Commit it to
main and the website deploy publishes it. Beta carries release candidates only.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

CHANNELS_DIR = Path(__file__).resolve().parent.parent / "website/public/updater"
MANIFEST_URL = "https://github.com/kisev/vibe/releases/download/v{version}/latest.json"


def version_key(version: str) -> tuple:
    """Semver ordering: `1.0.0-dev.70 < 1.0.0-rc.1 < 1.0.0-rc.2 < 1.0.0`.

    A release outranks its prereleases (the `1` marker); prerelease identifiers are
    compared left to right, numeric ones numerically and below alphanumeric ones.
    """
    core, _, pre = version.removeprefix("v").partition("-")
    numbers = tuple(int(part) for part in core.split("."))
    if not pre:
        return (*numbers, 1, ())
    identifiers = tuple((0, int(part)) if part.isdigit() else (1, part) for part in pre.split("."))
    return (*numbers, 0, identifiers)


def is_candidate(version: str) -> bool:
    """Beta only ever carries release candidates: `X.Y.Z-rc.<n>`."""
    return re.fullmatch(r"v?\d+\.\d+\.\d+-rc\.\d+", version) is not None


def accepts(channel: str, version: str) -> bool:
    """Whether `version` may be written to `channel`."""
    return channel != "beta" or is_candidate(version)


def self_test() -> None:
    ordered = ["1.0.0-dev.70", "1.0.0-rc.1", "1.0.0-rc.2", "1.0.0", "1.1.0-rc.1", "1.1.0"]
    keys = [version_key(version) for version in ordered]
    assert keys == sorted(keys), f"ordering broken: {list(zip(ordered, keys))}"
    assert version_key("v1.0.0") == version_key("1.0.0")
    assert not accepts("beta", "1.0.0"), "beta must reject a plain release"
    assert accepts("beta", "1.1.0-rc.1"), "beta must accept a release candidate"
    assert not accepts("beta", "1.1.0-dev.1"), "beta must reject a dev build"
    assert accepts("stable", "1.0.0"), "stable must accept a plain release"
    print("channel version ordering and beta candidate filter ok")


def fetch_manifest(version: str) -> dict:
    # Imported here so `--self-test` runs without the network dependencies.
    import httpx

    response = httpx.get(MANIFEST_URL.format(version=version), follow_redirects=True, timeout=30)
    if response.status_code == 404:
        sys.exit(f"v{version} has no latest.json; did release.yml finish?")
    response.raise_for_status()
    manifest = response.json()
    if manifest.get("version") != version:
        sys.exit(f"v{version}'s latest.json says version {manifest.get('version')!r}")
    return manifest


def read_channel(channel: str) -> dict | None:
    path = CHANNELS_DIR / f"{channel}.json"
    return json.loads(path.read_text()) if path.exists() else None


def write_channel(channel: str, manifest: dict) -> None:
    CHANNELS_DIR.mkdir(parents=True, exist_ok=True)
    (CHANNELS_DIR / f"{channel}.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"{channel}: v{manifest['version']}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("version", nargs="?", help="release version, without the v")
    parser.add_argument("--channel", choices=["stable", "beta"], help="channel to point at the release")
    parser.add_argument("--self-test", action="store_true", help="check the version ordering and exit")
    args = parser.parse_args()

    if args.self_test:
        self_test()
        return
    if not args.version or not args.channel:
        parser.error("version and --channel are required unless --self-test is given")

    version = args.version.removeprefix("v")
    if not accepts(args.channel, version):
        sys.exit(f"{args.channel} carries release candidates only; {version} is not X.Y.Z-rc.N")
    current = read_channel(args.channel)
    # The updater only moves forward, so an older version here would reach no one already past it.
    if current and version_key(version) < version_key(current["version"]):
        sys.exit(f"{args.channel} is on v{current['version']}; installs never go back to v{version}")

    manifest = fetch_manifest(version)
    write_channel(args.channel, manifest)

    print("Commit website/public/updater/ to main; the website deploy publishes it.")


if __name__ == "__main__":
    main()
