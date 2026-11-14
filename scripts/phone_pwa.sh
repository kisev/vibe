#!/usr/bin/env bash
# Build the phone PWA into handoff/pwa/dist for the base path it will be served
# under, or start its dev server.
#
#     scripts/phone_pwa.sh [/vibe/phone/ | --dev]
#
# The base path is baked into the asset URLs at build time, so `/` (behind a
# tunnel or the local server) and `/vibe/phone/` (on the website) are different
# builds, not a runtime setting.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/handoff/pwa"

pnpm install --frozen-lockfile

if [ "${1:-}" = "--dev" ]; then
    pnpm dev
else
    PWA_BASE="${1:-/}" pnpm build
fi
