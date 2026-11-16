#!/usr/bin/env python3
"""The dev-build protocol: guard, prepare, cleanup.

One file owns what the Dev Build workflow does around the builds, so the
workflow itself only names the step:

    python3 scripts/dev_build.py guard      # dev tags live on the dev branch
    python3 scripts/dev_build.py lint-gate  # HEAD already passed the Lint workflow
    python3 scripts/dev_build.py prepare    # version/tag/config/body -> GITHUB_OUTPUT
    python3 scripts/dev_build.py cleanup    # bounded-retention release sweep

Environment inputs (all set by the workflow): GITHUB_EVENT_NAME, GITHUB_REF,
GITHUB_REF_NAME, GITHUB_SHA, GITHUB_RUN_NUMBER, GITHUB_OUTPUT, KEEP,
KEEP_COUNT, KEEP_HOURS, GITHUB_RUN_ID, GITHUB_REPOSITORY and GH_TOKEN.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

TAURI_CONFIG = Path("desktop/src-tauri/tauri.conf.json")
UNRELEASED_CHANGELOG = Path("i18n/changelog/unreleased.md")
DEV_TAG_PREFIX = "dev."
DEV_REF_PREFIX = "refs/tags/" + DEV_TAG_PREFIX
CHANGELOG_LIMIT = 60_000
LINT_WORKFLOW = "lint.yml"
DEV_NOTES = "[Read the latest dev notes](https://kisev.github.io/vibe/changelog/dev)."


def env(name: str) -> str:
    value = os.environ.get(name)
    if value is None:
        raise SystemExit(f"{name} is required")
    return value


def guard() -> int:
    """Fail unless this run's commit is on the dev branch."""
    subprocess.run(["git", "fetch", "--no-tags", "origin", "dev"], check=True)
    event = env("GITHUB_EVENT_NAME")
    ref_name = env("GITHUB_REF_NAME")
    sha = env("GITHUB_SHA")
    if event == "workflow_dispatch" and ref_name != "dev":
        print(
            f"Dev builds are cut from the dev branch; this dispatch ran on {ref_name}",
            file=sys.stderr,
        )
        return 1
    ancestor = subprocess.run(["git", "merge-base", "--is-ancestor", sha, "FETCH_HEAD"])
    if ancestor.returncode != 0:
        print(
            f"dev tags are cut on the dev branch only; {ref_name} is not contained in dev",
            file=sys.stderr,
        )
        return 1
    return 0


def repo_slug() -> str:
    """owner/name, from the workflow's environment or from the origin remote."""
    from_env = os.environ.get("GITHUB_REPOSITORY")
    if from_env:
        return from_env
    url = subprocess.run(
        ["git", "remote", "get-url", "origin"],
        check=True,
        stdout=subprocess.PIPE,
        text=True,
    ).stdout.strip()
    match = re.search(r"[:/]([^/:]+/[^/]+?)(?:\.git)?$", url)
    if not match:
        raise SystemExit(f"cannot read the repository from {url}")
    return match.group(1)


def lint_gate() -> int:
    """Fail unless the Lint workflow already finished green on HEAD.

    The tag rule is "green pipeline first, tag second", and a rule the tooling
    does not check is a rule the maintainer has to remember at 1 a.m. The run
    is looked up with `head_sha`, so a green run on a neighbouring commit never
    counts.
    """
    sha = subprocess.run(
        ["git", "rev-parse", "HEAD"], check=True, stdout=subprocess.PIPE, text=True
    ).stdout.strip()
    query = (
        f"repos/{repo_slug()}/actions/workflows/{LINT_WORKFLOW}"
        f"/runs?head_sha={sha}&per_page=1"
    )
    failure = ""
    for attempt in range(3):
        try:
            payload = json.loads(gh_api(query))
        except (subprocess.CalledProcessError, json.JSONDecodeError) as error:
            failure = str(error)
            if attempt < 2:
                time.sleep(5)
                continue
            print(
                f"could not read the Lint runs for {sha[:8]}: {failure}\n"
                "A tag needs a green Lint run before it exists; retry when GitHub answers.",
                file=sys.stderr,
            )
            return 1
        runs = payload.get("workflow_runs") or []
        if not runs:
            break
        run = runs[0]
        status, conclusion = run.get("status"), run.get("conclusion")
        if status != "completed":
            print(
                f"the Lint run for {sha[:8]} is {status}, not finished "
                f"({run.get('html_url')})",
                file=sys.stderr,
            )
            return 1
        if conclusion != "success":
            print(
                f"the Lint run for {sha[:8]} finished {conclusion} "
                f"({run.get('html_url')})",
                file=sys.stderr,
            )
            return 1
        print(f"lint gate: {sha[:8]} is green ({run.get('html_url')})")
        return 0
    print(
        f"no Lint run exists for {sha[:8]}: dispatch one before tagging\n"
        f"    gh workflow run {LINT_WORKFLOW} --ref dev",
        file=sys.stderr,
    )
    return 1


def unreleased_changelog() -> bytes:
    """The unreleased entry without its frontmatter, as the build used to shape it.

    Drops everything through the second `---` delimiter, leading blank lines,
    and keeps at most 60 KB; command substitution stripped the trailing
    newlines, so they are stripped here too.
    """
    if not UNRELEASED_CHANGELOG.is_file():
        return b""
    records = UNRELEASED_CHANGELOG.read_bytes().split(b"\n")
    if records and records[-1] == b"":
        records.pop()
    body: list[bytes] = []
    delimiters = 0
    for record in records:
        if delimiters < 2:
            if record == b"---":
                delimiters += 1
            continue
        # A `---` inside the body is content (a thematic break, a setext
        # heading), not another delimiter.
        body.append(record + b"\n")
    text = b"".join(body).lstrip(b"\n")[:CHANGELOG_LIMIT]
    return text.rstrip(b"\n")


def prepare() -> int:
    """Compute the dev version, tag, tauri config and release body."""
    base = json.loads(TAURI_CONFIG.read_text())["version"]
    sha = env("GITHUB_SHA")
    ref = env("GITHUB_REF")
    ref_name = env("GITHUB_REF_NAME")
    short = sha[:7]
    if ref.startswith(DEV_REF_PREFIX):
        # A pushed tag started this run: reuse it, never mint a second one, and
        # let its number order the release.
        tag = ref_name
        number = ref_name[len(DEV_TAG_PREFIX) :]
    else:
        # Manual dispatch has no tag; the run number keeps the scheme and still
        # shares one release across re-runs.
        number = env("GITHUB_RUN_NUMBER")
        tag = DEV_TAG_PREFIX + number
    version = f"{base}-dev.{number}.{short}"
    # One no-space JSON: tauri-action splits args on whitespace. Dev builds
    # carry signed updater artifacts so the Dev channel can move them forward;
    # the endpoints stay empty because the channel file is chosen at runtime.
    config = json.dumps(
        {
            "version": version,
            "bundle": {"createUpdaterArtifacts": True},
            "plugins": {"updater": {"endpoints": []}},
        },
        separators=(",", ":"),
    )
    body = f"Dev build of dev at {sha}.\n\n{DEV_NOTES}\n\n".encode() + unreleased_changelog()
    with Path(env("GITHUB_OUTPUT")).open("ab") as handle:
        handle.write(f"version={version}\n".encode())
        handle.write(f"tag={tag}\n".encode())
        handle.write(f"config={config}\n".encode())
        # Multiline output; tauri-action publishes it as the release body.
        handle.write(b"body<<CHANGELOG_EOF\n")
        handle.write(body + b"\n")
        handle.write(b"CHANGELOG_EOF\n")
    return 0


def gh_api(*args: str) -> str:
    # stderr stays inherited so gh's warnings surface as they did in the shell.
    completed = subprocess.run(
        ["gh", "api", *args], check=True, stdout=subprocess.PIPE, text=True
    )
    return completed.stdout


def cleanup() -> int:
    """Bounded retention: newest N, the last 24 hours, and only older releases."""
    keep = env("KEEP")
    # A green cleanup must mean the sweep actually ran: an empty KEEP is an
    # error, not a silent no-op.
    if not keep:
        print("no tag came from the build outputs", file=sys.stderr)
        return 1
    repo = env("GITHUB_REPOSITORY")
    run_id = env("GITHUB_RUN_ID")
    keep_count = int(env("KEEP_COUNT"))
    keep_hours = int(env("KEEP_HOURS"))
    started = gh_api(f"repos/{repo}/actions/runs/{run_id}", "--jq", ".created_at").strip()
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=keep_hours)).strftime(
        "%Y-%m-%dT%H:%M:%SZ"
    )
    pages = json.loads(
        gh_api(f"repos/{repo}/releases?per_page=100", "--paginate", "--slurp")
    )
    releases = [release for page in pages for release in page]
    # Dev prereleases only (tag pattern and prerelease flag must both match),
    # by id — duplicate releases on one tag must all go. Newest first.
    dev_releases = [
        release
        for release in releases
        if release.get("prerelease") and re.match(r"^dev\.", release.get("tag_name") or "")
    ]
    newest_first = list(
        reversed(sorted(dev_releases, key=lambda release: release["created_at"]))
    )
    # Drop the protected head, then delete only what is older than this run and
    # outside the 24-hour window.
    for release in newest_first[keep_count:]:
        if (
            release["tag_name"] != keep
            and release["created_at"] < started
            and release["created_at"] < cutoff
        ):
            subprocess.run(
                ["gh", "api", "-X", "DELETE", f"repos/{repo}/releases/{release['id']}"],
                check=True,
            )
            print(f"deleted dev release {release['id']} (tag kept)")
    print(f"cleanup done: newest {keep_count} and the last {keep_hours} hours kept")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    commands = {
        "guard": guard,
        "lint-gate": lint_gate,
        "prepare": prepare,
        "cleanup": cleanup,
    }
    parser.add_argument("command", choices=commands)
    args = parser.parse_args(argv)
    return commands[args.command]()


if __name__ == "__main__":
    raise SystemExit(main())
