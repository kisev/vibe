# Proposal

## Why

`main` is the release line again, so the production site only moves at release time — which is right for visitors and wrong for the maintainer, who needs to read the site as `dev` renders it long before a release. The site needs a dev twin on the same Pages site that always reflects `dev`.

## What Changes

- The site builds twice: production at `/vibe/` from `main`, and a dev build at `/vibe/dev/` from `dev`.
- The dev build uses hash routing (`/vibe/dev/#/roadmap`). GitHub Pages has a single root `404.html`, so path routes under a subdirectory would fall back to the production app; hashes keep every dev route inside its own base, and the production site's behaviour is unchanged.
- One deploy publishes both: the workflow checks out `main` and `dev`, builds each, and assembles an artifact holding the production site at the root and the dev site under `dev/`. Triggered by a push to either branch (website paths) and by dispatch.
- The dev site is labelled as such in its own UI, so nobody mistakes a preview for the release site.

## Capabilities

- `website` (existing): what the site builds and publishes.

## Impact

- `website/vite.config.ts`, `website/src/main.tsx` (router choice), `website/package.json`, `website/src/**` (a dev banner), `scripts/website_build.sh`, `.github/workflows/website.yml`, `taskfile.yml`, docs.
