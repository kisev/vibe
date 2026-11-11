# Proposal

## Why

The website already has a Paraglide runtime, per-locale catalogs, a `LanguageSelector` in the nav, and fully translated docs and changelog — but the coverage is uneven (Home and Features still carry hardcoded English), the choice lives only in `localStorage` so a shared link always opens in the recipient's language rather than the sender's, and the selector is easy to miss on small screens. The request is a genuinely multilingual site with a selector, matching the locale set the changelog already translates.

## What Changes

- Every visible string on the site — home, features, download, privacy, nav, footer, dialogs — comes from the website message catalogs, with no hardcoded English left outside them.
- The language selector stays in the header, is present in the mobile menu as well, lists exactly the website locales (`supportedWebsiteLocales`, the same set the changelog translates), and marks the active one.
- The chosen locale persists across visits and is carried in the URL (`?lang=<locale>`) so a shared link opens in the same language; opening such a link adopts that locale, and in-site navigation preserves it.
- `<html lang>` and text direction follow the locale on every page, not only docs and changelog; RTL renders correctly across the whole site.
- Content pages keep their whole-page fallback to English when a translation is missing; chrome strings fall back per key through Paraglide. No page mixes two languages mid-entry.

## Capabilities

### New Capabilities

- `website-i18n`: full string coverage of the site, the language selector and its placements, locale persistence and URL representation, document language/direction, and translation fallback.

### Modified Capabilities

## Impact

- `website/src/pages/*`, `website/src/components/*`, `website/src/lib/i18n.ts`, `website/src/components/Layout.tsx` and `Nav.tsx`, the website message catalogs under `i18n/website/<locale>.json`.
- The translation flow (`/translate`) and `task i18n:audit` cover the new keys.
- No app or server change; no routing overhaul (query parameter, not path prefixes).
