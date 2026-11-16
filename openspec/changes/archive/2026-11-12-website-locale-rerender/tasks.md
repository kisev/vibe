# Tasks

## 1. Re-render on locale change

- [x] 1.1 Key the routed outlet by the active locale in `Layout.tsx` so a switch remounts the page subtree instead of leaving the previous render in place — Evidence: `Layout.tsx` renders `<Outlet key={locale} />`; with the key removed the new regression test received `Features` after switching to `fr-FR` instead of `Caractéristiques`.
- [x] 1.2 Confirm pages that hold locale-dependent data (changelog release list, docs pages) re-initialize for the new locale on remount rather than serving the old locale's content — Evidence: `Changelog` initializes `list` from `getLocale()` and loads `loadReleases(getLocale())` on mount, and `Docs` reloads `loadDocs(locale)`; the remount re-runs both, proven by the changelog test waiting for the French `1.0.0` title.

## 2. Regression test

- [x] 2.1 Add a vitest component test that renders a page under the layout, switches the language through the selector, and asserts the page body (not only the header) changes to the target locale — Evidence: `src/lib/i18n.test.ts` renders `Features` and asserts the `<h1>` goes from `Features` to `Caractéristiques`; a second test renders `Changelog` and asserts the heading and the French release entry after the switch.

## 3. Validation

- [x] 3.1 `cd website && ./node_modules/.bin/tsc --noEmit` passes — Evidence: exit code 0.
- [x] 3.2 `cd website && pnpm exec vitest run` passes — Evidence: 2 files, 24 tests passed (2026-11-12).
- [x] 3.3 `uv run scripts/check_i18n.py` passes — Evidence: exit code 0, "i18n audit passed with fallback warnings" (pre-existing missing-key fallbacks only).
