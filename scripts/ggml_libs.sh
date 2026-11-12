#!/usr/bin/env bash
# The prebuilt ggml libraries: what they are built from, how they are fetched and
# how a bundle is published.
#
# A bundle is published under libraries-ggml-<version>-r<revision>. The revision
# is server/libs/revision, bumped by hand in the same commit as any change under
# server/libs/ (the ggml tag, the patches, this recipe) and reset to 1 when the
# ggml tag moves, so a changed bundle never replaces the one an older server tag
# still links against. The git tree hash of server/libs/ is recorded in the
# release notes and checked by `upload`: a release that already exists for
# another tree means the bump was forgotten.
#
#     scripts/ggml_libs.sh {id|tag|platform|fetch-headers|fetch|build|upload}
#
# `build` and `upload` are the rare, heavy path (clone ggml, compile it twice for
# the x86_64 CPU variants); `fetch` is what a normal desktop build runs.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LIBS="$ROOT/server/libs"
version="$(tr -d '[:space:]' <"$LIBS/ggml-version")"
revision="$(tr -d '[:space:]' <"$LIBS/revision")"
repo="thewh1teagle/vibe"
ggml_git="https://github.com/ggml-org/ggml.git"

os="$(uname -s)"
arch="$(uname -m)"

platform_id() {
    local id_os="" id_arch="$arch"
    case "$os" in
    Darwin) id_os="darwin" ;;
    Linux) id_os="linux" ;;
    MINGW* | MSYS* | CYGWIN*) id_os="windows" ;;
    *)
        echo "unsupported OS: $os" >&2
        return 1
        ;;
    esac
    if [ "$id_arch" = "arm64" ] && [ "$id_os" != "darwin" ]; then id_arch="aarch64"; fi
    if [ "$id_os" = "windows" ] && [ "$id_arch" = "x86_64" ]; then id_arch="amd64"; fi
    if [ "$id_os" = "windows" ]; then
        echo "$id_os-$id_arch-$(lib_flavor)"
    else
        echo "$id_os-$id_arch"
    fi
}

# Windows ships two toolchains; the import-library flavor decides which one the
# bundled archives were built for. Anywhere else there is nothing to choose.
lib_flavor() {
    case "$os" in
    MINGW* | MSYS* | CYGWIN* | windows)
        case "${VIBE_SERVER_WINDOWS_LIB_FLAVOR:-msvc}" in
        gnu | msvc) echo "${VIBE_SERVER_WINDOWS_LIB_FLAVOR:-msvc}" ;;
        *)
            echo "unsupported VIBE_SERVER_WINDOWS_LIB_FLAVOR: $VIBE_SERVER_WINDOWS_LIB_FLAVOR" >&2
            return 1
            ;;
        esac
        ;;
    *) echo "" ;;
    esac
}

libs_tag() { echo "libraries-ggml-$version-r$revision"; }

libs_id() { git -C "$ROOT" rev-parse --short=12 HEAD:./server/libs; }

fetch_headers() {
    local out="$LIBS/include" name
    mkdir -p "$out"
    for name in ggml.h ggml-cpu.h ggml-alloc.h ggml-backend.h gguf.h; do
        curl -fsSL --retry 3 --connect-timeout 20 --max-time 120 \
            -o "$out/$name.raw" "https://raw.githubusercontent.com/ggml-org/ggml/$version/include/$name"
        {
            echo "// Fetched: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
            echo "// Source: https://github.com/ggml-org/ggml/blob/$version/include/$name"
            echo "// Version: $version"
            echo ""
            cat "$out/$name.raw"
        } >"$out/$name"
        rm -f "$out/$name.raw"
        echo "wrote $name ($version)"
    done
}

fetch_libs() {
    local platform tag stage
    platform="${1:-$(platform_id)}"
    tag="$(libs_tag)"
    echo "ggml: $version"
    echo "platform: $platform"
    echo "release: $tag"
    mkdir -p "$ROOT/target"
    stage="$ROOT/target/ggml-libs"
    rm -rf "$stage"
    gh release download "$tag" --repo "$repo" \
        --pattern "ggml-libs-$platform.tar.gz" --dir "$ROOT/target" --clobber
    mkdir -p "$stage"
    # Relative names on purpose: under Git Bash a `D:/...` archive path reads as
    # `host D` to tar, which then tries to connect to a machine named D.
    (cd "$ROOT/target" && tar -xzf "ggml-libs-$platform.tar.gz" -C ggml-libs)
    # Only lib/ is taken: the archive also carries include/, and the headers the
    # build uses are the checked-in server/libs/include from the same ggml tag.
    rm -rf "${LIBS:?}/lib"
    mv "$stage/lib" "$LIBS/lib"
    rm -rf "$stage" "$ROOT/target/ggml-libs-$platform.tar.gz"
    echo "extracted to server/libs/lib"
}

build_libs() {
    local platform flavor src build pkg build_x64
    platform="$(platform_id)"
    flavor="$(lib_flavor)"
    src="$ROOT/ggml-src"
    build="$ROOT/ggml-build"
    build_x64="$ROOT/ggml-build-x64"
    pkg="$ROOT/ggml-build/pkg"
    echo "ggml: $version"
    echo "platform: $platform"

    rm -rf "$src"
    mkdir -p "$src"
    git -C "$src" init -q
    git -C "$src" remote add origin "$ggml_git"
    git -C "$src" fetch --depth 1 origin "$version"
    git -C "$src" checkout -q FETCH_HEAD
    git -C "$src" submodule update --init --depth 1 --recursive
    # Fixes ggml has not taken yet; each file says what it is for. Drop a patch
    # once the pinned tag carries the change, or git apply fails the build here.
    while IFS= read -r patch; do
        git -C "$src" apply --verbose "$patch"
    done < <(find "$LIBS/patches" -name '*.patch' | sort)

    rm -rf "$build"
    local -a flags=(
        -DCMAKE_BUILD_TYPE=Release
        -DBUILD_SHARED_LIBS=OFF
        -DGGML_BUILD_EXAMPLES=OFF
        -DGGML_BUILD_TESTS=OFF
    )
    if [ "$os" = "Darwin" ]; then
        flags+=(-DGGML_METAL=ON -DGGML_METAL_EMBED_LIBRARY=ON -DGGML_BLAS=ON -DGGML_BLAS_VENDOR=Apple -DCMAKE_OSX_DEPLOYMENT_TARGET=12.0)
    else
        # The loader is opened at runtime (libs/patches/0003), so nothing links against it.
        flags+=(-DGGML_VULKAN=ON -DGGML_VULKAN_DYNAMIC_LOADER=ON)
    fi
    # Not -march=native: the runner's CPU must not decide what users can run.
    # Every OS, including macOS, where a native build on the Intel runner died
    # with an illegal instruction on a 2012 Core i5. With GGML_NATIVE off, ggml
    # turns on SSE4.2 through AVX2, FMA and BMI2 (Haswell, 2013).
    if [ "$arch" = "x86_64" ]; then flags+=(-DGGML_NATIVE=OFF); fi
    if [ "$os" = "windows" ] && [ "$flavor" = "gnu" ]; then
        cmake -S "$src" -B "$build" "${flags[@]}" -G "MinGW Makefiles"
    else
        cmake -S "$src" -B "$build" "${flags[@]}"
    fi
    cmake --build "$build" --config Release --parallel

    # AVX2 is compiled into every CPU kernel, so one build cannot also serve a
    # CPU without it. Build the CPU backend a second time at the AVX baseline
    # (2011+); stage_cpu_variant suffixes each build's symbols and the server
    # picks one at startup.
    if [ "$arch" = "x86_64" ]; then
        rm -rf "$build_x64"
        local -a x64flags=("${flags[@]}" -DGGML_VULKAN=OFF -DGGML_AVX2=OFF -DGGML_FMA=OFF -DGGML_BMI2=OFF)
        if [ "$os" = "windows" ] && [ "$flavor" = "gnu" ]; then
            cmake -S "$src" -B "$build_x64" "${x64flags[@]}" -G "MinGW Makefiles"
        else
            cmake -S "$src" -B "$build_x64" "${x64flags[@]}"
        fi
        cmake --build "$build_x64" --config Release --parallel --target ggml-cpu
    fi

    rm -rf "$pkg"
    mkdir -p "$pkg/lib" "$pkg/include"
    if [ "$os" = "windows" ] && [ "$flavor" = "msvc" ]; then
        stage_lib "$build" "$pkg" ggml.lib ggml.lib
        stage_lib "$build" "$pkg" ggml-base.lib ggml-base.lib
        stage_cpu_variant "$build" "$pkg" hsw ggml-cpu.lib ggml-cpu-hsw.lib
        stage_cpu_variant "$build_x64" "$pkg" x64 ggml-cpu.lib ggml-cpu-x64.lib
        stage_lib "$build" "$pkg" ggml-vulkan.lib ggml-vulkan.lib
    elif [ "$os" = "windows" ]; then
        stage_lib "$build" "$pkg" libggml.a ggml.a
        stage_lib "$build" "$pkg" libggml-base.a ggml-base.a
        # MinGW's cmake writes ggml-cpu.a, without the lib prefix the linker looks for.
        stage_cpu_variant "$build" "$pkg" hsw ggml-cpu.a libggml-cpu-hsw.a
        stage_cpu_variant "$build_x64" "$pkg" x64 ggml-cpu.a libggml-cpu-x64.a
        stage_lib "$build" "$pkg" libggml-vulkan.a ggml-vulkan.a
    elif [ "$os" = "Darwin" ]; then
        stage_lib "$build" "$pkg" libggml.a libggml.a
        stage_lib "$build" "$pkg" libggml-base.a libggml-base.a
        if [ "$arch" = "x86_64" ]; then
            stage_cpu_variant "$build" "$pkg" hsw libggml-cpu.a libggml-cpu-hsw.a
            stage_cpu_variant "$build_x64" "$pkg" x64 libggml-cpu.a libggml-cpu-x64.a
        else
            stage_lib "$build" "$pkg" libggml-cpu.a libggml-cpu.a
        fi
        stage_lib "$build" "$pkg" libggml-metal.a libggml-metal.a
        stage_lib "$build" "$pkg" libggml-blas.a libggml-blas.a
    elif [ "$arch" = "x86_64" ]; then
        stage_lib "$build" "$pkg" libggml.a libggml.a
        stage_lib "$build" "$pkg" libggml-base.a libggml-base.a
        stage_cpu_variant "$build" "$pkg" hsw libggml-cpu.a libggml-cpu-hsw.a
        stage_cpu_variant "$build_x64" "$pkg" x64 libggml-cpu.a libggml-cpu-x64.a
        stage_lib "$build" "$pkg" libggml-vulkan.a libggml-vulkan.a
    else
        stage_lib "$build" "$pkg" libggml.a libggml.a
        stage_lib "$build" "$pkg" libggml-base.a libggml-base.a
        stage_lib "$build" "$pkg" libggml-cpu.a libggml-cpu.a
        stage_lib "$build" "$pkg" libggml-vulkan.a libggml-vulkan.a
    fi
    local header
    for header in ggml.h ggml-cpu.h ggml-alloc.h ggml-backend.h gguf.h; do
        cp "$src/include/$header" "$pkg/include/$header"
    done

    # lib/ and include/ are the archive's top-level entries; fetch relies on that layout.
    # Relative on purpose, for the reason given in fetch_libs.
    (cd "$pkg" && tar -czf "../ggml-libs-$platform.tar.gz" lib include)
    echo "packaged $ROOT/ggml-libs-$platform.tar.gz"
}

upload_libs() {
    local platform tag id archive existing
    platform="$(platform_id)"
    # The tag names the committed inputs, so an archive built from edited ones
    # would be filed under a name that does not describe it.
    if [ -n "$(git -C "$ROOT" status --porcelain -- server/libs)" ]; then
        echo "server/libs has uncommitted changes; commit them so the release tag matches what was built" >&2
        exit 1
    fi
    tag="$(libs_tag)"
    id="$(libs_id)"
    existing="$(gh api "repos/$repo/releases?per_page=100" --jq ".[] | select(.tag_name == \"$tag\") | .body" || true)"
    if [ -n "$existing" ] && ! grep -q "tree $id" <<<"$existing"; then
        echo "release $tag exists for another server/libs tree; bump server/libs/revision" >&2
        exit 1
    fi
    build_libs
    archive="$ROOT/ggml-libs-$platform.tar.gz"
    gh release create "$tag" --repo "$repo" --prerelease \
        --title "ggml $version libraries r$revision" \
        --notes "ggml $version, server/libs tree $id, revision $revision, built from vibe $(git -C "$ROOT" rev-parse --short=12 HEAD)." \
        2>/dev/null || true
    gh release upload "$tag" "$archive" --repo "$repo" --clobber
    echo "uploaded $archive to release $tag"
}

# Copy one built library out of the cmake tree: stage_lib <build> <pkg> <name> <alt>.
stage_lib() {
    local build="$1" pkg="$2" name="$3" alt="$4" found
    found="$(find "$build" -name "$name" -o -name "$alt" | head -1)"
    [ -n "$found" ] || {
        echo "$name not found under $build" >&2
        exit 1
    }
    echo "  found $found (packaged as $name)"
    cp "$found" "$pkg/lib/$name"
}

# Package one CPU backend build with every symbol it defines suffixed, so two
# builds can be linked into one binary:
# stage_cpu_variant <build> <pkg> <suffix> <name> <out>.
#
# The symbol list comes from the archive itself, so nothing is maintained by
# hand; a symbol that escaped the rename would fail the link as a duplicate.
stage_cpu_variant() {
    local build="$1" pkg="$2" suffix="$3" name="$4" out="$5" found lib map seen sym
    local nm_tool=nm objcopy_tool=objcopy
    if [ "$os" = "Darwin" ] || [ "$(lib_flavor)" = "msvc" ]; then
        nm_tool=llvm-nm
        objcopy_tool=llvm-objcopy
    fi

    found="$(find "$build" -name "$name" | head -1)"
    [ -n "$found" ] || {
        echo "$name not found under $build" >&2
        exit 1
    }

    lib="$pkg/lib/$out"
    cp "$found" "$lib"
    map="$lib.map"
    rm -f "$map"
    # Local symbols too: GCC signs a constructor's or destructor's COMDAT group
    # with a local C5/D5 symbol, and two builds whose groups carry the same
    # signature get folded into one by the linker, leaving the other's renamed
    # references dangling. nm walks the members, so it prints each one's name
    # with a trailing colon, and lists a symbol every member defines (COMDATs)
    # once per member; objcopy wants each symbol once. Keep the names seen so
    # far, space-fenced so no name is a prefix of another.
    seen=" "
    for sym in $("$nm_tool" --defined-only --format=just-symbols "$lib"); do
        case "$sym" in
        *:*) continue ;;
        esac
        case "$seen" in
        *" $sym "*) continue ;;
        esac
        echo "$sym ${sym}_$suffix" >>"$map"
        seen="$seen$sym "
    done
    "$objcopy_tool" --redefine-syms="$map" "$lib"
    rm -f "$map"
    echo "  staged $out from $found (symbols suffixed _$suffix)"
}

case "${1:-}" in
id) libs_id ;;
tag) libs_tag ;;
platform) platform_id ;;
fetch-headers) fetch_headers ;;
fetch) fetch_libs "${2:-}" ;;
build) build_libs ;;
upload) upload_libs ;;
*)
    echo "usage: $0 {id|tag|platform|fetch-headers|fetch|build|upload}" >&2
    exit 2
    ;;
esac
