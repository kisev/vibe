#!/usr/bin/env bash
# Require release notes for the version in tauri.conf.json before a release.
set -euo pipefail

# Windows images expose `python`, Unix runners `python3` (taskfile.yml's PYTHON
# makes the same choice); prefer python3 and fall back instead of dying on a
# missing interpreter.
py="$(command -v python3 || command -v python || true)"
[ -n "$py" ] || {
    echo "::error::no python interpreter found for the changelog gate" >&2
    exit 1
}
version="$("$py" -c 'import json; print(json.load(open("desktop/src-tauri/tauri.conf.json"))["version"])')"
test -f "i18n/changelog/$version.md" || {
    echo "::error::i18n/changelog/$version.md is missing; write the release notes before releasing"
    exit 1
}
