#!/bin/bash

# SSL Setup Script for Ekomart
# This script helps you set up SSL certificates using Let's Encrypt

set -e

echo "========================================="
echo "Ekomart SSL Certificate Setup"
echo "========================================="
echo ""

# Check if domain is provided
if [ -z "$1" ]; then
    echo "Usage: ./setup-ssl.sh your-domain.com your-email@example.com"
    echo "Example: ./setup-ssl.sh ekomart.com admin@ekomart.com"
    exit 1
fi

DOMAIN=$1
EMAIL=${2:-"admin@${DOMAIN}"}

echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo ""

# Create ssl directory if it doesn't exist
echo "Creating SSL directory..."
mkdir -p ssl

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo "Certbot is not installed. Installing..."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update
        sudo apt-get install -y certbot
    else
        echo "Please install certbot manually for your operating system"
        exit 1
    fi
fi

echo ""
echo "========================================="
echo "Option 1: Using Certbot (Recommended)"
echo "========================================="
echo "This will obtain SSL certificates from Let's Encrypt"
echo ""
echo "Run the following command:"
echo ""
echo "sudo certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos"
echo ""
echo "Then copy the certificates:"
echo "sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ./ssl/"
echo "sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ./ssl/"
echo "sudo chown \$USER:\$USER ./ssl/*.pem"
echo ""
echo "========================================="
echo "Option 2: Self-Signed Certificate (Testing Only)"
echo "========================================="
echo ""
read -p "Do you want to create a self-signed certificate for testing? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Creating self-signed certificate..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl/privkey.pem \
        -out ssl/fullchain.pem \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"
    
    echo "Self-signed certificate created in ./ssl/"
    echo "⚠️  WARNING: Self-signed certificates should only be used for testing!"
fi

echo ""
echo "========================================="
echo "Next Steps:"
echo "========================================="
echo "1. Update nginx.conf:"
echo "   - Replace 'your-domain.com' with '$DOMAIN'"
echo "   - Uncomment the HTTPS server block"
echo "   - Uncomment the HTTP to HTTPS redirect"
echo ""
echo "2. Restart Docker containers:"
echo "   docker compose down"
echo "   docker compose up -d"
echo ""
echo "3. Test your SSL configuration:"
echo "   https://$DOMAIN"
echo ""

