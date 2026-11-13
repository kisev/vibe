# Tasks

- [x] 1. Translate `i18n/changelog/unreleased.md` into all 14 website locales (`i18n/changelog/<locale>/unreleased.md`), then `task stamp-translations`.
- [x] 2. Teach `scripts/content_i18n.py` to audit the unreleased entry (expected in every locale) and to report an unexpected English page.
- [x] 3. Extend `scripts/roadmap.py` to emit the change list and read `i18n/roadmap/<locale>.json`; `website/src/lib/roadmap.ts` loads the locale file and falls back per entry.
- [x] 4. Translate the current roadmap entries into the 14 website locales (English fallback stays for untranslated ones).
- [x] 5. `Docs` waits for the locale's page instead of painting English first; `getLocale` is read reactively on `Docs` and `Changelog`.
- [x] 6. `website.yml` triggers on `openspec/changes/**` and `scripts/roadmap.py`; `/roadmap` is linked in the mobile navigation and the sitemap.
- [x] 7. Run the roadmap generator tests in `task verify`; add tests that switch locale on `/changelog/dev`, `/roadmap` and `/docs` and assert no English payload remains where a translation exists.
- [x] 8. `task i18n:audit`, `task website:test`, `task website:typecheck` and `task verify` green.
