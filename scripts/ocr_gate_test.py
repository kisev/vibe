#!/usr/bin/env python3
"""Tests for the OCR commit gate: parsing, classification, and the staged snapshot."""

from __future__ import annotations

import contextlib
import io
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import ocr_gate

SCRIPT = Path(__file__).resolve().parent / "ocr_gate.py"
FIXTURES = Path(__file__).resolve().parent / "fixtures"

STUB = """#!/usr/bin/env python3
import json, os, sys

args = sys.argv[1:]
if os.environ.get("STUB_ARGS"):
    with open(os.environ["STUB_ARGS"], "a", encoding="utf-8") as handle:
        handle.write(json.dumps(args) + "\\n")
if "--preview" in args:
    if os.environ.get("STUB_MODE") == "docs":
        print("Preview: 1 file(s) changed | +1 -0")
        print()
        print("Excluded from review (1):")
        print("  [M]  README.md            (unsupported_ext)")
    else:
        print("Preview: 1 file(s) changed | +1 -0")
        print()
        print("Will review (1):")
        print("  [M]  file.py              +1    -0")
    sys.exit(0)
mode = os.environ.get("STUB_MODE", "medium")
output = args[args.index("--output") + 1]
if mode == "failed":
    payload = {"status": "failed", "comments": None, "message": "provider down", "session_id": "stub"}
    code = 1
elif mode == "nojson":
    sys.exit(0)
elif mode == "none":
    payload = {"status": "completed", "comments": [], "session_id": "stub"}
    code = 0
elif mode == "partial":
    payload = {
        "status": "completed",
        "session_id": "stub",
        "tool_calls": {"total": 3, "failure": 1},
        "comments": [],
    }
    code = 0
else:
    severity = "low" if mode == "low" else "medium"
    payload = {
        "status": "completed",
        "session_id": "stub",
        "comments": [
            {
                "path": "file.py",
                "start_line": 3,
                "end_line": 3,
                "severity": severity,
                "content": "A deliberately reported finding.",
            }
        ],
    }
    code = 0
with open(output, "w", encoding="utf-8") as handle:
    json.dump(payload, handle)
sys.exit(code)
"""


def git(*args: str, cwd: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(["git", *args], cwd=cwd, capture_output=True, text=True, check=True)


def make_repo(root: Path, initial: bool = True) -> None:
    root.mkdir(parents=True, exist_ok=True)
    git("init", "-q", cwd=root)
    git("config", "user.email", "test@example.com", cwd=root)
    git("config", "user.name", "Test", cwd=root)
    if initial:
        (root / "file.py").write_text("a = 1\n", encoding="utf-8")
        git("add", "file.py", cwd=root)
        git("commit", "-qm", "init", cwd=root)


def run_gate(root: Path, stub: Path, **env: str) -> subprocess.CompletedProcess[str]:
    environment = {
        **os.environ,
        "OCR_GATE_OCR": str(stub),
        "GIT_CONFIG_GLOBAL": "/dev/null",
        **env,
    }
    return subprocess.run(
        [sys.executable, str(SCRIPT)],
        cwd=root,
        capture_output=True,
        text=True,
        env=environment,
        timeout=120,
        check=False,
    )


class ParsingTest(unittest.TestCase):
    def test_blocks_medium_high_and_critical(self) -> None:
        comments = [
            {"severity": "high", "path": "a.py", "start_line": 1, "content": "x"},
            {"severity": "MEDIUM", "path": "b.py", "start_line": 2, "content": "x"},
            {"severity": "critical", "path": "c.py", "start_line": 3, "content": "x"},
            {"severity": "low", "path": "d.py", "start_line": 4, "content": "x"},
            {"severity": "info", "path": "e.py", "start_line": 5, "content": "x"},
            {"path": "f.py"},
        ]
        blocking, low = ocr_gate.classify(comments)
        self.assertEqual(len(blocking), 3)
        self.assertEqual(len(low), 3)

    def test_describe_names_path_line_severity_and_message(self) -> None:
        text = ocr_gate.describe(
            {"severity": "medium", "path": "file.py", "start_line": 7, "content": "Broken\nthing"}
        )
        self.assertEqual(text, "file.py:7 [medium] Broken thing")

    def test_extract_comments(self) -> None:
        self.assertEqual(ocr_gate.extract_comments({"comments": [{"severity": "high"}]}), [{"severity": "high"}])
        self.assertEqual(ocr_gate.extract_comments({"comments": []}), [])
        self.assertIsNone(ocr_gate.extract_comments({"status": "failed", "comments": None}))
        self.assertIsNone(ocr_gate.extract_comments({}))

    def test_clean_null_comments_with_zero_summary_is_a_pass(self) -> None:
        payload = {"status": "completed", "comments": None, "summary": {"comments": 0}}
        self.assertEqual(ocr_gate.extract_comments(payload), [])

    def test_partial_tool_call_failure_is_reported(self) -> None:
        payload = {"tool_calls": {"total": 3, "failure": 1}}
        self.assertEqual(ocr_gate.partial_failure(payload), (1, 3))
        self.assertFalse(ocr_gate.tool_calls_failed(payload))
        self.assertIsNone(ocr_gate.partial_failure({"tool_calls": {"total": 3, "failure": 0}}))

    def test_warn_partial_accepts_a_fresh_tuple_and_a_cached_list(self) -> None:
        for partial in ((1, 3), [1, 3]):
            stderr = io.StringIO()
            with contextlib.redirect_stderr(stderr):
                ocr_gate.warn_partial(partial)
            self.assertIn("1 of 3 review subtasks failed", stderr.getvalue(), partial)
        for ignored in (None, (0, 3), (3, 3), (3, 1), [1], ["1", 3]):
            stderr = io.StringIO()
            with contextlib.redirect_stderr(stderr):
                ocr_gate.warn_partial(ignored)
            self.assertEqual(stderr.getvalue(), "", ignored)

    def test_cache_fingerprint_tracks_provider_and_model(self) -> None:
        with tempfile.TemporaryDirectory() as home:
            config = Path(home) / ".opencodereview" / "config.json"
            config.parent.mkdir()
            with mock.patch.dict(os.environ, {"HOME": home}):
                config.write_text('{"provider": "router", "model": "m1"}', encoding="utf-8")
                first = ocr_gate.review_settings_fingerprint()
                config.write_text('{"provider": "router", "model": "m2"}', encoding="utf-8")
                second = ocr_gate.review_settings_fingerprint()
        self.assertNotEqual(first, second)

    def test_reviewable_count(self) -> None:
        self.assertEqual(ocr_gate.reviewable_count("Preview: 2 file(s) changed\nWill review (1):"), 1)
        self.assertEqual(
            ocr_gate.reviewable_count("Preview: 1 file(s) changed\nExcluded from review (1):"), 0
        )
        self.assertIsNone(ocr_gate.reviewable_count("garbage"))

    def test_real_success_fixture(self) -> None:
        fixture = json.loads((FIXTURES / "ocr_review.json").read_text(encoding="utf-8"))
        self.assertEqual(ocr_gate.extract_comments(fixture), [])
        # The provider reported "complete" while every tool call failed: no findings is not a pass.
        self.assertTrue(ocr_gate.tool_calls_failed(fixture))

    def test_real_failure_fixture(self) -> None:
        fixture = json.loads((FIXTURES / "ocr_review_failed.json").read_text(encoding="utf-8"))
        self.assertIsNone(ocr_gate.extract_comments(fixture))


class GateTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        base = Path(self.temp.name)
        self.repo = base / "repo"
        make_repo(self.repo)
        (self.repo / "file.py").write_text("a = 1\nb = 2\n", encoding="utf-8")
        git("add", "file.py", cwd=self.repo)
        self.stub = base / "stub.py"
        self.stub.write_text(STUB, encoding="utf-8")
        self.stub.chmod(0o755)
        self.args = base / "args"

    def tearDown(self) -> None:
        self.temp.cleanup()

    def calls(self) -> list[list[str]]:
        if not self.args.exists():
            return []
        return [json.loads(line) for line in self.args.read_text(encoding="utf-8").splitlines()]

    def test_medium_finding_blocks_and_names_the_finding(self) -> None:
        result = run_gate(self.repo, self.stub, STUB_MODE="medium", STUB_ARGS=str(self.args))
        self.assertEqual(result.returncode, 1, result.stderr)
        self.assertIn("file.py:3 [medium]", result.stdout)

    def test_low_finding_passes_and_is_printed(self) -> None:
        result = run_gate(self.repo, self.stub, STUB_MODE="low")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("file.py:3 [low]", result.stdout)
        self.assertIn("review session: ocr session export stub", result.stdout)
        self.assertIn("no medium/high findings (1 low)", result.stdout)

    def test_partial_failure_warns_on_a_fresh_run(self) -> None:
        result = run_gate(self.repo, self.stub, STUB_MODE="partial")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("1 of 3 review subtasks failed", result.stderr)
        self.assertNotIn("cached verdict", result.stdout)

    def test_no_cache_accepts_false_as_off(self) -> None:
        run_gate(self.repo, self.stub, STUB_MODE="low")
        result = run_gate(self.repo, self.stub, STUB_MODE="low", OCR_GATE_NO_CACHE="false")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("cached verdict", result.stdout)
        fresh = run_gate(self.repo, self.stub, STUB_MODE="low", OCR_GATE_NO_CACHE="1")
        self.assertNotIn("cached verdict", fresh.stdout)

    def test_ocr_override_may_carry_arguments(self) -> None:
        result = run_gate(
            self.repo, self.stub, STUB_MODE="low", OCR_GATE_OCR=f"{sys.executable} {self.stub}"
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("no medium/high findings", result.stdout)

    def test_review_sees_only_the_staged_snapshot(self) -> None:
        (self.repo / "unstaged.py").write_text("x = 1\n", encoding="utf-8")
        run_gate(self.repo, self.stub, STUB_MODE="medium", STUB_ARGS=str(self.args))
        review = [call for call in self.calls() if "--commit" in call and "--preview" not in call][0]
        snapshot = review[review.index("--commit") + 1]
        changed = subprocess.run(
            ["git", "show", "--name-only", "--format=", snapshot],
            cwd=self.repo,
            capture_output=True,
            text=True,
            check=True,
        ).stdout.split()
        self.assertEqual(changed, ["file.py"])

    def test_second_run_uses_the_cache(self) -> None:
        run_gate(self.repo, self.stub, STUB_MODE="low", STUB_ARGS=str(self.args))
        review_calls = [call for call in self.calls() if "--output" in call]
        self.assertEqual(len(review_calls), 1)
        result = run_gate(self.repo, self.stub, STUB_MODE="low", STUB_ARGS=str(self.args))
        self.assertIn("cached verdict", result.stdout)
        self.assertEqual(len([call for call in self.calls() if "--output" in call]), len(review_calls))

    def test_infrastructure_failure_is_a_warning(self) -> None:
        result = run_gate(self.repo, self.stub, STUB_MODE="failed")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("review NOT run", result.stdout)
        self.assertIn("provider", result.stdout)
        # Never a clean-verdict line: the review did not happen.
        self.assertNotIn("no medium/high findings", result.stdout)

    def test_no_usable_output_is_a_warning(self) -> None:
        result = run_gate(self.repo, self.stub, STUB_MODE="nojson")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("review NOT run", result.stdout)
        self.assertIn("no JSON output", result.stdout)
        self.assertNotIn("no medium/high findings", result.stdout)

    def test_no_staged_changes_is_not_a_skip(self) -> None:
        (self.repo / "file.py").write_text("a = 1\n", encoding="utf-8")
        git("add", "file.py", cwd=self.repo)
        result = run_gate(self.repo, self.stub, STUB_MODE="medium", STUB_ARGS=str(self.args))
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("no staged changes", result.stdout)
        self.assertNotIn("review NOT run", result.stdout)
        self.assertEqual(self.calls(), [])

    def test_no_reviewable_files_is_a_pass(self) -> None:
        result = run_gate(self.repo, self.stub, STUB_MODE="docs")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("no reviewable files staged", result.stdout)
        self.assertNotIn("review NOT run", result.stdout)
        self.assertEqual([call for call in self.calls() if "--output" in call], [])

    def test_ocr_skip_bypasses_everything(self) -> None:
        result = run_gate(self.repo, self.stub, OCR_SKIP="1")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("review NOT run", result.stdout)
        self.assertIn("OCR_SKIP", result.stdout)
        self.assertEqual(self.calls(), [])

    def test_first_commit_warns_and_allows(self) -> None:
        repo = Path(self.temp.name) / "fresh"
        make_repo(repo, initial=False)
        (repo / "file.py").write_text("a = 1\n", encoding="utf-8")
        git("add", "file.py", cwd=repo)
        result = run_gate(repo, self.stub)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("first commit", result.stdout)
        self.assertIn("review NOT run", result.stdout)


if __name__ == "__main__":
    unittest.main()
