#!/usr/bin/env bash
# The version proves the build env reached the crate; the commit is printed by
# `serve` at startup, so check it is embedded instead of starting a server.
# Requires TRIPLE, EXE (empty or ".exe") and GITHUB_SHA.
set -euo pipefail

triple="${TRIPLE:?TRIPLE is required}"
exe="${EXE:-}"
sha="${GITHUB_SHA:?GITHUB_SHA is required}"

binary="desktop/src-tauri/binaries/vibe-server-$triple$exe"
"$binary" --version
grep -aq "$sha" "$binary"
