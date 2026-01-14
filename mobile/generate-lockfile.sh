#!/bin/bash

# Script to generate independent lockfile for mobile app
# Run this from the mobile directory

set -e

echo "🔧 Generating lockfile for mobile app..."

# Create temp directory
TEMP_DIR="/tmp/mobile-lockfile-$(date +%s)"
mkdir -p "$TEMP_DIR"

# Copy package.json
cp package.json "$TEMP_DIR/"

# Check if .npmrc exists and copy it
if [ -f .npmrc ]; then
  cp .npmrc "$TEMP_DIR/"
fi

# Generate lockfile
cd "$TEMP_DIR"
npm install --package-lock-only

# Copy back to mobile
cp package-lock.json /Users/rhonalf.martinez/projects/gshop/mobile/

# Cleanup
cd /Users/rhonalf.martinez/projects/gshop/mobile
rm -rf "$TEMP_DIR"

echo "✅ Lockfile generated successfully!"
echo ""
echo "📦 Verifying expo-auth-session in lockfile..."

if grep -q '"expo-auth-session"' package-lock.json; then
  echo "✅ expo-auth-session confirmed in lockfile!"
else
  echo "⚠️  Warning: expo-auth-session not found in lockfile"
fi

echo ""
echo "🧪 Installing dependencies with npm ci..."
rm -rf node_modules
npm ci

echo ""
echo "✨ Done! Mobile lockfile generated and dependencies installed."
