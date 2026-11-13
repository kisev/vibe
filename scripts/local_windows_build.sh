#!/usr/bin/env bash
# Build the Windows installer on the Windows host from this WSL checkout.
#
# The Windows side is where the app is used, and it already has the MSVC
# toolchain, pnpm and WebView2. Building there costs minutes; a dev tag costs a
# GitHub matrix run whose macOS cells are cancelled at random. This target
# publishes nothing: no tag, no release, no signature.
#
#     scripts/local_windows_build.sh [--verified]
#
# The checkout path comes from VIBE_WIN_CHECKOUT (default: <Windows home>\vibe-build),
# so nothing depends on a particular user name. The version is stamped
# 1.0.0-local.<YYYYMMDD>.<sha>, which the updater refuses to move off.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

verified=false
for arg in "$@"; do
    case "$arg" in
    --verified) verified=true ;;
    *)
        echo "unknown argument: $arg" >&2
        exit 1
        ;;
    esac
done

if ! command -v powershell.exe >/dev/null 2>&1 || ! command -v wslpath >/dev/null 2>&1; then
    echo "this target builds on the Windows host and must run inside WSL with Windows interop" >&2
    exit 1
fi

if [ "$verified" = true ]; then
    echo "==> task verify"
    task verify
fi

checkout_win="${VIBE_WIN_CHECKOUT:-}"
if [ -z "$checkout_win" ]; then
    # `wslpath -w "$HOME"` gives the WSL share, which is a UNC path: the Windows
    # toolchain refuses to run there (cargo and pnpm both fall back to C:\Windows).
    # The Windows profile is the honest default, and it is per-user, not hardcoded.
    # shellcheck disable=SC2016 # the expression must reach PowerShell, not bash
    profile="$(powershell.exe -NoProfile -Command '$env:USERPROFILE' | tr -d '\r')"
    checkout_win="${profile}\\vibe-build"
fi
if ! printf '%s' "$checkout_win" | grep -qiE '^[A-Za-z]:[\\/]'; then
    printf 'VIBE_WIN_CHECKOUT must be a Windows drive path (for example C:\\vibe-build); got: %s\n' "$checkout_win" >&2
    printf 'a UNC path such as \\\\wsl.localhost\\... cannot run the Windows toolchain\n' >&2
    exit 1
fi
checkout="$(wslpath -u "$checkout_win")"
echo "==> checkout: $checkout_win"

version="1.0.0-local.$(date +%Y%m%d).$(git rev-parse --short HEAD)"
echo "==> version: $version"

echo "==> sidecars for x86_64-pc-windows-msvc"
bash scripts/setup_sidecars.sh x86_64-pc-windows-msvc

echo "==> syncing the tree"
mkdir -p "$checkout"
# .git is left behind: the build reads the version from the override, and a full
# history copy is the slowest part of the sync.
rsync -a --delete \
    --exclude '.git' \
    --exclude 'node_modules' \
    --exclude 'target' \
    --exclude 'dist' \
    --exclude 'desktop/src/paraglide' \
    --exclude 'website/src/paraglide' \
    --exclude '__pycache__' \
    --exclude '.claude' \
    --exclude '.opencode' \
    "$ROOT/" "$checkout/"

# A Tauri config overlay is simpler to pass through PowerShell than a JSON string.
# Updater artifacts need the release signing key, which a local build must not use.
cat >"$checkout/desktop/local-build.json" <<JSON
{
  "version": "$version",
  "bundle": { "createUpdaterArtifacts": false }
}
JSON

# The checkout carries Linux ggml libraries from the sync; the Windows helper and
# the desktop crate link the Windows ones, so fetch this platform's archive into
# the checkout itself (the script resolves ROOT from its own path).
echo "==> ggml libraries for Windows"
TRIPLE=x86_64-pc-windows-msvc bash "$checkout/scripts/ci/ggml-libs.sh"

checkout_fwd="$(printf '%s' "$checkout_win" | sed 's|\\|/|g')"

# The Windows-side steps live in a script file: nesting quotes through `powershell.exe -Command`
# from bash is where this kind of build breaks, and a file is also what a user can re-run alone.
cat >"$checkout/local-build.ps1" <<PS1
param([string]\$Checkout = '$checkout_fwd')
\$ErrorActionPreference = 'Stop'
\$bash = 'C:\Program Files\Git\bin\bash.exe'
if (-not (Test-Path \$bash)) { throw 'Git Bash is not installed on the Windows host' }
& \$bash -lc "cd '\$Checkout' && TRIPLE=x86_64-pc-windows-msvc EXE=.exe bash scripts/ci/diarize-helper.sh"
if (\$LASTEXITCODE -ne 0) { throw 'the diarization helper failed to build' }
Set-Location "\$Checkout\desktop"
pnpm install --frozen-lockfile
if (\$LASTEXITCODE -ne 0) { throw 'pnpm install failed' }
pnpm exec tauri build --config local-build.json --bundles nsis
if (\$LASTEXITCODE -ne 0) { throw 'tauri build failed' }
PS1

echo "==> building on Windows"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$checkout_win\local-build.ps1"

echo "==> installer:"
find "$checkout/desktop/src-tauri/target/release/bundle/nsis" -name '*.exe' -maxdepth 1 -print 2>/dev/null | sed 's|^|    |' || true
