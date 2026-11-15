# Design

## Context

Two website surfaces render content that is English by construction: the dev
changelog reads `i18n/changelog/unreleased.md` (which had no locale files) and
the roadmap renders `website/public/roadmap.json`, generated from English
`openspec/changes/*/proposal.md`. The site's locale switch re-renders the page,
but these two surfaces kept their English payload. See `proposal.md` for the
motivation and the delta specs for the requirements.

The site is a Vite SPA. Markdown content is bundled in two ways: English is
eagerly imported, a locale's translation is a lazy import fetched when that
locale asks for it. `scripts/roadmap.py` runs before `pnpm build`.

## Goals / Non-Goals

**Goals:**

- Both surfaces show the chosen language wherever a translation exists.
- A missing translation degrades to English per entry, never to an empty card,
  and is reported by `task i18n:audit`.
- A new proposal reaches the roadmap without a hand edit.

**Non-Goals:**

- Translating the content itself (that stays with the `/translate` flow).
- Changing how the docs and release-note translations are loaded or bundled.
- A mobile navigation menu; the site has no narrow-width header menu, so the
  footer navigation is the mobile entry point.

## Decisions

- **Roadmap translations are keyed by change name and bundled, not fetched.**
  `i18n/roadmap/<locale>.json` is a JSON object keyed by change name, imported
  with `import.meta.glob`. The change name is the identity and is never
  translated; a locale's file only carries `title` and `why`. Bundling is
  cheap (14 locales x ~20 entries) and keeps a locale switch synchronous, while
  the roadmap itself stays one `roadmap.json` fetch. Alternative — one file per
  locale fetched on demand — would add a second request to every switch for a
  payload measured in kilobytes.
- **Fallback is per entry, not per file.** `localizeRoadmap` maps the English
  entries and swaps in a translated card only when the locale names that change.
  Whole-file fallback (the pattern used for docs and release notes) would blank
  every card the moment one new proposal appears untranslated.
- **The generator validates translation files, the site reads them.** A
  malformed `i18n/roadmap/<locale>.json` fails `scripts/roadmap.py` at build
  time; the site additionally ignores malformed entries rather than crashing a
  page. A translation for an archived change is reported and ignored.
- **The dev entry is audited like a release.** `expected_changelog()` includes
  `unreleased` alongside the newest releases, so a locale without it is named
  by `task i18n:audit`. A missing translation is a warning, not an issue,
  because the page has a working fallback.
- **Pages wait for the locale's content instead of painting English first.**
  `Docs` starts empty and `Changelog` starts empty when `hasTranslations` is
  true; swapping a whole article a moment later reflows the page and can flip
  its direction. A height placeholder keeps the footer from jumping.
- **The locale is read reactively.** `useLocale()` combines the router's
  location with `window.location.search`; the hash build keeps `?lang=` in the
  outer URL the router never sees.
- **The deploy rebuilds when a proposal or the generator changes.**
  `website.yml` gains `openspec/changes/**` and `scripts/roadmap.py` so the
  deployed roadmap cannot lag the tree.

## Risks / Trade-offs

- [Every locale's translated cards ship in the bundle] → The payload is small
  and the roadmap data is already one fetch; lazy loading would cost a request
  per switch for less than the bundle it saves.
- [A stale translation for an archived change lingers in the locale files] →
  The generator reports the names on every run; removing the entries is
  translation cleanup, not a site bug.
- [A missing translation is only a warning, so CI stays green] → Intended: the
  fallback is correct behavior, and the warning is the signal to translate.

## Migration Plan

No data migration. The build regenerates `website/public/roadmap.json` through
`task website:build`; existing locale files keep working because a locale
without a roadmap file simply falls back. Rollback is reverting the files —
nothing consumes the new locale JSON except the site itself.
