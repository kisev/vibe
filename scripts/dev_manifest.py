#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# ///
"""Write `website/public/updater/dev.json` from the newest complete dev release.

The website build runs this before `pnpm build`. A dev release is complete when
its `latest.json` names every platform the matrix builds; a partial release is
skipped so the deployed manifest keeps pointing at the last good build. When no
complete dev release exists yet, nothing is written and the previously committed
manifest (if any) stays in place.

    GH_TOKEN=… uv run scripts/dev_manifest.py
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

REPO = "kisev/vibe"
OUT = Path(__file__).resolve().parent.parent / "website/public/updater/dev.json"

# Every target dev-build.yml builds. A manifest missing one of these would
# strand that platform on the channel.
REQUIRED_PLATFORMS = {
    "darwin-aarch64",
    "darwin-x86_64",
    "linux-x86_64",
    "linux-aarch64",
    "windows-x86_64",
}


def headers() -> dict[str, str]:
    token = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN")
    return {"Authorization": f"Bearer {token}"} if token else {}


def get_json(url: str) -> Any:
    request = urllib.request.Request(url, headers={"Accept": "application/vnd.github+json", **headers()})
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def manifest_url(release: dict) -> str | None:
    for asset in release.get("assets", []):
        if asset.get("name") == "latest.json":
            return asset.get("browser_download_url")
    return None


def newest_complete_dev() -> dict | None:
    releases = get_json(f"https://api.github.com/repos/{REPO}/releases?per_page=30")
    for release in releases:
        if not release.get("prerelease") or not release.get("tag_name", "").startswith("dev."):
            continue
        url = manifest_url(release)
        if not url:
            continue
        manifest = get_json(url)
        platforms = set(manifest.get("platforms", {}))
        missing = REQUIRED_PLATFORMS - platforms
        if missing:
            print(f"{release['tag_name']}: incomplete, missing {sorted(missing)}; skipping")
            continue
        return manifest
    return None


def main() -> None:
    try:
        manifest = newest_complete_dev()
    except (urllib.error.URLError, OSError, ValueError) as error:
        print(f"dev manifest: keeping the previous file ({error})", file=sys.stderr)
        return

    if manifest is None:
        print("dev manifest: no complete dev release yet; keeping the previous file")
        return

    OUT.parent.mkdir(parents=True, exist_ok=True)
    tmp = OUT.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(manifest, indent=2) + "\n")
    tmp.replace(OUT)
    print(f"dev manifest: {manifest.get('version')}")


if __name__ == "__main__":
    main()
