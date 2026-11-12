#!/usr/bin/env bash
# Clippy through one door: bindgen's build scripts (ggml-rs-sys and friends)
# need libclang, and a host without clang installed fails deep inside a build
# script with a message that reads like a code error. Resolve it once here —
# from the system when it exists, from the `libclang` wheel uv can fetch when it
# does not — and hand cargo the path.
set -euo pipefail

if [ -z "${LIBCLANG_PATH:-}" ]; then
    if command -v ldconfig >/dev/null && ldconfig -p 2>/dev/null | grep -q 'libclang'; then
        :
    else
        LIBCLANG_PATH="$(uv run --with libclang python -c \
            "import pathlib; import clang; print(pathlib.Path(clang.__file__).parent / 'native')")"
        export LIBCLANG_PATH
        # The wheel carries the compiler but not libc's headers; without the
        # host's own include directory bindgen cannot find stdbool.h.
        gcc_include="$(gcc -print-file-name=include 2>/dev/null || true)"
        if [ -d "$gcc_include" ]; then
            export BINDGEN_EXTRA_CLANG_ARGS="-isystem $gcc_include ${BINDGEN_EXTRA_CLANG_ARGS:-}"
        fi
    fi
fi

exec cargo clippy "$@"
