#!/bin/bash

# Script to generate independent lockfile for backend
# Run this from the backend directory

set -e

echo "🔧 Generating independent lockfile for backend..."

# Create temp directory
TEMP_DIR="/tmp/backend-lockfile-$(date +%s)"
mkdir -p "$TEMP_DIR"

# Copy package.json
cp package.json "$TEMP_DIR/"

# Copy .npmrc if exists
if [ -f .npmrc ]; then
  cp .npmrc "$TEMP_DIR/"
fi

# Generate lockfile
cd "$TEMP_DIR"
npm install --package-lock-only

# Copy back to backend
cp package-lock.json /Users/rhonalf.martinez/projects/gshop/backend/

# Cleanup
cd /Users/rhonalf.martinez/projects/gshop/backend
rm -rf "$TEMP_DIR"

echo "✅ Lockfile generated successfully!"
echo ""
echo "📦 Verifying key dependencies in lockfile..."

if grep -q '"@nestjs/throttler"' package-lock.json; then
  echo "✅ @nestjs/throttler found in lockfile"
else
  echo "⚠️  Warning: @nestjs/throttler not found"
fi

if grep -q '"artillery"' package-lock.json; then
  echo "✅ artillery found in lockfile"
else
  echo "⚠️  Warning: artillery not found"
fi

if grep -q '"ioredis"' package-lock.json; then
  echo "✅ ioredis found in lockfile"
else
  echo "⚠️  Warning: ioredis not found"
fi

echo ""
echo "🧪 Testing clean install..."
rm -rf node_modules
npm ci

echo ""
echo "✨ Done! Now commit the lockfile:"
echo "   git add package-lock.json"
echo "   git commit -m 'chore(backend): generate independent lockfile for standalone deployment'"
echo "   git push"
