#!/bin/bash

# GSHOP Backend - Production Database Setup Script
# This script runs migrations and seeds for production database

set -e  # Exit on error

echo "🚀 GSHOP Production Database Setup"
echo "==================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo ""
    echo "Usage:"
    echo "  DATABASE_URL='your-postgres-url' ./scripts/setup-prod-db.sh"
    echo ""
    echo "Example:"
    echo "  DATABASE_URL='postgresql://user:pass@host:5432/db' ./scripts/setup-prod-db.sh"
    exit 1
fi

echo "📦 Installing dependencies..."
cd "$(dirname "$0")/.."
npm install --production=false

echo ""
echo "🔄 Running migrations..."
npm run migration:run

echo ""
echo "🌱 Running production seed..."
echo "⚠️  This will create essential data (admin, categories, commissions)"
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    npm run seed:prod
fi

echo ""
echo "✅ Production database setup completed!"
echo ""
echo "🔐 Next steps:"
echo "  1. Log in to admin panel with credentials shown above"
echo "  2. Change the default admin password immediately"
echo "  3. Configure your seller accounts"
echo ""
