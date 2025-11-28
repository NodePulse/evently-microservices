#!/bin/bash

# User Service Deployment Script
# This script helps deploy the user-service to various platforms

set -e

echo "🚀 User Service Deployment Helper"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if .env exists
if [ ! -f .env ]; then
    print_error ".env file not found!"
    echo "Please create a .env file based on .env.example"
    exit 1
fi

print_success ".env file found"

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    print_error "Node.js version 20 or higher is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js version check passed ($(node -v))"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

print_success "Dependencies installed"

# Generate Prisma Client
echo ""
echo "🔧 Generating Prisma Client..."
npx prisma generate

print_success "Prisma Client generated"

# Run migrations
echo ""
echo "🗄️  Running database migrations..."
read -p "Do you want to run database migrations? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx prisma migrate deploy
    print_success "Database migrations completed"
else
    print_warning "Skipped database migrations"
fi

# Build application
echo ""
echo "🔨 Building application..."
npm run build

print_success "Application built successfully"

# Ask deployment method
echo ""
echo "Choose deployment method:"
echo "1) Test locally (npm run start:prod)"
echo "2) Docker build"
echo "3) Docker Compose"
echo "4) PM2 (for production servers)"
echo "5) Exit"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Starting application locally..."
        npm run start:prod
        ;;
    2)
        echo ""
        echo "🐳 Building Docker image..."
        docker build -t user-service:latest .
        print_success "Docker image built: user-service:latest"
        echo ""
        echo "To run the container:"
        echo "docker run -d --name user-service -p 8001:8001 --env-file .env user-service:latest"
        ;;
    3)
        echo ""
        echo "🐳 Starting with Docker Compose..."
        docker-compose up -d
        print_success "Services started with Docker Compose"
        echo ""
        echo "To view logs: docker-compose logs -f"
        echo "To stop: docker-compose down"
        ;;
    4)
        echo ""
        echo "📊 Starting with PM2..."
        
        # Check if PM2 is installed
        if ! command -v pm2 &> /dev/null; then
            print_warning "PM2 not found. Installing PM2..."
            npm install -g pm2
        fi
        
        # Stop existing instance if running
        pm2 delete user-service 2>/dev/null || true
        
        # Start with PM2
        pm2 start dist/main.js --name user-service
        pm2 save
        
        print_success "Application started with PM2"
        echo ""
        echo "Useful PM2 commands:"
        echo "  pm2 logs user-service    - View logs"
        echo "  pm2 monit                - Monitor resources"
        echo "  pm2 restart user-service - Restart service"
        echo "  pm2 stop user-service    - Stop service"
        echo "  pm2 startup              - Enable auto-start on boot"
        ;;
    5)
        echo "Exiting..."
        exit 0
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

echo ""
print_success "Deployment completed!"
echo ""
echo "📝 Next steps:"
echo "  1. Test health endpoint: curl http://localhost:8001/health"
echo "  2. Test API: curl http://localhost:8001/"
echo "  3. Check logs for any errors"
echo "  4. Set up monitoring and alerts"
echo ""
echo "📚 For more information, see HOSTING.md"
