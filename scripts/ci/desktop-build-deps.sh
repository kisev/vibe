#!/usr/bin/env bash
# Desktop crate build prerequisites for the compile-gate job (no rpm: it does
# not package a bundle there).
set -euo pipefail

sudo apt-get update && sudo apt-get install -y --no-install-recommends \
    pkg-config build-essential libglib2.0-dev libgtk-3-dev \
    libwebkit2gtk-4.1-dev clang cmake libssl-dev libasound2-dev \
    libxdo-dev libayatana-appindicator3-dev
