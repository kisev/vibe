#!/usr/bin/env bash
# Build the site the way the deploy workflow does: link the download buttons at
# the current release, point the dev channel at the newest complete dev build,
# publish the roadmap, copy the repository docs in, and run the Vite build.
#
#     scripts/website_build.sh [prod|dev]
#
# prod (the default) builds the release site into website/dist at /vibe/ with
# path routing. dev builds the preview into website/dist-dev at /vibe/dev/ with
# hash routing, so every dev route stays inside its own base: GitHub Pages has
# one root 404.html, which path routes under a subdirectory cannot use.
set -euo pipefail

VARIANT="${1:-prod}"
case "$VARIANT" in
prod | dev) ;;
*)
    echo "unknown variant: $VARIANT (expected prod or dev)" >&2
    exit 2
    ;;
esac

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/website"

pnpm install --frozen-lockfile
# Rewrites the download links to point at the current release. Needs GH_TOKEN in
# CI; unauthenticated it falls back to the public API.
uv run ../scripts/website_links.py
# Points updater/dev.json at the newest complete dev build. Keeps the previous
# file when that release is partial or the API fails.
uv run ../scripts/dev_manifest.py
# Publishes the unarchived OpenSpec changes as the site's roadmap. A malformed
# proposal fails the build instead of shipping a partial list.
uv run ../scripts/roadmap.py
# The docs are served from the site, so they are copied in rather than linked.
# Removed first so a deleted page does not survive in dist.
rm -rf public/docs
cp -R ../docs public/docs

if [ "$VARIANT" = "dev" ]; then
    export VITE_SITE_BASE=/vibe/dev/
    export VITE_SITE_ROUTER=hash
    pnpm build:dev
else
    pnpm build
fi
