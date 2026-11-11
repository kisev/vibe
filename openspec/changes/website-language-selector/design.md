# Design

## Context

The website runs Paraglide with `i18n/website/<locale>.json` catalogs and the strategies `localStorage → preferredLanguage → baseLocale`; `Layout.tsx` already sets `dir`, renders the selector through `Nav`, and Docs/Changelog fetch per-locale content with a whole-page English fallback. `supportedWebsiteLocales` comes from `i18n/locales.json` (15 locales, matching the changelog translation set). The router is `BrowserRouter` under the `/vibe` basename with routes `index`, `features`, `docs`, `changelog`, `changelog/:version`. See `proposal.md` and `specs/website-i18n/spec.md`.

## Goals / Non-Goals

**Goals:**

- Language choice that survives navigation, reloads, and link sharing.
- A selector that behaves the same in the desktop and mobile headers.
- No half-translated content pages.

**Non-Goals:**

- Path-prefixed locale routes (`/vibe/ru/...`); they would break existing links and need Pages rewrite work.
- Automatic translation of user-generated or external content.
- New locales beyond the changelog set.

## Decisions

- **Keep Paraglide's strategies, add the URL parameter as an explicit layer.** On layout mount, `?lang=<locale>` wins when it names a supported locale; otherwise the stored choice applies. On change, `setLocale(locale, { reload: false })` updates the runtime and history (`replaceState`) writes `lang` into the current URL, preserving other search params and the hash. `localStorage` remains the persistence layer, so a return visit without the parameter keeps the choice. Alternative — path prefixes — would require a router basename per locale and redirect rules on GitHub Pages for a marginal SEO gain this change does not need.

- **The selector is the existing component, rendered in both headers.** `LanguageSelector` already lists native names via `Intl.DisplayNames` and marks the active locale; it is placed in the desktop nav today and is added to the mobile menu, using the same props and messages. No second component.

- **Document attributes are set once in `Layout`.** `lang` joins the existing `dir` effect, both derived from the active locale; the effect re-runs on locale change, so RTL applies to the whole site, not just the docs body.

- **Extraction is mechanical and testable.** Hardcoded English in `Home`, `Features`, `Footer`, `Nav`, dialogs, and any page-local constants moves to `i18n/website/en-US.json` with keys grouped by page. A lint-style check (a test that fails on suspicious literals in page files, or a review checklist) guards regressions; the translation pipeline stamps and audits the result.

- **Fallback stays per content surface.** Docs and changelog already fall back whole-entry to English and keep doing so. UI chrome uses Paraglide's base-locale fallback per key, which is the expected behavior for mixed-coverage locales and never interleaves languages inside one content entry.

- **SEO without routing.** `lang` on `<html>` is set from the active locale; no `hreflang` links are added because the URL space is not per-locale. This is a deliberate trade-off, documented in the change.

## Risks / Trade-offs

- [A locale in the URL and a locale in storage disagree] → URL wins on load; the stored value is updated from it so the next visit agrees.
- [Query-parameter links differ by language but look shareable] → The parameter is stable and readable; canonical links without it are fine for search engines.
- [Mobile menu placement drifts from desktop] → Both use the same component and the same locale list from one source.
- [Extraction misses strings in JSX attributes or constants] → A coverage test greps page files for suspicious literals and a review step checks rendered pages in a non-English locale.
- \[RTL regressions on pages that never used `dir`\] → The layout-level attribute applies globally; component tests render one RTL locale and assert direction and text alignment.

## Migration Plan

1. Extract strings; keep English identical so the default rendering is unchanged.
1. Add URL locale handling and the mobile selector.
1. Translate the new keys through the normal flow; publish the site.
1. Rollback: the URL parameter is ignored if the code is reverted; stored locale remains harmless.

## Open Questions

- Whether the coverage guard should be a test or a lint rule once the extraction is done.
- Whether the download page should deep-link the chosen locale into the app.
