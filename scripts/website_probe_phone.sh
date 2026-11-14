#!/usr/bin/env bash
# Report whether the checked-out release line ships the phone handoff.
#
#     scripts/website_probe_phone.sh
#
# Writes `present=true|false` to $GITHUB_OUTPUT (and prints it). The handoff
# landed on dev after the 1.0.0 release, so a release line that predates it has
# no `phone:pwa` task: the release site then ships without /phone/ instead of
# failing the whole deploy on a missing task.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if grep -q '^  phone:pwa:' taskfile.yml && [ -f handoff/pwa/package.json ]; then
    present=true
else
    present=false
    echo "main carries no phone handoff; the release site ships without /phone/"
fi

echo "present=$present"
if [ -n "${GITHUB_OUTPUT:-}" ]; then
    echo "present=$present" >>"$GITHUB_OUTPUT"
fi
