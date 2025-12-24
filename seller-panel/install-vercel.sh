#!/bin/bash
# Custom install script for Vercel to avoid monorepo workspace conflicts

set -e

echo "🔧 Installing seller-panel dependencies (ignoring monorepo context)..."

# Temporarily rename parent package.json to avoid workspace detection
if [ -f ../package.json ]; then
  echo "📦 Temporarily hiding parent package.json..."
  mv ../package.json ../package.json.tmp
fi

# Install dependencies using lockfile
echo "📥 Running npm ci..."
npm ci

# Restore parent package.json
if [ -f ../package.json.tmp ]; then
  echo "✅ Restoring parent package.json..."
  mv ../package.json.tmp ../package.json
fi

echo "✨ Installation complete!"
