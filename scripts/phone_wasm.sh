#!/usr/bin/env bash
# Build the phone handoff's browser client: the wasm module into
# handoff/pwa/public/wasm, optimised with wasm-opt when binaryen is installed.
#
# Needs `rustup target add wasm32-unknown-unknown` and a wasm-bindgen-cli
# matching the pinned wasm-bindgen dependency in handoff/wasm/Cargo.toml.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/handoff/wasm"

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

# Shrink the module — it ships to phones, often on cellular. No --enable-* flags
# on purpose: wasm-bindgen emits a target-features section and binaryen honours
# it, so the module keeps exactly the features it needs. Naming features
# explicitly disables the unnamed ones, which shipped a module with a corrupt
# function table once; `-all` is worse still, because it turns on
# compact-imports and emits an encoding engines reject outright with "unknown
# import kind 0x7f".
wasm-opt -Os -o "$wasm.opt" "$wasm"
mv "$wasm.opt" "$wasm"
echo "wasm-opt: shrank $wasm"

# Sanity-check that the optimised module actually compiles. A wasm-opt flag mix
# has already shipped a module that only failed at load time in the browser,
# which is an expensive way to find out.
if command -v node >/dev/null; then
    if ! WASM_PATH="$wasm" node --input-type=module - >/dev/null <<'JS'
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
        exit 1
    fi
    echo "wasm-opt: module compiles"
fi
echo "wrote bindings to $out"
