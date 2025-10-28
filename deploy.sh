#!/bin/bash

# Ekomart Deployment Script for Digital Ocean
# This script automates the deployment process

set -e

echo "🚀 Starting Ekomart deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from env.example..."
    if [ -f env.example ]; then
        cp env.example .env
        print_warning "Please edit .env file with your actual configuration before continuing."
        print_warning "Especially update:"
        print_warning "  - MONGO_ROOT_PASSWORD"
        print_warning "  - NEXTAUTH_SECRET"
        print_warning "  - JWT_SECRET"
        print_warning "  - SMTP credentials"
        read -p "Press Enter after updating .env file..."
    else
        print_error "env.example file not found. Please create .env file manually."
        exit 1
    fi
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p ssl
mkdir -p public/uploads
mkdir -p logs

# Set proper permissions
print_status "Setting permissions..."
chmod +x deploy.sh
chmod 755 public/uploads

# Pull latest images
print_status "Pulling latest Docker images..."
docker-compose pull

# Build the application
print_status "Building application..."
docker-compose build --no-cache

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose down

# Start services
print_status "Starting services..."
docker-compose up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Check if services are running
print_status "Checking service status..."
if docker-compose ps | grep -q "Up"; then
    print_status "✅ Services are running successfully!"
    
    # Show service status
    docker-compose ps
    
    # Show logs
    print_status "Recent logs:"
    docker-compose logs --tail=20
    
    print_status "🎉 Deployment completed successfully!"
    print_status "Your application should be available at: http://your-server-ip"
    print_status "Admin panel: http://your-server-ip/admin"
    
    # Show useful commands
    echo ""
    print_status "Useful commands:"
    echo "  View logs: docker-compose logs -f"
    echo "  Stop services: docker-compose down"
    echo "  Restart services: docker-compose restart"
    echo "  Update application: ./deploy.sh"
    
else
    print_error "❌ Some services failed to start. Check logs:"
    docker-compose logs
    exit 1
fi
