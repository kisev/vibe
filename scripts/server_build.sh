#!/usr/bin/env bash
# Build vibe-server from server/ and stage it where `setup` puts the release, for
# iterating on the engine without publishing a server release.
#
#     scripts/server_build.sh [triple]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

triple="${1:-}"
if [ -z "$triple" ]; then
    triple="$(rustc -vV | sed -n 's/^host: //p')"
fi

exe=""
case "$triple" in
*windows*) exe=".exe" ;;
esac

cargo build --manifest-path server/Cargo.toml -p vibe-server --release

bin="$ROOT/desktop/src-tauri/binaries"
mkdir -p "$bin"
cp "server/target/release/vibe-server$exe" "$bin/vibe-server-$triple$exe"
chmod 755 "$bin/vibe-server-$triple$exe"
echo "built vibe-server-$triple from server/"
