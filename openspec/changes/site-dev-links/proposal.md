# Proposal

## Why

The `/vibe/dev/` preview was built to show unreleased dev work without touching the release site: one Pages artifact, two bundles, the second assembled from the `dev` branch at deploy time. It never went live. The `github-pages` environment admits `dev` now, yet GitHub still skips the deploy job of a run on a `dev` ref with zero steps and still reports the run as successful, so the only working deploy is the one from `main` — and a rebuild-based preview therefore shows dev content only when a release happens.

The maintainer's requirement is different: the site must not need a rebuild to reveal what dev holds. A link to the file on GitHub needs no build at all — it always shows the branch's current content.

## What Changes

- The `/vibe/dev/` build is removed: the second checkout, the second Vite build, the assembled artifact, the hash router, the dev banner and the dev-specific link rewriting all go. The deploy publishes one site, built from `main`, from `main`.
- The site gains a small Development area whose entries are links into the `dev` branch on GitHub: the unreleased changelog, the OpenSpec changes that make up the roadmap, the dev updater manifest, and the branch's recent commits.
- Nothing about dev is generated at build time any more, so a dev change is visible the moment it is pushed to the branch.

## Capabilities

- `website` (existing): the deploy contract and the site's structure.

## Impact

- `.github/workflows/website.yml` (single build, `main` only), `scripts/website_build.sh`, the removal of `scripts/website_assemble.sh`, `website/src/lib/site.ts` (router choice), `App.tsx`, `Docs.tsx`, `Changelog.tsx`, `DocViewer.tsx`, `PrivacyPolicy.tsx`, `DevBanner.tsx`, `website/tests/deployArtifact.test.ts`, `docs/how-to/maintain-the-repository.md`, and the synced `website` requirement "The site publishes a dev twin from dev", which this change removes.
- The dev channel still has to be discoverable: the Development area is linked from the header like any other section.

## Non-Goals

- Rendering dev content dynamically on the site (server-side fetch, client-side GitHub API calls). The site stays a static bundle; dev content is read on GitHub.
- Reintroducing a second deployment target while GitHub keeps skipping dev-ref deploys.
