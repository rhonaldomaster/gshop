#!/bin/bash

# Script to generate independent lockfile for admin-web
# Run this from the admin-web directory
#
# Usage:
#   ./generate-lockfile.sh           # Only generate lockfile
#   ./generate-lockfile.sh --install # Generate lockfile and install dependencies

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DEPS=false

if [ "$1" = "--install" ]; then
  INSTALL_DEPS=true
fi

echo "🔧 Generating lockfile for admin-web..."

# Create temp directory
TEMP_DIR="/tmp/admin-web-lockfile-$(date +%s)"
mkdir -p "$TEMP_DIR"

# Copy package.json and .npmrc
cp "$SCRIPT_DIR/package.json" "$TEMP_DIR/"
if [ -f "$SCRIPT_DIR/.npmrc" ]; then
  cp "$SCRIPT_DIR/.npmrc" "$TEMP_DIR/"
fi

# Generate lockfile in isolation
cd "$TEMP_DIR"
npm install --package-lock-only 2>/dev/null

# Copy back to admin-web
cp package-lock.json "$SCRIPT_DIR/"

# Cleanup temp directory
rm -rf "$TEMP_DIR"

cd "$SCRIPT_DIR"

echo "✅ Lockfile generated successfully!"
echo ""
echo "📦 Verifying React version in lockfile..."

if grep -q '"react"' package-lock.json; then
  REACT_VERSION=$(grep -A1 '"react":' package-lock.json | grep '"version"' | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')
  echo "✅ React $REACT_VERSION found in lockfile"
else
  echo "⚠️  Warning: React not found in lockfile"
fi

if [ "$INSTALL_DEPS" = true ]; then
  echo ""
  echo "🧪 Installing dependencies..."
  npm ci
  echo "✅ Dependencies installed!"
else
  echo ""
  echo "💡 To install dependencies, run one of:"
  echo "   ./generate-lockfile.sh --install  # Standalone install"
  echo "   cd .. && npm install              # Monorepo install (recommended for dev)"
fi

echo ""
echo "✨ Done! To commit:"
echo "   git add package-lock.json"
echo "   git commit -m 'chore(admin-web): update lockfile'"
