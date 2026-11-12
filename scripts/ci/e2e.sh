#!/usr/bin/env bash
# Browser-mode desktop E2E. CI downloads Playwright's own Chromium; hosts where that
# download is blocked can either pre-set PLAYWRIGHT_CHROMIUM_PATH or have a system
# `chromium` on PATH, which the config picks up through the same variable.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT/desktop"

if [ -n "${PLAYWRIGHT_CHROMIUM_PATH:-}" ]; then
    echo "Using the system Chromium at $PLAYWRIGHT_CHROMIUM_PATH; skipping the browser download."
elif ! pnpm exec playwright install --with-deps chromium; then
    system_chromium="$(command -v chromium || command -v chromium-browser || true)"
    if [ -z "$system_chromium" ]; then
        echo "Playwright's Chromium could not be installed and no system Chromium was found." >&2
        exit 1
    fi
    echo "Playwright's Chromium could not be installed; falling back to $system_chromium." >&2
    export PLAYWRIGHT_CHROMIUM_PATH="$system_chromium"
fi

pnpm exec playwright test
