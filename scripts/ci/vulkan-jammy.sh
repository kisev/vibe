#!/usr/bin/env bash
# Jammy (kept for the older glibc floor) needs the LunarG repository.
set -euo pipefail

wget -qO- https://packages.lunarg.com/lunarg-signing-key-pub.asc | sudo tee /etc/apt/trusted.gpg.d/lunarg.asc >/dev/null
sudo wget -qO /etc/apt/sources.list.d/lunarg-vulkan-jammy.list https://packages.lunarg.com/vulkan/lunarg-vulkan-jammy.list
sudo apt-get update && sudo apt-get install -y vulkan-sdk
