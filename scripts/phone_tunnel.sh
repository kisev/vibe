#!/usr/bin/env bash
# Serve the phone PWA over an HTTPS tunnel so a real phone can load it.
#
# A phone needs a secure origin before it will hand over the microphone.
# `serve.py --tunnel` runs cloudflared alongside the server and prints the
# https://<host>.trycloudflare.com URL it hands out. Start Vibe with that URL so
# the QR code points at it:
#
#     VIBE_PWA_ORIGIN=https://<host> task dev
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

command -v cloudflared >/dev/null || {
    echo "cloudflared is not on PATH" >&2
    exit 1
}

bash scripts/phone_wasm.sh
bash scripts/phone_pwa.sh /
uv run handoff/pwa/serve.py --tunnel
