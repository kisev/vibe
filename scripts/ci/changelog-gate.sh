#!/usr/bin/env bash
# Require release notes for the version in tauri.conf.json before a release.
set -euo pipefail

version=$(python3 -c 'import json; print(json.load(open("desktop/src-tauri/tauri.conf.json"))["version"])')
test -f "i18n/changelog/$version.md" || {
    echo "::error::i18n/changelog/$version.md is missing; write the release notes before releasing"
    exit 1
}
