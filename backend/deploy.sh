#!/bin/bash

# GSHOP Backend Deployment Script
# This script handles database migrations and application startup

set -e  # Exit on error

echo "🚀 Starting GSHOP Backend deployment..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  WARNING: DATABASE_URL not set. Using default config from .env"
fi

# Function to run migrations
run_migrations() {
  echo "📦 Running database migrations..."
  npm run migration:run

  if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully!"
  else
    echo "❌ Migration failed!"
    exit 1
  fi
}

# Function to show pending migrations
show_migrations() {
  echo "📋 Checking for pending migrations..."
  npm run migration:show
}

# Function to build the application
build_app() {
  echo "🔨 Building application..."
  npm run build

  if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
  else
    echo "❌ Build failed!"
    exit 1
  fi
}

# Main deployment logic
case "${1:-deploy}" in
  "init")
    # First time setup: just run migrations
    echo "🎬 First time initialization..."
    run_migrations
    echo "🎉 Database initialized! You can now start the app."
    ;;

  "migrate")
    # Just run migrations (useful for updates)
    show_migrations
    run_migrations
    ;;

  "build")
    # Just build
    build_app
    ;;

  "deploy")
    # Full deployment: build + migrate + start
    echo "🚢 Full deployment starting..."
    build_app
    run_migrations
    echo "🎉 Deployment complete! Starting application..."
    npm run start:prod
    ;;

  "start")
    # Just start (assumes migrations are done)
    echo "▶️  Starting application..."
    npm run start:prod
    ;;

  *)
    echo "Usage: $0 {init|migrate|build|deploy|start}"
    echo ""
    echo "Commands:"
    echo "  init    - Initialize database (first time setup)"
    echo "  migrate - Run pending migrations only"
    echo "  build   - Build application only"
    echo "  deploy  - Full deployment (build + migrate + start)"
    echo "  start   - Start application without migrations"
    exit 1
    ;;
esac
