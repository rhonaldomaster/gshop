#!/bin/bash

# Script to generate independent lockfile for seller-panel
# Run this from the seller-panel directory

set -e

echo "🔧 Generating lockfile for seller-panel with React 19..."

# Create temp directory
TEMP_DIR="/tmp/seller-panel-lockfile-$(date +%s)"
mkdir -p "$TEMP_DIR"

# Copy package.json and .npmrc
cp package.json "$TEMP_DIR/"
cp .npmrc "$TEMP_DIR/"

# Generate lockfile
cd "$TEMP_DIR"
npm install --package-lock-only

# Copy back to seller-panel
cp package-lock.json /Users/rhonalf.martinez/projects/gshop/seller-panel/

# Cleanup
cd /Users/rhonalf.martinez/projects/gshop/seller-panel
rm -rf "$TEMP_DIR"

echo "✅ Lockfile generated successfully!"
echo "📦 Verifying React version in lockfile..."

if grep -q '"react".*"19.1.0"' package-lock.json; then
  echo "✅ React 19.1.0 confirmed in lockfile!"
else
  echo "⚠️  Warning: React 19.1.0 not found in lockfile"
fi

echo ""
echo "🧪 Testing clean install..."
rm -rf node_modules
npm ci

echo ""
echo "✨ Done! Now commit and push to Vercel:"
echo "   git add package.json package-lock.json .npmrc"
echo "   git commit -m 'Update seller-panel to React 19 with independent lockfile and .npmrc'"
echo "   git push"
