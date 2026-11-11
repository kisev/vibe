# Tasks

## 1. String coverage

- [ ] 1.1 Extract the remaining hardcoded English from Home, Features, Footer, Nav, dialogs, and page-local constants into `i18n/website/en-US.json`; verify the English rendering is unchanged
- [ ] 1.2 Add a coverage guard (test or lint rule) that fails on hardcoded visible literals in page components; verify it catches a planted literal
- [ ] 1.3 Translate the new keys through the normal flow and run the audit; verify `task i18n:audit` passes and every website locale resolves every key (or falls back)

## 2. Selector

- [ ] 2.1 Render the existing `LanguageSelector` in the mobile menu with the same locales and active state as the desktop nav; verify at a small breakpoint
- [ ] 2.2 Verify the locale list equals `supportedWebsiteLocales` and matches the changelog translation set; verify with a test comparing the two sources

## 3. Persistence and URL

- [ ] 3.1 Read `?lang=` on layout mount, adopt a supported value over the stored choice, and write the parameter on change with `replaceState` while preserving other params and the hash; verify share → open → same locale, and reload without the parameter keeps the stored choice
- [ ] 3.2 Confirm in-site navigation keeps the parameter and the locale; verify across all routes

## 4. Document attributes

- [ ] 4.1 Set `<html lang>` alongside the existing `dir` on every page and re-run on locale change; verify an RTL locale applies direction site-wide
- [ ] 4.2 Add a component test rendering an RTL locale and asserting direction and the document language attribute

## 5. Validation

- [ ] 5.1 Render every page in a non-English locale and verify no hardcoded English remains
- [ ] 5.2 Verify the docs/changelog whole-page fallback and the chrome per-key fallback on a locale with partial coverage
- [ ] 5.3 Verify the deployed GitHub Pages site keeps the selector on mobile and that a shared `?lang=` link opens in that language
- [ ] 5.4 Live acceptance: browse every page in a non-English locale on desktop and mobile and report any string that stayed English or reads wrong; adjust before archiving
