#!/usr/bin/env bash
# Linux desktop build dependencies: the GTK/WebKit stack clippy and the Tauri
# build need, plus ALSA for audio, xdo for the global shortcut and the
# appindicator bindings for the tray icon.
#
# The runners are Ubuntu, so apt is the path CI takes; a workstation that is not
# Debian-based gets its own package manager instead of an apt error.
set -euo pipefail

if command -v apt-get >/dev/null; then
    sudo apt-get update
    sudo apt-get install -y --no-install-recommends -o Acquire::Retries=3 \
        pkg-config build-essential libglib2.0-dev libgtk-3-dev \
        libwebkit2gtk-4.1-dev clang cmake libssl-dev libasound2-dev \
        libxdo-dev libayatana-appindicator3-dev rpm
elif command -v zypper >/dev/null; then
    sudo zypper install -y --no-recommends \
        pkg-config gcc gcc-c++ glib2-devel gtk3-devel \
        webkit2gtk-4_1-devel javascriptcoregtk-4_1-devel libsoup-3_0-devel \
        clang cmake libopenssl-devel alsa-devel libxdo-devel \
        libayatana-appindicator3-devel rpm
elif command -v dnf >/dev/null; then
    sudo dnf install -y gcc gcc-c++ glib2-devel gtk3-devel \
        webkit2gtk4.1-devel clang cmake openssl-devel alsa-lib-devel \
        libxdo-devel libappindicator-gtk3-devel rpm-build
else
    echo "no supported package manager found (apt-get, zypper, dnf)" >&2
    echo "install the Tauri Linux prerequisites for your distribution by hand" >&2
    exit 1
fi
