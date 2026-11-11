#!/usr/bin/env bash
# Vulkan build prerequisites for the lint runner. The runner's DNS flakes
# often enough that a single apt call has failed whole lints; retry the pair,
# but bound every call so a hanging resolver cannot eat the job's 30 minutes.
set -euo pipefail

for attempt in 1 2 3; do
    if timeout 150 sudo apt-get -o Acquire::Retries=1 -o Acquire::http::Timeout=8 -o Acquire::https::Timeout=8 update &&
        timeout 180 sudo apt-get -o Acquire::Retries=1 -o Acquire::http::Timeout=8 -o Acquire::https::Timeout=8 install -y libvulkan-dev glslc glslang-tools spirv-headers; then
        exit 0
    fi
    echo "apt attempt $attempt failed; retrying in 10s"
    sleep 10
done
echo "::error::could not install the Vulkan build prerequisites after 3 attempts"
exit 1
