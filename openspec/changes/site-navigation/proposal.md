# Proposal

## Why

The site's navigation is split: the header holds `features`, `docs` and `changelog`, the footer holds `roadmap` and the download entry. On a phone the header hides its links entirely (`hidden … sm:flex`), so the only way to reach the roadmap — or any section — is the footer, while the roadmap specification claims the page is reachable from the header.

The maintainer wants one navigation, in the header, on every viewport. Splitting the same set of links across two areas also means two places to update whenever a section is added.

## What Changes

- Every site section (features, docs, changelog, roadmap, download) is reachable from the header, and the header keeps them reachable at phone width through a collapsed menu.
- The footer stops repeating those links; it keeps only what is not navigation (language, licence, repository, contact).
- The roadmap requirement in the `site-roadmap` capability is brought in line with where the link actually lives.

## Capabilities

- `website` (existing): the public site's structure and navigation.
- `site-roadmap` (existing): one requirement about where the roadmap is reachable from is corrected.

## Impact

- `website/src/components/Nav.tsx`, `Footer.tsx`, `Layout.tsx`, their tests, `website/src/lib/nav.ts` if the entry list moves there, and the website catalogs if labels change.
- `docs/how-to/maintain-the-repository.md` describes the site's sections and should match.

## Non-Goals

- Redesigning the pages themselves, or changing which sections exist.
- A sticky/floating header or other motion work.
