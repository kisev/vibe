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
    [ -f public/wasm/handoff_wasm.js ] ||
        echo "WARNING: public/wasm is missing; run scripts/phone_wasm.sh first" >&2
    pnpm dev
else
    # vite bakes the base path into every asset URL, and requires both slashes.
    base="${1:-/}"
    case "$base" in
    / | /*/) ;;
    *)
        echo "base must start and end with a slash (e.g. /vibe/phone/): got '$base'" >&2
        exit 1
        ;;
    esac
    # Vite copies public/ verbatim, so a build without the wasm module produces
    # a dist that 404s on the phone — fail here, not on the device.
    [ -f public/wasm/handoff_wasm.js ] || {
        echo "public/wasm/handoff_wasm.js is missing; run scripts/phone_wasm.sh first" >&2
        exit 1
    }
    PWA_BASE="$base" pnpm build
fi
