#!/usr/bin/env bash
# Assemble one GitHub Pages artifact from the two site builds: the production
# build at the root and the dev build under dev/.
#
#     scripts/website_assemble.sh
#
# Inputs come from the environment, so a workflow passes paths without shell
# quoting:
#
#     WEBSITE_PROD_DIR  production build (default website/dist)
#     WEBSITE_DEV_DIR   dev build (default website/dist-dev)
#     WEBSITE_SITE_DIR  assembled artifact (default website/dist-site)
#
# GitHub Pages serves exactly one root 404.html. The dev build lives below it,
# so the root fallback must remain the production one; hash routing keeps the
# dev app from ever needing it.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PROD_DIR="${WEBSITE_PROD_DIR:-website/dist}"
DEV_DIR="${WEBSITE_DEV_DIR:-website/dist-dev}"
SITE_DIR="${WEBSITE_SITE_DIR:-website/dist-site}"

for dir in "$PROD_DIR" "$DEV_DIR"; do
    if [ ! -f "$dir/index.html" ]; then
        echo "missing build: $dir/index.html" >&2
        exit 1
    fi
done
if [ ! -f "$PROD_DIR/404.html" ]; then
    echo "production build has no 404.html: $PROD_DIR/404.html" >&2
    exit 1
fi

rm -rf "$SITE_DIR"
mkdir -p "$SITE_DIR"
cp -R "$PROD_DIR/." "$SITE_DIR/"
mkdir -p "$SITE_DIR/dev"
cp -R "$DEV_DIR/." "$SITE_DIR/dev/"

if ! cmp -s "$PROD_DIR/404.html" "$SITE_DIR/404.html"; then
    echo "the assembled root 404.html is not the production one" >&2
    exit 1
fi
