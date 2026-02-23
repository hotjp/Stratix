#!/bin/bash

# Download Tailscale binaries for Stratix

set -e

PLATFORM=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case "$ARCH" in
  x86_64|amd64) ARCH="amd64" ;;
  arm64|aarch64) ARCH="arm64" ;;
  *) echo "Unsupported arch: $ARCH"; exit 1 ;;
esac

case "$PLATFORM" in
  darwin) 
    SUFFIX="macos"
    ;;
  linux)
    SUFFIX="linux"
    ;;
  *)
    echo "Unsupported platform: $PLATFORM"
    exit 1
    ;;
esac

VERSION="1.78.3"
BIN_DIR="$(dirname "$0")/../bin"
mkdir -p "$BIN_DIR"

echo "Downloading Tailscale $VERSION for $SUFFIX-$ARCH..."

URL="https://pkgs.tailscale.com/stable/tailscale_${VERSION}_${SUFFIX}_${ARCH}.tgz"

cd /tmp
curl -L -o tailscale.tgz "$URL"
tar -xzf tailscale.tgz

cp tailscale_${VERSION}_*/tailscale "$BIN_DIR/"
cp tailscale_${VERSION}_*/tailscaled "$BIN_DIR/"

chmod +x "$BIN_DIR/tailscale"
chmod +x "$BIN_DIR/tailscaled"

rm -rf tailscale.tgz tailscale_${VERSION}_*

echo ""
echo "✓ Downloaded to:"
ls -la "$BIN_DIR"
