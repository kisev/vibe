#!/usr/bin/env bash
# Drive a running Vibe from the probe that stands in for a phone:
#
#     scripts/phone_probe.sh <pairing-url> <file>      # send an audio file
#     scripts/phone_probe.sh --capabilities <pairing-url>
#
# Relative file paths are resolved against the repository root: the probe runs
# with handoff/probe as its cwd.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/handoff/probe"

if [ "${1:-}" = "--capabilities" ]; then
    url="${2:?usage: phone_probe.sh --capabilities <pairing-url>}"
    exec cargo run --quiet -- --pair --url "$url" --capabilities
fi

url="${1:?usage: phone_probe.sh <pairing-url> <file>}"
file="${2:?usage: phone_probe.sh <pairing-url> <file>}"
case "$file" in
/*) ;;
*) file="../../$file" ;;
esac
exec cargo run --quiet -- --pair --url "$url" --file "$file"
