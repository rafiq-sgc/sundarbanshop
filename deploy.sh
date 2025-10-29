#!/bin/bash

# Ekomart Deployment Script for Digital Ocean with MongoDB Atlas
# This script automates the deployment process

set -e

echo "🚀 Starting Ekomart deployment with MongoDB Atlas..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
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
        print_warning "  - MONGODB_URI (your MongoDB Atlas connection string)"
        print_warning "  - NEXTAUTH_URL (your domain URL)"
        print_warning "  - NEXTAUTH_SECRET"
        print_warning "  - JWT_SECRET"
        print_warning "  - SMTP credentials"
        print_warning "  - STRIPE keys (if using payments)"
        read -p "Press Enter after updating .env file..."
    else
        print_error "env.example file not found. Please create .env file manually."
        exit 1
    fi
fi

# Validate MongoDB Atlas connection string
if grep -q "mongodb+srv://" .env; then
    print_status "✅ MongoDB Atlas connection string detected"
else
    print_warning "⚠️  Please ensure MONGODB_URI in .env contains your MongoDB Atlas connection string"
    print_warning "   Example: MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database"
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
docker-compose -f docker-compose.prod.yml pull

# Build the application
print_status "Building application..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Start services
print_status "Starting services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Check if services are running
print_status "Checking service status..."
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    print_status "✅ Services are running successfully!"
    
    # Show service status
    docker-compose -f docker-compose.prod.yml ps
    
    # Test health endpoint
    print_status "Testing application health..."
    if curl -f http://localhost/health > /dev/null 2>&1; then
        print_status "✅ Application health check passed!"
    else
        print_warning "⚠️  Health check failed, but services are running"
    fi
    
    # Show logs
    print_status "Recent logs:"
    docker-compose -f docker-compose.prod.yml logs --tail=20
    
    print_status "🎉 Deployment completed successfully!"
    print_info "Your application should be available at: http://your-server-ip"
    print_info "Admin panel: http://your-server-ip/admin"
    print_info "Health check: http://your-server-ip/health"
    
    # Show useful commands
    echo ""
    print_status "Useful commands:"
    echo "  View logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo "  Stop services: docker-compose -f docker-compose.prod.yml down"
    echo "  Restart services: docker-compose -f docker-compose.prod.yml restart"
    echo "  Update application: ./deploy.sh"
    echo "  Check health: curl http://localhost/health"
    
    # Show MongoDB Atlas info
    echo ""
    print_info "📊 MongoDB Atlas Configuration:"
    print_info "  - Using MongoDB Atlas (cloud-hosted)"
    print_info "  - No local MongoDB container needed"
    print_info "  - Connection string configured in .env"
    
else
    print_error "❌ Some services failed to start. Check logs:"
    docker-compose -f docker-compose.prod.yml logs
    exit 1
fi