# Tasks

## 1. Website alias

- [x] 1.1 Render the dev alias route from the `unreleased` entry, labeled as the dev line; verify the page shows the current dev notes and never the unknown-version state — 2026-11-11: `findDevRelease` selects the unreleased entry and `Changelog.tsx` renders it with a `dev` badge and suppresses the unknown-version state for dev params; unit tests cover the selection, `tsc --noEmit` passes
- [x] 1.2 Rewrite versioned dev URLs (param `dev` or containing `-dev.`) to the alias with `history.replaceState`; verify an old dev link shows the alias content and the address bar canonicalizes — 2026-11-11: `isDevVersion` handles `dev`, `-dev.`, and `v`-prefixed inputs (unit-tested), and the page's effect calls `history.replaceState` to `/changelog/dev`; not live-verified before deploy
- [x] 1.3 Fall back to the newest released entry with a notice when the dev entry has no bullets; verify with an emptied unreleased entry — 2026-11-11: unit tests feed an empty and a missing unreleased entry and assert the newest release plus `fallback: true`, which renders the notice

## 2. Links

- [x] 2.1 Map dev versions in `changelogURL` to the alias; verify unit tests for stable, dev, `unreleased`, and `dev` inputs — 2026-11-11: `desktop/src/lib/config.test.ts` covers stable, `v`-prefixed stable, rc, `dev`, `unreleased`, bare and `v`-prefixed `-dev.`, and no-argument inputs; 7 tests pass
- [x] 2.2 Add the alias link to the dev release body in `dev-build.yml`; verify a built body links to `/changelog/dev` — 2026-11-11: the body construction was simulated with the step's shell variables; it contains `https://kisev.github.io/vibe/changelog/dev` and no versioned dev path
- [x] 2.3 Keep stable version links resolving to their own entries; verify a stable URL renders its entry — 2026-11-11: `findRelease` resolves `1.0.0` and `v1.1.0` unchanged (unit-tested) and `changelogURL('1.0.0')` stays `/changelog/1.0.0`

## 3. Validation

- [ ] 3.1 Live: open a link naming an old dev version and the alias itself, and verify both render the current dev entry
- [x] 3.2 Verify the dev build's "What's new" opens the alias, not a versioned dev path — 2026-11-11: the only call site passes `appVersionNumber`; a `1.0.0-dev.*` version maps to `/changelog/dev` (unit-tested), so a dev build's link opens the alias
- [ ] 3.3 Live acceptance: open an old dev-version link from a previous release note and confirm it lands on the current dev entry; report anything that reads confusingly
