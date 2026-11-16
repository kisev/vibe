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

# Check everything the last step needs before the wasm and PWA builds run: a
# missing tool would otherwise surface only after minutes of compiling.
for tool in cloudflared uv pnpm; do
    command -v "$tool" >/dev/null || {
        echo "$tool is not on PATH" >&2
        exit 1
    }
done

bash scripts/phone_wasm.sh
bash scripts/phone_pwa.sh /
uv run handoff/pwa/serve.py --tunnel
