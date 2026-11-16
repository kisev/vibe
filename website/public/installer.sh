#!/bin/sh

# Linux installer for Vibe
# Supports Linux x86-64 and aarch64 with DEB / RPM packages
# Accepts tag in the first argument

# Usage:
# ./installer.sh {tag}

# Available at https://kisev.github.io/vibe/installer.sh
# Via curl -sSf https://kisev.github.io/vibe/installer.sh | sh -s {tag}

set -e

TAG=$1
TAG_WITHOUT_V=$(echo "$TAG" | sed 's/^v//')

echo "tag is $TAG"
if [ -z "$TAG" ]; then
    echo "Error: No tag specified. Usage: ./installer.sh {tag}"
    exit 1
fi

# Detect architecture
ARCH=$(uname -m)
case "$ARCH" in
x86_64)
    DEB_ARCH="amd64"
    RPM_ARCH="x86_64"
    ;;
aarch64 | arm64)
    DEB_ARCH="arm64"
    RPM_ARCH="aarch64"
    ;;
*)
    echo "Error: Unsupported architecture: $ARCH"
    exit 1
    ;;
esac

# Determine the package type and download the appropriate file
echo "Downloading Vibe version $TAG for $ARCH..."

RPM_URL="https://github.com/kisev/vibe/releases/download/${TAG}/vibe-${TAG_WITHOUT_V}-1.${RPM_ARCH}.rpm"
DEB_URL="https://github.com/kisev/vibe/releases/download/${TAG}/vibe_${TAG_WITHOUT_V}_${DEB_ARCH}.deb"
echo "$RPM_URL"
# Create temporary directory for downloading. The trap removes it on the way out,
# including the exits `set -e` takes when a download or an install step fails.
TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT
cd "$TEMP_DIR"

# Download the correct package based on the distribution
if [ -f /etc/os-release ]; then
    # Check for the package manager
    if grep -iq "ubuntu\|debian" /etc/os-release; then
        echo "Detected Debian/Ubuntu. Downloading DEB package..."
        wget "$DEB_URL" -O vibe.deb
        sudo apt-get install -y ./vibe.deb
    elif grep -iq "centos\|fedora\|rhel" /etc/os-release; then
        echo "Detected CentOS/Fedora/RHEL. Downloading RPM package..."
        wget -q "$RPM_URL" -O vibe.rpm
        sudo rpm -ivh vibe.rpm
    elif grep -iq "arch" /etc/os-release; then
        # The AUR's vibe-bin follows upstream, and an upstream package would let
        # upstream's own updater replace this fork. The fork publishes no Arch
        # package, so say that instead of installing someone else's build.
        echo "Error: Vibe publishes no Arch package. Take the DEB or RPM from"
        echo "https://github.com/kisev/vibe/releases/tag/${TAG} and convert it, or build from source."
        exit 1
    else
        echo "Unsupported Linux distribution."
        exit 1
    fi
else
    echo "Unable to determine the package manager. Please install the package manually."
    exit 1
fi

echo "Vibe installation complete!"
echo "Run 'vibe' to open it!"
