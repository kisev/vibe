#!/usr/bin/env -S uv run
"""Tests for `scripts/roadmap.py`.

    uv run scripts/roadmap_test.py
"""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

import roadmap


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


class RoadmapTest(unittest.TestCase):
    def setUp(self) -> None:
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.changes = Path(temporary.name) / "openspec" / "changes"

    def proposal(self, name: str, why: str) -> None:
        write(
            self.changes / name / "proposal.md",
            f"# Proposal\n\n## Why\n\n{why}\n\n## What Changes\n\n- Something.\n",
        )

    def test_collects_unarchived_changes_sorted_by_name(self) -> None:
        self.proposal("zebra-change", "Zebras are striped. This sentence is not part of the roadmap.")
        self.proposal("alpha-change", "`Alpha` is *first* with [a link](https://example.com).")
        self.proposal("archive/middle-change", "Shipped long ago.")

        entries = roadmap.collect(self.changes)

        self.assertEqual([entry["name"] for entry in entries], ["alpha-change", "zebra-change"])
        self.assertEqual(entries[0]["title"], "Alpha change")
        self.assertEqual(entries[0]["why"], "Alpha is first with a link.")
        self.assertEqual(entries[1]["why"], "Zebras are striped.")

    def test_keeps_angle_bracket_placeholders(self) -> None:
        self.proposal("placeholder-change", "The page has no `i18n/changelog/<locale>/unreleased.md` yet.")

        entries = roadmap.collect(self.changes)

        self.assertEqual(entries[0]["why"], "The page has no i18n/changelog/<locale>/unreleased.md yet.")

    def test_uses_a_real_h1_as_the_title(self) -> None:
        write(
            self.changes / "titled-change" / "proposal.md",
            "# Model comparison lab\n\n## Why\n\nPeople pick models on other people's benchmarks.\n\n## What Changes\n\n- A lab.\n",
        )

        entries = roadmap.collect(self.changes)

        self.assertEqual(entries[0]["title"], "Model comparison lab")

    def test_output_is_deterministic(self) -> None:
        self.proposal("second-change", "Second change exists.")
        self.proposal("first-change", "First change exists.")

        first = roadmap.render(roadmap.collect(self.changes))
        second = roadmap.render(roadmap.collect(self.changes))

        self.assertEqual(first, second)
        self.assertEqual([entry["name"] for entry in json.loads(first)], ["first-change", "second-change"])
        self.assertTrue(first.endswith("\n"))

    def test_fails_on_a_change_without_a_proposal(self) -> None:
        (self.changes / "empty-change").mkdir(parents=True)

        with self.assertRaises(SystemExit) as caught:
            roadmap.collect(self.changes)

        self.assertIn("missing proposal.md", str(caught.exception))

    def test_fails_on_a_proposal_without_a_why_section(self) -> None:
        write(self.changes / "broken-change" / "proposal.md", "# Proposal\n\n## What Changes\n\n- Something.\n")

        with self.assertRaises(SystemExit) as caught:
            roadmap.collect(self.changes)

        self.assertIn("`## Why`", str(caught.exception))

    def test_fails_on_an_empty_why_section(self) -> None:
        write(self.changes / "empty-why" / "proposal.md", "# Proposal\n\n## Why\n\n## What Changes\n\n- Something.\n")

        with self.assertRaises(SystemExit) as caught:
            roadmap.collect(self.changes)

        self.assertIn("`## Why`", str(caught.exception))

    def test_writes_the_json_file(self) -> None:
        self.proposal("one-change", "One change exists.")
        out = Path(self.changes).parent / "roadmap.json"

        roadmap.write(roadmap.collect(self.changes), out)

        self.assertEqual(json.loads(out.read_text(encoding="utf-8"))[0]["name"], "one-change")

    def test_reads_translations_keyed_by_locale_and_change_name(self) -> None:
        directory = Path(self.changes).parent / "i18n" / "roadmap"
        write(directory / "fr-FR.json", json.dumps({"one-change": {"title": "Un changement", "why": "Un changement existe."}}))
        write(directory / "de-DE.json", json.dumps({"one-change": {"title": "Eine Änderung", "why": "Eine Änderung existiert."}}))

        translated = roadmap.translations(directory)

        self.assertEqual(sorted(translated), ["de-DE", "fr-FR"])
        self.assertEqual(translated["fr-FR"]["one-change"]["title"], "Un changement")

    def test_treats_a_missing_translation_directory_as_empty(self) -> None:
        self.assertEqual(roadmap.translations(Path(self.changes).parent / "absent"), {})

    def test_fails_on_a_malformed_translation_file(self) -> None:
        directory = Path(self.changes).parent / "i18n" / "roadmap"
        write(directory / "fr-FR.json", "{ not json")

        with self.assertRaises(SystemExit) as caught:
            roadmap.translations(directory)

        self.assertIn("invalid JSON", str(caught.exception))

    def test_fails_on_a_translation_without_a_why(self) -> None:
        directory = Path(self.changes).parent / "i18n" / "roadmap"
        write(directory / "fr-FR.json", json.dumps({"one-change": {"title": "Un changement"}}))

        with self.assertRaises(SystemExit) as caught:
            roadmap.translations(directory)

        self.assertIn("missing a why", str(caught.exception))


if __name__ == "__main__":
    unittest.main()
