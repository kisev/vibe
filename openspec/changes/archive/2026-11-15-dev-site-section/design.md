# Design

## Context

The site is a single-page React app built with Vite (`base: '/vibe/'`) and a `BrowserRouter` with `basename: '/vibe'`. GitHub Pages serves exactly one custom `404.html` per site, at its root; any unknown path under a subdirectory falls back to that root file. That is why path routing cannot be moved under `/vibe/dev/` without the dev URLs rendering the production app.

## Decisions

- **The dev build uses `HashRouter`.** Every dev route becomes `/vibe/dev/#/<route>`, which the server never sees, so the single root `404.html` stops mattering. The production build keeps `BrowserRouter` and its existing fallback.
- **The router is chosen by build-time env.** `VITE_SITE_ROUTER=hash` selects `HashRouter`; the base comes from `VITE_SITE_BASE`. Both are build inputs, not runtime settings, so the production artifact cannot drift.
- **The router owns the hash in the dev build.** The docs page addresses a page as `/docs#<slug>` and the changelog rewrites a swept dev version to `/vibe/changelog/dev`; both use the address bar directly, which `HashRouter` already owns. In the dev build the doc slug becomes a route (`#/docs/<slug>`), the dev changelog alias is a router replacement, and documentation cross-links written as `/vibe/docs#<slug>` are rewritten to `#/docs/<slug>` when rendered. The production build keeps the path form and its `#slug` anchors unchanged.
- **One deploy, two refs.** The workflow checks out `main`, builds production, checks out `dev`, builds dev into `dev/` inside the production artifact, then deploys once. `concurrency: pages` already serialises deploys, so the pair is never split.
- **Deploys start from `main`.** A push to `dev` cannot publish: GitHub admits the `github-pages` environment on `main` and skips the deploy job of a run on another ref, while the run reads success. The workflow therefore triggers on a `main` push that touches site inputs and on dispatch, and a `guard` job fails a run on any other ref instead of reporting a deploy that never happened. The dev preview is built from the `dev` tree inside each such deploy, so it follows `dev` at the next deploy from `main`.
- **The dev build says so.** A small banner marks the preview and links to the production site, so a shared dev link cannot be mistaken for a release.

## Risks / Trade-offs

- Dev pages are only reachable through hash URLs. Every in-app link goes through the router, and the two places that address the bar directly (the docs page's own anchor, the changelog's dev alias) plus the documentation's absolute `/vibe/docs#<slug>` links are resolved for the hash build; a new hand-written path or anchor inside the dev build would still escape the base.
- The deploy now builds two refs (~two builds per deploy); it runs only when the site changes, which is rare compared with app work.
- Because a `dev` push deploys nothing, a site change on `dev` reaches `/vibe/dev/` only with the next deploy from `main` or a manual dispatch.
