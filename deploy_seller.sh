#!/bin/bash

# GSHOP Seller Panel Deployment Script
# Usage: ./deploy_seller.sh [environment]

set -e

# Configuration
ENVIRONMENT=${1:-development}
PROJECT_ROOT=$(pwd)
SELLER_PANEL_DIR="$PROJECT_ROOT/seller-panel"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 GSHOP Seller Panel Deployment Script${NC}"
echo -e "${BLUE}Environment: $ENVIRONMENT${NC}"
echo "----------------------------------------"

# Function to print status messages
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "seller-panel" ]; then
    print_error "This script must be run from the GSHOP project root directory"
    exit 1
fi

# Check required tools
check_requirements() {
    echo -e "${BLUE}Checking requirements...${NC}"

    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi

    print_status "Node.js and npm are installed"
}

# Install dependencies
install_dependencies() {
    echo -e "${BLUE}Installing dependencies...${NC}"

    # Install root dependencies
    npm install
    print_status "Root dependencies installed"

    # Install seller panel dependencies
    cd "$SELLER_PANEL_DIR"
    npm install
    print_status "Seller panel dependencies installed"

    cd "$PROJECT_ROOT"
}

# Environment setup
setup_environment() {
    echo -e "${BLUE}Setting up environment...${NC}"

    # Copy environment file if it doesn't exist
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_status "Environment file created from example"
            print_warning "Please update .env with your actual configuration"
        else
            print_error "No .env.example file found"
            exit 1
        fi
    else
        print_status "Environment file already exists"
    fi

    # Create seller panel .env if needed
    if [ ! -f "$SELLER_PANEL_DIR/.env.local" ]; then
        cat > "$SELLER_PANEL_DIR/.env.local" << EOL
NEXTAUTH_URL=http://localhost:3002
NEXTAUTH_SECRET=your-nextauth-secret-change-this-in-production
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
EOL
        print_status "Seller panel environment file created"
        print_warning "Please update seller-panel/.env.local with your actual configuration"
    else
        print_status "Seller panel environment file already exists"
    fi
}

# Database setup
setup_database() {
    echo -e "${BLUE}Setting up database...${NC}"

    # Start PostgreSQL with Docker
    if command -v docker &> /dev/null; then
        print_status "Starting PostgreSQL with Docker..."
        npm run docker:up
        print_status "PostgreSQL container started"
    else
        print_warning "Docker not found. Please ensure PostgreSQL is running manually"
    fi

    # Run migrations
    print_status "Running database migrations..."
    cd backend
    npm run migration:run 2>/dev/null || print_warning "Migrations may have failed - please check manually"
    cd "$PROJECT_ROOT"
}

# Build applications
build_applications() {
    echo -e "${BLUE}Building applications...${NC}"

    # Build backend
    cd backend
    npm run build
    print_status "Backend built successfully"

    # Build seller panel
    cd "$SELLER_PANEL_DIR"
    npm run build
    print_status "Seller panel built successfully"

    cd "$PROJECT_ROOT"
}

# Start services based on environment
start_services() {
    echo -e "${BLUE}Starting services...${NC}"

    case $ENVIRONMENT in
        "development")
            print_status "Starting development servers..."

            # Start backend in background
            echo "Starting backend on port 3000..."
            cd backend && npm run start:dev &
            BACKEND_PID=$!

            # Wait a moment for backend to start
            sleep 3

            # Start seller panel
            echo "Starting seller panel on port 3002..."
            cd "$SELLER_PANEL_DIR"
            npm run dev &
            SELLER_PANEL_PID=$!

            cd "$PROJECT_ROOT"

            print_status "Development servers started"
            echo -e "${GREEN}Backend:${NC} http://localhost:3000"
            echo -e "${GREEN}Seller Panel:${NC} http://localhost:3002"
            echo -e "${GREEN}API Docs:${NC} http://localhost:3000/api/docs"

            # Save PIDs for later cleanup
            echo $BACKEND_PID > .backend.pid
            echo $SELLER_PANEL_PID > .seller-panel.pid

            print_warning "Press Ctrl+C to stop all services"

            # Wait for interrupt
            trap cleanup INT
            wait
            ;;

        "production")
            print_status "Starting production servers..."

            # Start backend in production mode
            cd backend && npm run start:prod &
            BACKEND_PID=$!

            # Start seller panel in production mode
            cd "$SELLER_PANEL_DIR" && npm run start &
            SELLER_PANEL_PID=$!

            cd "$PROJECT_ROOT"

            print_status "Production servers started"
            ;;

        *)
            print_error "Unknown environment: $ENVIRONMENT"
            print_error "Supported environments: development, production"
            exit 1
            ;;
    esac
}

# Cleanup function
cleanup() {
    echo -e "${YELLOW}Shutting down services...${NC}"

    if [ -f .backend.pid ]; then
        kill $(cat .backend.pid) 2>/dev/null || true
        rm .backend.pid
    fi

    if [ -f .seller-panel.pid ]; then
        kill $(cat .seller-panel.pid) 2>/dev/null || true
        rm .seller-panel.pid
    fi

    print_status "Services stopped"
}

# Health check
health_check() {
    echo -e "${BLUE}Running health checks...${NC}"

    # Wait for services to start
    sleep 5

    # Check backend
    if curl -s http://localhost:3000/health >/dev/null 2>&1; then
        print_status "Backend is healthy"
    else
        print_warning "Backend health check failed"
    fi

    # Check seller panel
    if curl -s http://localhost:3002 >/dev/null 2>&1; then
        print_status "Seller panel is accessible"
    else
        print_warning "Seller panel health check failed"
    fi
}

# Main deployment flow
main() {
    check_requirements
    install_dependencies
    setup_environment

    if [ "$ENVIRONMENT" = "development" ]; then
        setup_database
    fi

    build_applications
    start_services

    if [ "$ENVIRONMENT" = "development" ]; then
        health_check
    fi
}

# Run main function
main

# Additional helpful commands
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "  npm run dev:backend    - Start backend only"
echo "  npm run dev:seller     - Start seller panel only"
echo "  npm run dev:admin      - Start admin panel"
echo "  npm run docker:up      - Start PostgreSQL"
echo "  npm run docker:down    - Stop PostgreSQL"
echo ""