#!/usr/bin/env bash
# Build the phone handoff's browser client: the wasm module into
# handoff/pwa/public/wasm, optimised with wasm-opt when binaryen is installed.
#
# Needs `rustup target add wasm32-unknown-unknown` and a wasm-bindgen-cli
# matching the pinned wasm-bindgen dependency in handoff/wasm/Cargo.toml.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/handoff/wasm"

# The glue wasm-bindgen writes and the runtime it targets must be the same
# version, and the crate pins it exactly. Check both before the cargo build, not
# after it, so a mismatch (or a missing tool) costs seconds instead of minutes.
want="$(sed -nE 's/^wasm-bindgen *= *"=?([0-9.]+).*/\1/p' Cargo.toml | head -n1)"
# An empty pin means the manifest shape changed (an inline table, say); comparing
# against nothing would silently disable the check this block exists for.
if [ -z "$want" ]; then
    echo "cannot read the wasm-bindgen pin from handoff/wasm/Cargo.toml; expected wasm-bindgen = \"=X.Y.Z\"" >&2
    exit 1
fi
command -v wasm-bindgen >/dev/null || {
    echo "wasm-bindgen-cli is not on PATH (its version must match the pinned $want in Cargo.toml)" >&2
    exit 1
}
have="$(wasm-bindgen --version | awk '{print $2}')"
# node runs the compile check at the end; a missing node is a broken toolchain
# (vite needs it too), and it should cost seconds rather than a rust build.
command -v node >/dev/null || {
    echo "node is required to verify the optimised module; install node and retry" >&2
    exit 1
}
if [ -n "$want" ] && [ "$have" != "$want" ]; then
    echo "wasm-bindgen-cli $have does not match the pinned $want in handoff/wasm/Cargo.toml" >&2
    exit 1
fi

# Vite serves public/ verbatim, so the module lands at /wasm/handoff_wasm.js with
# its .wasm beside it, which is what wasm-bindgen's `--target web` glue expects.
out="$ROOT/handoff/pwa/public/wasm"
cargo build --target wasm32-unknown-unknown --release
mkdir -p "$out"
wasm-bindgen ./target/wasm32-unknown-unknown/release/handoff_wasm.wasm \
    --out-dir "$out" --weak-refs --target web

wasm="$out/handoff_wasm_bg.wasm"
if ! command -v wasm-opt >/dev/null; then
    echo "WARNING: wasm-opt not found on PATH; shipping the unoptimized module"
    echo "         (roughly 2x larger). Install binaryen to shrink it."
    echo "wrote bindings to $out"
    exit 0
fi

# The compile check below is the only guard against a wasm-opt output that only
# fails at load time, which has happened twice.

# Shrink the module — it ships to phones, often on cellular. No --enable-* flags
# on purpose: wasm-bindgen emits a target-features section and binaryen honours
# it, so the module keeps exactly the features it needs. Naming features
# explicitly disables the unnamed ones, which shipped a module with a corrupt
# function table once; `-all` is worse still, because it turns on
# compact-imports and emits an encoding engines reject outright with "unknown
# import kind 0x7f".
wasm-opt -Os -o "$wasm.opt" "$wasm"

# Check the optimised module before it replaces the known-good wasm-bindgen
# output, so a bad wasm-opt run leaves a working module in place.
if ! WASM_PATH="$wasm.opt" node --input-type=module - >/dev/null <<'JS'
import fs from 'node:fs'
try {
    new WebAssembly.Module(fs.readFileSync(process.env.WASM_PATH))
} catch (err) {
    console.error(`does not compile: ${err.message}`)
    process.exit(1)
}
JS
then
    echo "the optimised module does not compile; refusing to ship it" >&2
    rm -f "$wasm.opt"
    exit 1
fi
mv "$wasm.opt" "$wasm"
echo "wasm-opt: shrank $wasm"
echo "wasm-opt: module compiles"
echo "wrote bindings to $out"
