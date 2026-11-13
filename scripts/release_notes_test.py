#!/usr/bin/env -S uv run
"""Tests for `scripts/release_notes.py`.

    uv run scripts/release_notes_test.py
"""

from __future__ import annotations

import contextlib
import io
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import release_notes

SITE = "https://kisev.github.io/vibe/changelog"


class ReleaseNotesTest(unittest.TestCase):
    def setUp(self) -> None:
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.changelog = Path(temporary.name) / "i18n" / "changelog"
        patcher = mock.patch.object(release_notes, "CHANGELOG", self.changelog)
        patcher.start()
        self.addCleanup(patcher.stop)

    def entry(self, version: str, text: str) -> Path:
        self.changelog.mkdir(parents=True, exist_ok=True)
        path = self.changelog / f"{version}.md"
        path.write_text(text, encoding="utf-8")
        return path

    def good_entry(self, version: str) -> str:
        return (
            f"---\nversion: {version}\ndate: 2026-11-13\ntitle: Notes\n---\n\n"
            "## New\n\n- Something users can see\n"
        )

    def run_main(self, version: str, *argv: str, **environment: str) -> tuple[int, str, str]:
        out, err = io.StringIO(), io.StringIO()
        values = {"VERSION": version, "RELEASE_NOTES": "", **environment}
        with (
            mock.patch.dict(os.environ, values),
            contextlib.redirect_stdout(out),
            contextlib.redirect_stderr(err),
        ):
            code = release_notes.main(list(argv))
        return code, out.getvalue(), err.getvalue()

    def test_stable_body_is_the_link_line_and_the_english_entry(self) -> None:
        self.entry("1.1.0", self.good_entry("1.1.0"))

        code, out, err = self.run_main("1.1.0")

        self.assertEqual(code, 0, err)
        self.assertEqual(
            out,
            f"Read this changelog in your language: {SITE}/1.1.0\n\n"
            "## New\n\n- Something users can see\n",
        )

    def test_rc_candidate_is_accepted(self) -> None:
        self.entry("1.1.0-rc.1", self.good_entry("1.1.0-rc.1"))

        code, out, err = self.run_main("1.1.0-rc.1")

        self.assertEqual(code, 0, err)
        self.assertIn(f"{SITE}/1.1.0-rc.1", out)

    def test_malformed_frontmatter_names_the_file(self) -> None:
        path = self.entry("1.1.0", "---\nversion 1.1.0\n---\n\n## New\n\n- Something\n")

        code, _, err = self.run_main("1.1.0")

        self.assertEqual(code, 1)
        self.assertIn(str(path), err)
        self.assertIn("malformed", err)

    def test_missing_frontmatter_names_the_file(self) -> None:
        path = self.entry("1.1.0", "## New\n\n- Something\n")

        code, _, err = self.run_main("1.1.0")

        self.assertEqual(code, 1)
        self.assertIn(str(path), err)
        self.assertIn("frontmatter is missing", err)

    def test_frontmatter_version_must_match(self) -> None:
        path = self.entry("1.1.0", self.good_entry("1.0.0"))

        code, _, err = self.run_main("1.1.0")

        self.assertEqual(code, 1)
        self.assertIn(str(path), err)
        self.assertIn("does not match", err)

    def test_non_rc_prerelease_is_refused(self) -> None:
        code, _, err = self.run_main("1.1.0-beta.1")

        self.assertEqual(code, 1)
        self.assertIn("rc", err)

    def test_github_output_receives_the_body(self) -> None:
        self.entry("1.1.0", self.good_entry("1.1.0"))
        output = Path(self.changelog.parent.parent) / "github-output"

        code, out, err = self.run_main(
            "1.1.0", "--github-output", GITHUB_OUTPUT=str(output)
        )

        self.assertEqual(code, 0, err)
        self.assertEqual(out, "")
        written = output.read_text(encoding="utf-8")
        self.assertIn("body<<", written)
        self.assertIn(f"{SITE}/1.1.0", written)
        self.assertTrue(written.rstrip("\n").endswith(release_notes.GITHUB_OUTPUT_DELIMITER))


if __name__ == "__main__":
    unittest.main()
