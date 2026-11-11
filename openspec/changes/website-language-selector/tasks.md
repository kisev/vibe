# Tasks

## 1. String coverage

- [x] 1.1 Extract the remaining hardcoded English from Home, Features, Footer, Nav, dialogs, and page-local constants into `i18n/website/en-US.json`; verify the English rendering is unchanged — Done: Home's app mock, Docs eyebrow, Cta "Beta" and Nav's dev label now resolve through messages; every added key keeps the original English text byte-for-byte.
- [x] 1.2 Add a coverage guard (test or lint rule) that fails on hardcoded visible literals in page components; verify it catches a planted literal — Done: `src/lib/i18n.test.ts` parses `pages/*.tsx` and `components/*.tsx` with the TypeScript AST (JSX text, visible attributes, visible object properties) and fails on prose outside the brand/identifier allowlist; a planted `<h1>Buy now</h1>` in `Home.tsx` was reported at `pages/Home.tsx:222` and then reverted.
- [x] 1.3 Translate the new keys through the normal flow and run the audit; verify `task i18n:audit` passes and every website locale resolves every key (or falls back) — 2026-11-11: 26 keys (including the two changelog-alias strings) translated into all 14 non-English website locales by parallel agents; parity check shows 103/103 keys in every locale, `task i18n:audit` passes

## 2. Selector

- [x] 2.1 Render the existing `LanguageSelector` in the mobile menu with the same locales and active state as the desktop nav; verify at a small breakpoint — Done: there is no mobile menu, so `Nav` renders two placements of the same component — a compact `sm:hidden` instance in the small-screen header and the full one from `sm:` up; the component test asserts both placements are present and share one locale list. Visual check at a small breakpoint still covered by 5.3.
- [x] 2.2 Verify the locale list equals `supportedWebsiteLocales` and matches the changelog translation set; verify with a test comparing the two sources — Done: tests assert `supportedWebsiteLocales` equals Paraglide's `locales`, equals the changelog locale directories plus `en-US`, and that the open selector renders each code in that order.

## 3. Persistence and URL

- [x] 3.1 Read `?lang=` on layout mount, adopt a supported value over the stored choice, and write the parameter on change with `replaceState` while preserving other params and the hash; verify share → open → same locale, and reload without the parameter keeps the stored choice — Done: `Layout` adopts `?lang=` in its initializer (before the first paint) and re-adopts on navigation; tests cover URL over stored choice, stored choice without the parameter, `replaceState` keeping `foo`/hash and history length, and the parameter written on change.
- [x] 3.2 Confirm in-site navigation keeps the parameter and the locale; verify across all routes — Done: `Layout` re-writes `lang` on every router location change; test clicks the Features link and asserts `/vibe/features` still carries `?lang=fr-FR` with the locale unchanged.

## 4. Document attributes

- [x] 4.1 Set `<html lang>` alongside the existing `dir` on every page and re-run on locale change; verify an RTL locale applies direction site-wide — Done: one `Layout` effect sets `lang`, `dir` on `<html>` and `dir` on `<body>` from the active locale; tests assert `he-IL` gives `lang="he-IL"` with `rtl` on both elements and `ru-RU` gives `ltr`.
- [x] 4.2 Add a component test rendering an RTL locale and asserting direction and the document language attribute — Done: `src/lib/i18n.test.ts` renders `Layout` inside a `BrowserRouter` at `?lang=he-IL` and asserts `document.documentElement.lang`, `dir` and `document.body.dir`.

## 5. Validation

- [ ] 5.1 Render every page in a non-English locale and verify no hardcoded English remains
- [ ] 5.2 Verify the docs/changelog whole-page fallback and the chrome per-key fallback on a locale with partial coverage
- [ ] 5.3 Verify the deployed GitHub Pages site keeps the selector on mobile and that a shared `?lang=` link opens in that language
- [ ] 5.4 Live acceptance: browse every page in a non-English locale on desktop and mobile and report any string that stayed English or reads wrong; adjust before archiving
