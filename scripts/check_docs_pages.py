#!/usr/bin/env -S uv run
"""Fail when the site's docs page list and the audit's expected list diverge.

The site (`website/src/lib/docs.ts`) and `scripts/content_i18n.py` each name the
18 Diátaxis pages. Two copies drift silently: the audit can pass against a page
set the site no longer renders. This check parses both and compares them.

    uv run scripts/check_docs_pages.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS_TS = ROOT / "website/src/lib/docs.ts"

sys.path.insert(0, str(ROOT / "scripts"))
from content_i18n import DOC_RELATIVE  # noqa: E402

ENTRY = re.compile(r"\{\s*category:\s*'([^']+)',\s*slug:\s*'([^']+)'\s*\}")


def main() -> int:
    text = DOCS_TS.read_text()
    start = text.index("export const pageOrder")
    end = text.index("] as const", start)
    site = {f"{category}/{slug}.md" for category, slug in ENTRY.findall(text[start:end])}

    expected = set(DOC_RELATIVE)
    missing = sorted(expected - site)
    extra = sorted(site - expected)
    if missing or extra:
        if missing:
            print("check_docs_pages: the site does not list:", *missing, sep="\n  ")
        if extra:
            print("check_docs_pages: the audit does not expect:", *extra, sep="\n  ")
        return 1
    print(f"docs pages: {len(site)} pages, site and audit agree")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
