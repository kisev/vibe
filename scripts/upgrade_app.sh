#!/usr/bin/env bash
# Rebuild vibe.app, replace the installed one and relaunch it (macOS only).
# The updater artifacts are skipped: signing them needs the CI private key.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [ "$(uname -s)" != "Darwin" ]; then
    echo "app:upgrade replaces /Applications/vibe.app and is macOS only" >&2
    exit 1
fi

bash scripts/setup_sidecars.sh
pnpm --dir desktop exec tauri build --bundles app --config '{"bundle":{"createUpdaterArtifacts":false}}'

osascript -e 'quit app "vibe"' 2>/dev/null || true
rm -rf /Applications/vibe.app
cp -R target/release/bundle/macos/vibe.app /Applications/vibe.app
open /Applications/vibe.app
echo "vibe upgraded and relaunched"
