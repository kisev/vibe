#!/usr/bin/env python3
"""Review exactly the staged snapshot with OCR and gate the commit on findings.

The pre-commit hook has no way to ask `ocr review` for "the index": workspace
mode takes staged, unstaged and untracked files together. So the staged tree is
turned into an unreferenced commit object (`git write-tree` + `git commit-tree`)
and reviewed with `--commit`, which diffs it against `HEAD`. The object is never
reachable from a ref, so it cannot show up in `git log` and the GC drops it.

A medium or high finding blocks the commit. Low findings are reported. A review
that cannot run (provider down, timeout, no configuration, unknown output) is a
warning and lets the commit through: an LLM outage must not stop local work.
`OCR_SKIP=1` bypasses the gate entirely; `OCR_GATE_NO_CACHE=1` forces a fresh
review.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

EFFORT = "high"
REVIEW_TIMEOUT_MINUTES = 15
GATE_VERSION = "1"
BLOCKING_SEVERITIES = {"high", "medium", "critical"}
PREVIEW_TIMEOUT_SECONDS = 120
REVIEW_TIMEOUT_SECONDS = (REVIEW_TIMEOUT_MINUTES + 1) * 60


def run_git(*args: str, cwd: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(["git", *args], cwd=cwd, capture_output=True, text=True, check=False)


def ocr_command() -> list[str] | None:
    override = os.environ.get("OCR_GATE_OCR")
    if override:
        return [override]
    mise = shutil.which("mise")
    if mise is None:
        return None
    return [mise, "exec", "--", "ocr"]


def skip(reason: str) -> int:
    print(f"ocr commit gate skipped: {reason}", file=sys.stderr)
    return 0


def find_value(payload: object, key: str) -> object | None:
    """Find the first value for `key` anywhere in a JSON document."""
    stack = [payload]
    while stack:
        node = stack.pop()
        if isinstance(node, dict):
            if key in node:
                return node[key]
            stack.extend(node.values())
        elif isinstance(node, list):
            stack.extend(node)
    return None


def extract_comments(payload: object) -> list[dict] | None:
    """Return the review's comment list, or None when the run produced no result."""
    comments = find_value(payload, "comments")
    if isinstance(comments, list):
        return [comment for comment in comments if isinstance(comment, dict)]
    if comments is None and isinstance(payload, dict):
        # A clean review may report zero comments as null; a failed one says so.
        summary = payload.get("summary")
        if payload.get("status") != "failed" and isinstance(summary, dict) and summary.get("comments") == 0:
            return []
    return None


def tool_calls_failed(payload: object) -> bool:
    """True when every tool call failed, which some providers still report as complete."""
    counts = tool_call_counts(payload)
    return counts is not None and counts[0] == counts[1] and counts[1] > 0


def tool_call_counts(payload: object) -> tuple[int, int] | None:
    """The (failed, total) tool-call counts when the provider reports any failure."""
    tool_calls = find_value(payload, "tool_calls")
    if not isinstance(tool_calls, dict):
        return None
    total = tool_calls.get("total")
    failure = tool_calls.get("failure")
    if not isinstance(total, int) or not isinstance(failure, int) or total == 0:
        return None
    return (failure, total)


def partial_failure(payload: object) -> tuple[int, int] | None:
    counts = tool_call_counts(payload)
    if counts is not None and 0 < counts[0] < counts[1]:
        return counts
    return None


def severity_of(comment: dict) -> str:
    return str(comment.get("severity") or comment.get("level") or "unknown").strip().lower()


def blocks(comment: dict) -> bool:
    return severity_of(comment) in BLOCKING_SEVERITIES


def describe(comment: dict) -> str:
    path = comment.get("path") or comment.get("file") or "?"
    line = comment.get("start_line") or comment.get("line") or "?"
    text = str(comment.get("content") or comment.get("message") or "").strip()
    text = " ".join(text.split())
    return f"{path}:{line} [{severity_of(comment)}] {text}"


def classify(comments: list[dict]) -> tuple[list[dict], list[dict]]:
    blocking = [comment for comment in comments if blocks(comment)]
    low = [comment for comment in comments if not blocks(comment)]
    return blocking, low


def cache_dir(root: Path) -> Path:
    git_dir = run_git("rev-parse", "--absolute-git-dir", cwd=root)
    if git_dir.returncode != 0:
        return root / ".git" / "ocr-gate"
    return Path(git_dir.stdout.strip()) / "ocr-gate"


def cache_key(parent: str, tree: str, settings: str) -> str:
    material = f"{GATE_VERSION}:{EFFORT}:{settings}:{parent}:{tree}".encode()
    return hashlib.sha256(material).hexdigest()


def review_settings_fingerprint() -> str:
    """Identify the provider/model that will run the review, so a switch re-reviews.

    The configuration lives outside the repository (`~/.opencodereview/config.json`),
    and its provider/model pair is the part that decides review quality. The whole
    file is hashed when it cannot be parsed, so an unreadable shape still invalidates
    the cache instead of pretending the settings are unchanged.
    """
    config = Path.home() / ".opencodereview" / "config.json"
    try:
        text = config.read_text(encoding="utf-8")
    except OSError:
        return "unconfigured"
    try:
        data = json.loads(text)
    except ValueError:
        return hashlib.sha256(text.encode()).hexdigest()
    if isinstance(data, dict):
        provider = str(data.get("provider") or "")
        model = str(data.get("model") or "")
        if provider or model:
            return hashlib.sha256(f"{provider}:{model}".encode()).hexdigest()
    return hashlib.sha256(text.encode()).hexdigest()


def read_cache(path: Path) -> dict | None:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None
    return data if isinstance(data, dict) and isinstance(data.get("comments"), list) else None


def write_cache(path: Path, comments: list[dict], session_id: str | None, partial: tuple[int, int] | None) -> None:
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        payload = {"comments": comments, "session_id": session_id, "partial": partial}
        temporary = path.with_suffix(f".{os.getpid()}.tmp")
        temporary.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
        temporary.replace(path)
    except OSError:
        # A read-only git dir must not turn a clean review into a blocked commit.
        pass


def reviewable_count(preview_text: str) -> int | None:
    match = re.search(r"Will review \((\d+)\)", preview_text)
    if match:
        return int(match.group(1))
    # A preview that lists only excluded files has no "Will review" block.
    if "Excluded from review" in preview_text and "Preview:" in preview_text:
        return 0
    return None


def report(blocking: list[dict], low: list[dict], session_id: str | None) -> int:
    for comment in blocking:
        print(describe(comment))
    if blocking:
        print(f"ocr commit gate blocked: {len(blocking)} medium/high finding(s).")
        if low:
            print(f"{len(low)} low finding(s) not shown; run `ocr session export {session_id}` for the full list.")
        if session_id:
            print(f"review session: ocr session export {session_id}")
        print("Fix the findings, or bypass with OCR_SKIP=1 (document it in the commit body).")
        return 1
    print(f"ocr commit gate: no medium/high findings ({len(low)} low).")
    return 0


def warn_partial(partial: object) -> None:
    """A partly failed run still returns findings; say they may be incomplete."""
    if (
        isinstance(partial, list)
        and len(partial) == 2
        and all(isinstance(value, int) for value in partial)
        and 0 < partial[0] < partial[1]
    ):
        print(
            f"ocr commit gate: warning: {partial[0]} of {partial[1]} review subtasks failed; findings may be incomplete",
            file=sys.stderr,
        )


def parse_result_file(path: Path) -> object | None:
    try:
        return json.loads(path.read_text(encoding="utf-8", errors="replace"))
    except (OSError, ValueError):
        return None


def main() -> int:
    if os.environ.get("OCR_SKIP", "").strip().lower() in {"1", "true", "yes"}:
        print("ocr commit gate: skipped via OCR_SKIP")
        return 0

    root_result = run_git("rev-parse", "--show-toplevel", cwd=Path.cwd())
    if root_result.returncode != 0:
        return skip("not inside a git worktree")
    root = Path(root_result.stdout.strip())

    staged = run_git("diff", "--cached", "--quiet", cwd=root)
    if staged.returncode == 0:
        print("ocr commit gate: no staged changes")
        return 0
    if staged.returncode != 1:
        return skip("git diff --cached failed")

    parent_result = run_git("rev-parse", "--verify", "-q", "HEAD", cwd=root)
    if parent_result.returncode != 0:
        return skip("HEAD has no parent yet (first commit)")
    parent = parent_result.stdout.strip()

    tree_result = run_git("write-tree", cwd=root)
    if tree_result.returncode != 0:
        return skip(f"git write-tree failed: {tree_result.stderr.strip()}")
    tree = tree_result.stdout.strip()

    commit_result = run_git("commit-tree", tree, "-p", parent, "-m", "ocr commit gate: staged snapshot", cwd=root)
    if commit_result.returncode != 0:
        return skip(f"git commit-tree failed: {commit_result.stderr.strip()}")
    snapshot = commit_result.stdout.strip()

    command = ocr_command()
    if command is None:
        return skip("ocr is not installed (mise install)")

    preview_command = [*command, "review", "--commit", snapshot, "--preview", "--repo", str(root)]
    try:
        preview = subprocess.run(
            preview_command,
            cwd=root,
            capture_output=True,
            text=True,
            timeout=PREVIEW_TIMEOUT_SECONDS,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired) as error:
        return skip(f"ocr preview could not run: {error}")
    count = reviewable_count(f"{preview.stdout}\n{preview.stderr}")
    if preview.returncode != 0 or count is None:
        return skip("ocr preview did not report reviewable files")
    if count == 0:
        print("ocr commit gate: no reviewable files staged")
        return 0

    cache_path = cache_dir(root) / f"{cache_key(parent, tree, review_settings_fingerprint())}.json"
    if os.environ.get("OCR_GATE_NO_CACHE", "") in {"", "0"}:
        cached = read_cache(cache_path)
        if cached is not None:
            blocking, low = classify(cached["comments"])
            warn_partial(cached.get("partial"))
            print("ocr commit gate: cached verdict")
            return report(blocking, low, cached.get("session_id"))

    with tempfile.TemporaryDirectory(prefix="ocr-gate-") as work:
        output = Path(work) / "review.json"
        review_command = [
            *command,
            "review",
            "--commit",
            snapshot,
            "--format",
            "json",
            "--output",
            str(output),
            "--audience",
            "agent",
            "--effort",
            EFFORT,
            "--timeout",
            str(REVIEW_TIMEOUT_MINUTES),
            "--repo",
            str(root),
        ]
        try:
            review = subprocess.run(
                review_command,
                cwd=root,
                capture_output=True,
                text=True,
                timeout=REVIEW_TIMEOUT_SECONDS,
                check=False,
            )
        except (OSError, subprocess.TimeoutExpired) as error:
            return skip(f"ocr review could not run: {error}")
        payload = parse_result_file(output)
        if payload is None:
            detail = "no JSON output"
            if review.stderr.strip():
                detail = f"{detail}: {review.stderr.strip().splitlines()[-1]}"
            return skip(detail)
        comments = extract_comments(payload)
        if comments is None:
            message = find_value(payload, "message")
            return skip(f"review failed: {message}" if message else "review produced no comment list")
        if not comments and tool_calls_failed(payload):
            return skip("the provider returned no usable findings (every tool call failed)")
        partial = partial_failure(payload)
        warn_partial(partial)

    session_id = find_value(payload, "session_id")
    write_cache(cache_path, comments, session_id if isinstance(session_id, str) else None, partial)
    blocking, low = classify(comments)
    return report(blocking, low, session_id if isinstance(session_id, str) else None)


if __name__ == "__main__":
    sys.exit(main())
