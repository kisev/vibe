# Proposal

## Why

Switching the site language re-renders the page, but two surfaces keep their English payload: the dev changelog (`/changelog/dev`) has no `i18n/changelog/<locale>/unreleased.md`, and the roadmap cards come from `roadmap.json`, which is generated from English `proposal.md` files. A French reader sees "Feuille de route" above English cards, and a Russian reader sees English dev notes — both violate the rule that the site speaks the chosen language.

## What Changes

- The unreleased (dev) entry is translated into every website locale, and `scripts/content_i18n.py` audits it instead of excluding `unreleased`.
- The roadmap carries a per-locale translation file (`i18n/roadmap/<locale>.json`, keyed by change name) with the English `roadmap.json` as fallback; the page loads the locale's file and falls back per entry.
- `Docs` no longer paints the English page before the locale's translation resolves; the loader re-reads on locale change.
- The roadmap is reachable from the mobile navigation, appears in the sitemap, and the deploy workflow rebuilds when `openspec/changes/**` or `scripts/roadmap.py` change.
- Regression tests: a locale switch leaves no string from the previous locale on `/changelog/dev`, `/roadmap` and `/docs`.

## Capabilities

- `site-changelog`, `site-roadmap` (existing): what the two pages show.
- `site-locale` (existing): the language switch re-renders every surface.

## Impact

- `i18n/changelog/<locale>/unreleased.md`, `i18n/roadmap/<locale>.json`, `scripts/{content_i18n,check_i18n,roadmap}.py`, `website/src/{lib,pages}`, `.github/workflows/website.yml`, site strings and tests.
