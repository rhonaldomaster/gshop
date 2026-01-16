#!/bin/bash

# Script to generate independent lockfile for backend
# Run this from the backend directory
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

echo "🔧 Generating independent lockfile for backend..."

# Create temp directory
TEMP_DIR="/tmp/backend-lockfile-$(date +%s)"
mkdir -p "$TEMP_DIR"

# Copy package.json
cp "$SCRIPT_DIR/package.json" "$TEMP_DIR/"

# Copy .npmrc if exists
if [ -f "$SCRIPT_DIR/.npmrc" ]; then
  cp "$SCRIPT_DIR/.npmrc" "$TEMP_DIR/"
fi

# Generate lockfile in isolation
cd "$TEMP_DIR"
npm install --package-lock-only 2>/dev/null

# Copy back to backend
cp package-lock.json "$SCRIPT_DIR/"

# Cleanup temp directory
rm -rf "$TEMP_DIR"

cd "$SCRIPT_DIR"

echo "✅ Lockfile generated successfully!"
echo ""
echo "📦 Verifying key dependencies in lockfile..."

if grep -q '"@nestjs/throttler"' package-lock.json; then
  echo "✅ @nestjs/throttler found"
else
  echo "⚠️  Warning: @nestjs/throttler not found"
fi

if grep -q '"artillery"' package-lock.json; then
  echo "✅ artillery found"
else
  echo "⚠️  Warning: artillery not found"
fi

if grep -q '"ioredis"' package-lock.json; then
  echo "✅ ioredis found"
else
  echo "⚠️  Warning: ioredis not found"
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
echo "   git commit -m 'chore(backend): update lockfile'"
