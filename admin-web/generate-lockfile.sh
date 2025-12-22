#!/bin/bash

# Script to generate independent lockfile for admin-web
# Run this from the admin-web directory

set -e

echo "🔧 Generating lockfile for admin-web with React 19..."

# Create temp directory
TEMP_DIR="/tmp/admin-web-lockfile-$(date +%s)"
mkdir -p "$TEMP_DIR"

# Copy package.json and .npmrc
cp package.json "$TEMP_DIR/"
cp .npmrc "$TEMP_DIR/"

# Generate lockfile
cd "$TEMP_DIR"
npm install --package-lock-only

# Copy back to admin-web
cp package-lock.json /Users/rhonalf.martinez/projects/gshop/admin-web/

# Cleanup
cd /Users/rhonalf.martinez/projects/gshop/admin-web
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
echo "   git commit -m 'Update admin-web to React 19 with independent lockfile and .npmrc'"
echo "   git push"
