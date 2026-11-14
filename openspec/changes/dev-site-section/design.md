# Design

## Context

The site is a single-page React app built with Vite (`base: '/vibe/'`) and a `BrowserRouter` with `basename: '/vibe'`. GitHub Pages serves exactly one custom `404.html` per site, at its root; any unknown path under a subdirectory falls back to that root file. That is why path routing cannot be moved under `/vibe/dev/` without the dev URLs rendering the production app.

## Decisions

- **The dev build uses `HashRouter`.** Every dev route becomes `/vibe/dev/#/<route>`, which the server never sees, so the single root `404.html` stops mattering. The production build keeps `BrowserRouter` and its existing fallback.
- **The router is chosen by build-time env.** `VITE_SITE_ROUTER=hash` selects `HashRouter`; the base comes from `VITE_SITE_BASE`. Both are build inputs, not runtime settings, so the production artifact cannot drift.
- **One deploy, two refs.** The workflow checks out `main`, builds production, checks out `dev`, builds dev into `dev/` inside the production artifact, then deploys once. `concurrency: pages` already serialises deploys, so the pair is never split.
- **The dev build says so.** A small banner marks the preview and links to the production site, so a shared dev link cannot be mistaken for a release.

## Risks / Trade-offs

- Dev pages are only reachable through hash URLs; anything that hard-codes a path link inside the dev build would break. All in-app links go through the router, so the risk is confined to hand-written `href`s, and the docs link guard covers those.
- The deploy now builds two refs (~two builds per deploy); it runs only when the site changes, which is rare compared with app work.
