#!/usr/bin/env bash
# Linux desktop build dependencies (GTK/WebKit stack, clang, rpm tools).
set -euo pipefail

sudo apt-get update
sudo apt-get install -y --no-install-recommends -o Acquire::Retries=3 \
    pkg-config build-essential libglib2.0-dev libgtk-3-dev \
    libwebkit2gtk-4.1-dev clang cmake libssl-dev libasound2-dev \
    libxdo-dev libayatana-appindicator3-dev rpm
