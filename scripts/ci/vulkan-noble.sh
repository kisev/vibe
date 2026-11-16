#!/usr/bin/env bash
# Noble ships every Vulkan build prerequisite in apt; used by the arm64 cell.
set -euo pipefail

sudo apt-get update && sudo apt-get install -y libvulkan-dev glslc glslang-tools spirv-headers
