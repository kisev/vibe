# Tasks

- [x] 1. The website reads `VITE_SITE_BASE` and `VITE_SITE_ROUTER`, defaulting to `/vibe/` and browser routing so the production build is unchanged.
  Done: `website/vite.config.ts` reads `VITE_SITE_BASE` (default `/vibe/`); `website/src/lib/site.ts` selects the router and `website/src/App.tsx` renders `HashRouter` without a basename or `BrowserRouter basename="/vibe"` exactly as before.
- [x] 2. `scripts/website_build.sh` (and a `website:build:dev` task) build the dev variant with base `/vibe/dev/` and hash routing.
  Done: the script takes `prod` (default) or `dev`; `website/package.json` has `build:dev` into `dist-dev`; `taskfile.yml` exposes `website:build:dev` and `website:assemble`.
- [x] 3. `website.yml` checks out `main` and `dev`, builds both, assembles the artifact with `dev/` inside it, and deploys once; it triggers on either branch's site paths and on dispatch.
  Done: `main` is checked out at the workspace root for the production build and PWA, `dev` into `dev-src` for the preview and the assembly step; `scripts/website_assemble.sh` copies production to the artifact root, dev under `dev/`, and checks the root `404.html` is still the production one. The trigger lists `main` and `dev` with the same site paths, plus dispatch.
- [x] 4. The dev build shows a preview banner linking to the production site.
  Done: `website/src/components/DevBanner.tsx` renders only when `VITE_SITE_ROUTER=hash`, at the top of `Layout`; strings are in `i18n/website/en-US.json` (`dev-preview-banner`, `dev-preview-link`) and other locales fall back until the translation pass.
- [x] 5. Tests: the router choice follows the env; the dev build's links stay hash-based; the production build keeps path routing.
  Done: `website/src/App.test.tsx` covers the env-to-router choice, the banner in dev vs production, production hrefs under `/vibe/`, and a clicked nav link producing `#/features` at `/vibe/dev/`.
- [x] 6. Docs describe the two addresses and the deploy rule.
  Done: `docs/how-to/maintain-the-repository.md` has a "Read the development site" section with both addresses, the one-deploy-two-refs rule and the local tasks; `docs/reference/tooling.md` names the new `website:*` tasks.
