#!/usr/bin/env -S uv run
"""Write the site's roadmap from the repository's unarchived OpenSpec changes.

Each `openspec/changes/<name>/proposal.md` contributes one entry: the change
name, a title, and the first sentence of its `## Why` section with Markdown
removed. `archive/` is skipped — those changes shipped. The website build runs
this before `pnpm build`, the same way `dev_manifest.py` writes the dev updater
manifest.

A change without a proposal, or a proposal without readable `## Why` text, is a
mistake in the tree: the script exits non-zero and names the file rather than
publishing a partial roadmap.

`i18n/roadmap/<locale>.json` carries the same entries translated, keyed by change
name (the identity is never translated). The generator reads them so a malformed
translation file fails the build instead of disappearing silently; the site loads
the same files itself and falls back to English per entry when one is missing.

    uv run scripts/roadmap.py
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import NoReturn

ROOT = Path(__file__).resolve().parent.parent
CHANGES = ROOT / "openspec/changes"
I18N = ROOT / "i18n/roadmap"
OUT = ROOT / "website/public/roadmap.json"

H1 = re.compile(r"^#\s+(.+?)\s*$", re.MULTILINE)
WHY_HEADING = re.compile(r"^##\s+Why\s*$", re.MULTILINE)
NEXT_HEADING = re.compile(r"^##\s+\S", re.MULTILINE)
SENTENCE_END = re.compile(r"[.!?](?=\s|$)")
# Inline HTML a proposal may use. Angle-bracket placeholders such as `<locale>`
# are content, so a blanket `<[^>]+>` would eat the words the roadmap needs.
HTML_TAG = re.compile(
    r"</?(?:a|abbr|b|blockquote|br|code|del|details|div|em|i|img|ins|kbd|li|ol|p|pre|s|span|strong|sub|summary|sup|table|tbody|td|th|thead|tr|u|ul)\b[^>]*>",
    re.IGNORECASE,
)
# Sentence-ending periods that belong to an abbreviation, not to the sentence.
ABBREVIATIONS = ("e.g.", "i.e.", "etc.", "vs.", "cf.", "approx.", "no.")


def fail(path: Path, reason: str) -> NoReturn:
    raise SystemExit(f"roadmap: {path}: {reason}")


def plain(text: str) -> str:
    """Strip the Markdown a proposal uses inline, keeping the words."""
    text = re.sub(r"!\[([^\]]*)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"`([^`]*)`", r"\1", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
    text = re.sub(r"__([^_]+)__", r"\1", text)
    text = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"\1", text)
    text = HTML_TAG.sub("", text)
    text = re.sub(r"^\s*[-*+]\s+", "", text, flags=re.MULTILINE)
    return re.sub(r"\s+", " ", text).strip()


def first_sentence(text: str) -> str:
    """The first sentence of already-plain text, abbreviation periods skipped."""
    for match in SENTENCE_END.finditer(text):
        end = match.end()
        if end == len(text):
            break
        if any(text[:end].lower().endswith(abbreviation) for abbreviation in ABBREVIATIONS):
            continue
        return text[:end].strip()
    return text.strip()


def why_section(raw: str, path: Path) -> str:
    heading = WHY_HEADING.search(raw)
    if not heading:
        fail(path, "missing a `## Why` section")
    body = raw[heading.end() :]
    following = NEXT_HEADING.search(body)
    if following:
        body = body[: following.start()]
    body = body.strip()
    if not body:
        fail(path, "the `## Why` section is empty")
    return body


def title_for(name: str, raw: str) -> str:
    """The proposal's own H1 when it has a real title, otherwise the prettified name."""
    heading = H1.search(raw)
    if heading:
        title = plain(heading.group(1))
        if title and title.lower() != "proposal":
            return title
    words = name.replace("-", " ").replace("_", " ").split()
    if not words:
        raise SystemExit("roadmap: a change directory has an empty name")
    return " ".join(words).capitalize()


def collect(changes: Path = CHANGES) -> list[dict[str, str]]:
    if not changes.is_dir():
        raise SystemExit(f"roadmap: {changes}: changes directory not found")

    entries: list[dict[str, str]] = []
    for directory in sorted(changes.iterdir(), key=lambda path: path.name):
        if not directory.is_dir() or directory.name.startswith(".") or directory.name == "archive":
            continue
        proposal = directory / "proposal.md"
        if not proposal.is_file():
            raise SystemExit(f"roadmap: {proposal}: missing proposal.md")
        raw = proposal.read_text(encoding="utf-8")
        why = first_sentence(plain(why_section(raw, proposal)))
        if not why:
            fail(proposal, "the `## Why` section has no readable sentence")
        entries.append({"name": directory.name, "title": title_for(directory.name, raw), "why": why})
    return entries


def translations(directory: Path = I18N) -> dict[str, dict[str, dict[str, str]]]:
    """The translated entries, keyed by locale and then by the untranslated change name."""
    if not directory.is_dir():
        return {}

    result: dict[str, dict[str, dict[str, str]]] = {}
    for path in sorted(directory.glob("*.json")):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as error:
            fail(path, f"invalid JSON: {error}")
        if not isinstance(data, dict):
            fail(path, "must be a JSON object keyed by change name")
        for name, entry in data.items():
            if not isinstance(entry, dict):
                fail(path, f"{name}: must be an object with a title and a why")
            for field in ("title", "why"):
                value = entry.get(field)
                if not isinstance(value, str) or not value.strip():
                    fail(path, f"{name}: missing a {field}")
        result[path.stem] = data
    return result


def render(entries: list[dict[str, str]]) -> str:
    return json.dumps(entries, indent=2, ensure_ascii=False) + "\n"


def write(entries: list[dict[str, str]], out: Path = OUT) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(render(entries), encoding="utf-8")


def main() -> None:
    entries = collect()
    translated = translations()
    known = {entry["name"] for entry in entries}
    for locale, items in translated.items():
        # A translation for an archived change is harmless, but the site would never
        # show it; naming it keeps stale translation files from piling up unnoticed.
        unknown = sorted(set(items) - known)
        if unknown:
            print(f"roadmap: {locale}: ignoring translations for changes not on the roadmap: {', '.join(unknown)}")
    write(entries)
    covered = sum(len(set(items) & known) for items in translated.values())
    print(f"roadmap: {len(entries)} changes -> {OUT.relative_to(ROOT)} ({covered} translated entries in {len(translated)} locales)")


if __name__ == "__main__":
    main()
