# Design

## Context

The website bundles `i18n/changelog/*.md`; the `unreleased` entry always sorts first and is labeled as the dev line (`website/src/pages/Changelog.tsx`). Routes are `/changelog` and `/changelog/:version` under the `/vibe` basename. Dev release bodies embed the unreleased content and the app builds links through `changelogURL(version)` in `desktop/src/lib/config.ts`. Unknown versions currently render a "unknown version" state (`changelogUnknownVersion`). See `proposal.md`.

## Goals / Non-Goals

**Goals:**

- One permanent URL for the dev line that no release cleanup can break.
- Dev builds and release notes always link to it.
- Stable links untouched.

**Non-Goals:**

- Keeping old dev changelogs (they are intentionally cleaned).
- Versioned dev pages (a dev page per build is exactly what disappears).
- A changelog API or server redirects; this is an SPA route.

## Decisions

- **The alias renders the unreleased entry.** `/changelog/dev` selects the `unreleased` release object already loaded by the page, so no new data source or fetch is needed and the dev entry cannot 404.

- **Versioned dev URLs rewrite to the alias.** A route param that looks like a dev version (`x.y.z-dev.<n>...`) or `dev` renders the alias and canonicalizes the address bar with `history.replaceState` to `/changelog/dev`, so copying the URL gives the stable one. Detection is by the `-dev.` marker and the literal `dev`, not by looking up the version, because the version is exactly the thing that may be gone.

- **Empty dev entry falls back to the newest release.** If the unreleased entry has no bullets (a fresh start after a release), the alias renders the newest released entry with a notice. No error state for a URL that is meant to be permanent.

- **One mapping in the app.** `changelogURL(version)` maps a dev version (contains `-dev.`), `dev`, or `unreleased` to `/changelog/dev`; stable versions keep the versioned path. Dev build release bodies add the alias link at the top.

- **No redirect infrastructure.** The SPA owns the route; GitHub Pages serves `index.html` for unknown paths already. No 404-page tricks.

## Risks / Trade-offs

- [The dev entry is cleaned at release time, so the alias briefly shows a fresh empty entry] → The fallback notice in the empty case, and the release flow keeps the new unreleased entry populated by the same change that cuts the release.
- [Someone bookmarks a specific dev entry] → The canonicalization redirects them to the alias, which is the only dev page that exists.
- [dev-version detection misclassifies a stable version] → Detection requires the `-dev.` prerelease marker, which stable versions never carry.

## Migration Plan

1. Add the alias route and dev-version rewrite; stable behavior unchanged.
1. Point `changelogURL` and dev release bodies at the alias.
1. Old dev links work immediately through the rewrite.

## Open Questions

- Whether the alias should also expose a "previous dev entries" list fed by release bodies if dev notes are ever archived outside the repo.
