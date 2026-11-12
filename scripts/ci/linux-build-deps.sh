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
    # openSUSE names differ from Debian's: libsoup's 3.x headers ship in
    # libsoup-devel (libsoup2-devel is the 2.4 line) and libxdo's in
    # xdotool-devel. The WebKitGTK 4.1 development package is
    # webkit2gtk-4_1-devel where the distribution publishes it and
    # webkitgtk4-devel on releases that only carry the 4.0 split, so both are
    # tried and the pkg-config check afterwards decides.
    sudo zypper install -y --no-recommends \
        pkgconf gcc gcc-c++ glib2-devel gtk3-devel libsoup-devel \
        xdotool-devel alsa-devel libayatana-appindicator3-devel \
        libopenssl-devel clang cmake rpm
    # openSUSE publishes the 4.1 development files as webkitgtk3-devel (the
    # source is shared with the 4.0 line, whose headers come from
    # webkitgtk4-devel); the capability `pkgconfig(webkit2gtk-4.1)` is the
    # authority, and `zypper se --provides` names the same package.
    sudo zypper install -y --no-recommends webkitgtk3-devel ||
        sudo zypper install -y --no-recommends webkit2gtk-4_1-devel
    pkg-config --exists webkit2gtk-4.1 || {
        echo "webkit2gtk-4.1.pc is still missing; the desktop crate cannot build" >&2
        exit 1
    }
elif command -v dnf >/dev/null; then
    sudo dnf install -y gcc gcc-c++ glib2-devel gtk3-devel \
        webkit2gtk4.1-devel clang cmake openssl-devel alsa-lib-devel \
        libxdo-devel libappindicator-gtk3-devel rpm-build
else
    echo "no supported package manager found (apt-get, zypper, dnf)" >&2
    echo "install the Tauri Linux prerequisites for your distribution by hand" >&2
    exit 1
fi
