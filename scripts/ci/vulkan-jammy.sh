#!/usr/bin/env bash
# Jammy (kept for the older glibc floor) needs the LunarG repository.
set -euo pipefail

# A key in trusted.gpg.d authenticates packages from every source apt knows
# about; keeping it in a dedicated keyring and naming it in signed-by= limits
# its trust to the LunarG repository.
list=/etc/apt/sources.list.d/lunarg-vulkan-jammy.list
sudo install -d -m 0755 /etc/apt/keyrings
wget -qO- https://packages.lunarg.com/lunarg-signing-key-pub.asc | sudo tee /etc/apt/keyrings/lunarg.asc >/dev/null
sudo wget -qO "$list" https://packages.lunarg.com/vulkan/lunarg-vulkan-jammy.list
sudo sed -i -E 's|^(deb(-src)?[[:space:]])|\1[signed-by=/etc/apt/keyrings/lunarg.asc] |' "$list"
grep -q 'signed-by=/etc/apt/keyrings/lunarg.asc' "$list" || {
    echo "could not scope the LunarG key to $list" >&2
    exit 1
}
sudo apt-get update && sudo apt-get install -y vulkan-sdk
