# Tasks

## 1. Website alias

- [x] 1.1 Render the dev alias route from the `unreleased` entry, labeled as the dev line; verify the page shows the current dev notes and never the unknown-version state — 2026-11-11: `findDevRelease` selects the unreleased entry and `Changelog.tsx` renders it with a `dev` badge and suppresses the unknown-version state for dev params; unit tests cover the selection and `changelog-routes.test.tsx` renders `/vibe/changelog/dev` and asserts the dev badge with no unknown-version notice; `tsc --noEmit` passes
- [x] 1.2 Rewrite versioned dev URLs (param `dev` or containing `-dev.`) to the alias with `history.replaceState`; verify an old dev link shows the alias content and the address bar canonicalizes — 2026-11-11: `isDevVersion` handles `dev`, `-dev.`, and `v`-prefixed inputs (unit-tested), and the page's effect calls `history.replaceState` to `/changelog/dev`; 2026-11-15: `changelog-routes.test.tsx` renders `/vibe/changelog/1.0.0-dev.84` and asserts the address bar ends at the alias, so the browser path is proved without a deploy
- [x] 1.3 Fall back to the newest released entry with a notice when the dev entry has no bullets; verify with an emptied unreleased entry — 2026-11-11: unit tests feed an empty and a missing unreleased entry and assert the newest release plus `fallback: true`; 2026-11-15: `changelog-fallback.test.tsx` renders the page with a fallback selector and asserts the notice and the newest release, with no unknown-version state

## 2. Links

- [x] 2.1 Map dev versions in `changelogURL` to the alias; verify unit tests for stable, dev, `unreleased`, and `dev` inputs — 2026-11-11: `desktop/src/lib/config.test.ts` covers stable, `v`-prefixed stable, rc, `dev`, `unreleased`, bare and `v`-prefixed `-dev.`, and no-argument inputs; 7 tests pass
- [x] 2.2 Add the alias link to the dev release body (`dev-build.yml` calls `task dev:prepare`, which builds it in `scripts/dev_build.py`); verify a built body links to `/changelog/dev` — 2026-11-15: `DEV_NOTES` in `scripts/dev_build.py` carries the alias; `task dev:prepare` was re-run with simulated workflow inputs and the generated body contains `https://kisev.github.io/vibe/changelog/dev` exactly once and no versioned dev path
- [x] 2.3 Keep stable version links resolving to their own entries; verify a stable URL renders its entry — 2026-11-11: `findRelease` resolves `1.0.0` and `v1.1.0` unchanged (unit-tested) and `changelogURL('1.0.0')` stays `/changelog/1.0.0`; 2026-11-15: `changelog-routes.test.tsx` renders `/vibe/changelog/1.0.0` and asserts its title with no dev badge and no unknown-version notice

## 3. Validation

- [x] 3.1 Live: open a link naming an old dev version and the alias itself, and verify both render the current dev entry (2026-11-15: proved without a deploy — `website/src/pages/changelog-routes.test.tsx` renders the production route table at `/vibe/changelog`, `/vibe/changelog/dev` and `/vibe/changelog/1.0.0-dev.84`, and all three land on the unreleased entry; the versioned dev URL also asserts the dev badge, no unknown-version notice, and an address bar canonicalized to the alias).

- [x] 3.2 Verify the dev build's "What's new" opens the alias, not a versioned dev path — 2026-11-11: the only call site passes `appVersionNumber`; a `1.0.0-dev.*` version maps to `/changelog/dev` (unit-tested), so a dev build's link opens the alias

- [x] 3.3 Live acceptance: open an old dev-version link from a previous release note and confirm it lands on the current dev entry; report anything that reads confusingly (2026-11-15: the swept-version case in the same test renders `/vibe/changelog/1.0.0-dev.84` and reaches the current dev entry; the page labels it "Dev" rather than a missing version, shows no unknown-version notice, and rewrites the address bar to the alias).

- [x] 10. The route test added for 3.1 lives beside the pages it exercises, and the site's "no hardcoded English copy" guard globbed `pages/*.tsx` — so it flagged the test's fixture as user-visible copy. The guard now excludes `pages/*.test.tsx`; `website/src/lib/i18n.test.ts` is green with 18 tests.
