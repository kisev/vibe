#!/usr/bin/env -S uv run
"""Tests for `scripts/content_i18n.py`.

    uv run scripts/content_i18n_test.py
"""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

import content_i18n


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


ENGLISH = """---
version: unreleased
date: 2026-01-01
title: "Dev notes"
---

## New

- Something happened.
"""


class AuditTest(unittest.TestCase):
    """Runs the audit against a temporary tree instead of the repository."""

    def setUp(self) -> None:
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        root = Path(temporary.name)
        write(
            root / "i18n/locales.json",
            json.dumps(
                [
                    {"code": "en-US", "website": True},
                    {"code": "fr-FR", "website": True},
                    {"code": "ca-AD", "website": False},
                ]
            ),
        )
        self.changelog = root / "i18n/changelog"
        self.docs = root / "i18n/docs"
        write(self.changelog / "unreleased.md", ENGLISH)

        self.saved = (content_i18n.ROOT, content_i18n.CHANGELOG, content_i18n.DOCS, content_i18n.DOC_RELATIVE)
        content_i18n.ROOT = root
        content_i18n.CHANGELOG = self.changelog
        content_i18n.DOCS = self.docs
        # The docs tests set the page list they need; the changelog tests expect none.
        content_i18n.DOC_RELATIVE = ()
        self.addCleanup(self.restore)

    def restore(self) -> None:
        content_i18n.ROOT, content_i18n.CHANGELOG, content_i18n.DOCS, content_i18n.DOC_RELATIVE = self.saved

    def translated(self, source: str | None = None) -> Path:
        """The French dev entry, stamped with the English hash unless one is given."""
        stamp = source if source is not None else content_i18n.source_hash(self.changelog / "unreleased.md")
        path = self.changelog / "fr-FR/unreleased.md"
        write(
            path,
            f"""---
version: unreleased
date: 2026-01-01
title: "Notes de dev"
source: {stamp}
---

## New

- Quelque chose est arrivé.
""",
        )
        return path

    def test_a_locale_without_the_dev_entry_is_warned_about(self) -> None:
        issues, warnings = content_i18n.audit()

        self.assertEqual(issues, [])
        self.assertIn("changelog fr-FR: unreleased.md is not translated, using fallback", warnings)

    def test_a_current_translation_passes_the_audit(self) -> None:
        self.translated()

        issues, warnings = content_i18n.audit()

        self.assertEqual(issues, [])
        self.assertEqual(warnings, [])

    def test_a_translation_from_older_english_notes_is_warned_about(self) -> None:
        self.translated("000000000000")

        issues, warnings = content_i18n.audit()

        self.assertEqual(issues, [])
        self.assertIn("changelog fr-FR: unreleased translated from older English notes", warnings)

    def test_an_english_page_the_site_does_not_show_is_an_issue(self) -> None:
        content_i18n.DOC_RELATIVE = ("tutorials/install.md",)
        write(self.docs / "en-US/tutorials/install.md", "# Install\n")
        write(self.docs / "en-US/tutorials/retired.md", "# Retired\n")

        issues, _ = content_i18n.audit()

        self.assertIn("docs: i18n/docs/en-US/tutorials/retired.md is not a page the site shows", issues)

    def test_a_locale_without_a_docs_page_is_warned_about(self) -> None:
        content_i18n.DOC_RELATIVE = ("tutorials/install.md",)
        write(self.docs / "en-US/tutorials/install.md", "# Install\n")

        _, warnings = content_i18n.audit()

        self.assertIn("docs fr-FR: 1 of the 1 pages not translated, using fallback", warnings)


if __name__ == "__main__":
    unittest.main()
