#!/bin/bash

##############################################################################
# Next.js Docker Deployment Script
# 
# This script automates the deployment of Next.js applications with Docker,
# SSL certificates, and domain configuration.
#
# Usage: ./deploy.sh [command] [options]
##############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

##############################################################################
# Helper Functions
##############################################################################

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

##############################################################################
# Check Prerequisites
##############################################################################

check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check Docker
    if command -v docker &> /dev/null; then
        print_success "Docker is installed"
    else
        print_error "Docker is not installed"
        echo "Install: curl -fsSL https://get.docker.com | sh"
        exit 1
    fi
    
    # Check Docker Compose
    if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
        print_success "Docker Compose is installed"
    else
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if .env exists
    if [ -f .env ]; then
        print_success ".env file exists"
    else
        print_warning ".env file not found"
        if [ -f .env.example ]; then
            print_info "Creating .env from .env.example"
            cp .env.example .env
            print_warning "Please edit .env with your configuration"
            exit 1
        fi
    fi
}

##############################################################################
# Get Server IP
##############################################################################

get_server_ip() {
    print_header "Getting Server IP Address"
    
    SERVER_IP=$(curl -4 -s ifconfig.me || hostname -I | awk '{print $1}')
    
    if [ -n "$SERVER_IP" ]; then
        print_success "Server IP: $SERVER_IP"
        echo "$SERVER_IP"
    else
        print_error "Could not determine server IP"
        exit 1
    fi
}

##############################################################################
# Check DNS
##############################################################################

check_dns() {
    local domain=$1
    local expected_ip=$2
    
    print_header "Checking DNS for $domain"
    
    actual_ip=$(dig +short "$domain" @8.8.8.8 | tail -n1)
    
    if [ "$actual_ip" == "$expected_ip" ]; then
        print_success "DNS is configured correctly: $domain → $actual_ip"
        return 0
    else
        print_warning "DNS not configured or not propagated yet"
        print_info "Expected: $expected_ip"
        print_info "Actual: ${actual_ip:-'Not found'}"
        return 1
    fi
}

##############################################################################
# Generate SSL Certificate
##############################################################################

generate_self_signed_ssl() {
    local domain=$1
    
    print_header "Generating Self-Signed SSL Certificate"
    
    mkdir -p ssl
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl/privkey.pem \
        -out ssl/fullchain.pem \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=$domain" \
        2>/dev/null
    
    print_success "Self-signed certificate created"
    print_warning "This is for testing only - get a real certificate for production"
}

##############################################################################
# Get Let's Encrypt Certificate
##############################################################################

get_letsencrypt_ssl() {
    local domain=$1
    local email=$2
    
    print_header "Getting Let's Encrypt SSL Certificate"
    
    # Check if certbot is installed
    if ! command -v certbot &> /dev/null; then
        print_error "Certbot is not installed"
        print_info "Install: sudo apt install certbot -y"
        exit 1
    fi
    
    # Stop nginx
    print_info "Stopping nginx..."
    docker compose stop nginx || true
    
    # Get certificate
    print_info "Requesting certificate from Let's Encrypt..."
    sudo certbot certonly --standalone \
        -d "$domain" \
        -d "www.$domain" \
        --email "$email" \
        --agree-tos \
        --non-interactive
    
    if [ $? -eq 0 ]; then
        # Copy certificates
        mkdir -p ssl
        sudo cp "/etc/letsencrypt/live/$domain/fullchain.pem" ./ssl/
        sudo cp "/etc/letsencrypt/live/$domain/privkey.pem" ./ssl/
        sudo chown "$USER:$USER" ./ssl/*.pem
        
        print_success "SSL certificate obtained successfully"
        return 0
    else
        print_error "Failed to obtain SSL certificate"
        return 1
    fi
}

##############################################################################
# Update Nginx Configuration
##############################################################################

update_nginx_domain() {
    local domain=$1
    
    print_header "Updating Nginx Configuration"
    
    if [ -f nginx.conf ]; then
        # Backup
        cp nginx.conf "nginx.conf.backup.$(date +%Y%m%d_%H%M%S)"
        
        # Update domain
        sed -i "s/server_name .*;/server_name $domain www.$domain;/g" nginx.conf
        
        print_success "Nginx configuration updated for $domain"
    else
        print_warning "nginx.conf not found"
    fi
}

##############################################################################
# Build and Deploy
##############################################################################

deploy() {
    print_header "Building and Deploying Application"
    
    # Build and start containers
    print_info "Building Docker images..."
    docker compose build
    
    print_info "Starting containers..."
    docker compose up -d
    
    # Wait a moment
    sleep 5
    
    # Check status
    print_info "Checking container status..."
    docker compose ps
    
    print_success "Deployment complete!"
}

##############################################################################
# Full Setup
##############################################################################

full_setup() {
    local domain=$1
    local email=$2
    
    print_header "Full Deployment Setup"
    
    # Validate inputs
    if [ -z "$domain" ] || [ -z "$email" ]; then
        print_error "Usage: ./deploy.sh setup <domain> <email>"
        exit 1
    fi
    
    # Check prerequisites
    check_prerequisites
    
    # Get server IP
    SERVER_IP=$(get_server_ip)
    
    # Check DNS
    print_info "Please ensure DNS is configured:"
    echo "  A    @      $SERVER_IP"
    echo "  A    www    $SERVER_IP"
    echo ""
    read -p "Press Enter once DNS is configured..."
    
    if check_dns "$domain" "$SERVER_IP"; then
        # DNS is working, get real SSL
        if get_letsencrypt_ssl "$domain" "$email"; then
            update_nginx_domain "$domain"
        fi
    else
        # DNS not working, use self-signed
        print_warning "Using self-signed certificate for now"
        generate_self_signed_ssl "$domain"
        update_nginx_domain "$domain"
    fi
    
    # Update .env
    if [ -f .env ]; then
        if grep -q "NEXTAUTH_URL=" .env; then
            sed -i "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=https://$domain|g" .env
        else
            echo "NEXTAUTH_URL=https://$domain" >> .env
        fi
        print_success "Updated NEXTAUTH_URL in .env"
    fi
    
    # Deploy
    deploy
    
    print_header "Setup Complete!"
    print_success "Your application should be accessible at:"
    echo "  https://$domain"
    echo "  https://www.$domain"
}

##############################################################################
# Show Help
##############################################################################

show_help() {
    cat << EOF
Next.js Docker Deployment Script

Usage: ./deploy.sh [command] [options]

Commands:
    setup <domain> <email>     Full setup with domain and SSL
    deploy                     Build and deploy containers
    restart                    Restart all containers
    stop                       Stop all containers
    start                      Start all containers
    logs [service]            View logs
    status                     Show container status
    ssl-renew <domain>        Renew SSL certificate
    check-dns <domain>        Check DNS configuration
    backup                     Backup application data
    clean                      Clean up Docker resources
    help                       Show this help message

Examples:
    ./deploy.sh setup example.com admin@example.com
    ./deploy.sh deploy
    ./deploy.sh logs app
    ./deploy.sh restart
    ./deploy.sh check-dns example.com
    ./deploy.sh ssl-renew example.com

Environment:
    Ensure .env file exists with required variables before deployment.

For detailed documentation, see NEXTJS-DOCKER-DEPLOYMENT-GUIDE.md
EOF
}

##############################################################################
# Command Handlers
##############################################################################

cmd_deploy() {
    check_prerequisites
    deploy
}

cmd_restart() {
    print_header "Restarting Services"
    docker compose restart
    print_success "Services restarted"
}

cmd_stop() {
    print_header "Stopping Services"
    docker compose down
    print_success "Services stopped"
}

cmd_start() {
    print_header "Starting Services"
    docker compose up -d
    print_success "Services started"
}

cmd_logs() {
    local service=$1
    if [ -n "$service" ]; then
        docker compose logs -f "$service"
    else
        docker compose logs -f
    fi
}

cmd_status() {
    print_header "Container Status"
    docker compose ps
}

cmd_ssl_renew() {
    local domain=$1
    
    if [ -z "$domain" ]; then
        print_error "Usage: ./deploy.sh ssl-renew <domain>"
        exit 1
    fi
    
    print_header "Renewing SSL Certificate"
    
    docker compose stop nginx
    sudo certbot renew
    sudo cp "/etc/letsencrypt/live/$domain/fullchain.pem" ./ssl/
    sudo cp "/etc/letsencrypt/live/$domain/privkey.pem" ./ssl/
    sudo chown "$USER:$USER" ./ssl/*.pem
    docker compose start nginx
    
    print_success "SSL certificate renewed"
}

cmd_check_dns() {
    local domain=$1
    
    if [ -z "$domain" ]; then
        print_error "Usage: ./deploy.sh check-dns <domain>"
        exit 1
    fi
    
    SERVER_IP=$(get_server_ip)
    check_dns "$domain" "$SERVER_IP"
}

cmd_backup() {
    print_header "Creating Backup"
    
    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup .env
    cp .env "$BACKUP_DIR/"
    
    # Backup SSL certificates
    cp -r ssl "$BACKUP_DIR/" 2>/dev/null || true
    
    print_success "Backup created: $BACKUP_DIR"
}

cmd_clean() {
    print_header "Cleaning Docker Resources"
    
    read -p "This will remove unused Docker images and volumes. Continue? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker image prune -a -f
        docker volume prune -f
        print_success "Docker resources cleaned"
    else
        print_info "Cleanup cancelled"
    fi
}

##############################################################################
# Main
##############################################################################

main() {
    case "${1:-help}" in
        setup)
            full_setup "$2" "$3"
            ;;
        deploy)
            cmd_deploy
            ;;
        restart)
            cmd_restart
            ;;
        stop)
            cmd_stop
            ;;
        start)
            cmd_start
            ;;
        logs)
            cmd_logs "$2"
            ;;
        status)
            cmd_status
            ;;
        ssl-renew)
            cmd_ssl_renew "$2"
            ;;
        check-dns)
            cmd_check_dns "$2"
            ;;
        backup)
            cmd_backup
            ;;
        clean)
            cmd_clean
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
