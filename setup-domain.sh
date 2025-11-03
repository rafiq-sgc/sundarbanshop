#!/bin/bash

# Domain Setup Script for Ekomart
# Quick configuration for your domain name

set -e

echo "========================================="
echo "Ekomart Domain Configuration"
echo "========================================="
echo ""

# Check if domain is provided
if [ -z "$1" ]; then
    echo "Usage: ./setup-domain.sh your-domain.com"
    echo "Example: ./setup-domain.sh ekomart.com"
    echo ""
    echo "This script will:"
    echo "  1. Update nginx.conf with your domain"
    echo "  2. Update .env with NEXTAUTH_URL"
    echo "  3. Restart Docker containers"
    exit 1
fi

DOMAIN=$1
WWW_DOMAIN="www.$DOMAIN"

echo "Configuring domain: $DOMAIN"
echo ""

# Backup nginx.conf
echo "Creating backup of nginx.conf..."
cp nginx.conf nginx.conf.backup.$(date +%Y%m%d_%H%M%S)

# Update nginx.conf
echo "Updating nginx.conf with domain name..."
sed -i "s/server_name your-domain\.com www\.your-domain\.com;/server_name $DOMAIN $WWW_DOMAIN;/g" nginx.conf
sed -i "s/server_name your-domain\.com www\.your-domain\.com;/server_name $DOMAIN $WWW_DOMAIN;/g" nginx.conf

# Update nginx.conf in commented HTTPS section too
sed -i "s/#     server_name your-domain\.com www\.your-domain\.com;/#     server_name $DOMAIN $WWW_DOMAIN;/g" nginx.conf

echo "✓ nginx.conf updated"

# Update .env if it exists
if [ -f .env ]; then
    echo "Updating .env file..."
    
    # Backup .env
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    
    # Update or add NEXTAUTH_URL
    if grep -q "^NEXTAUTH_URL=" .env; then
        sed -i "s|^NEXTAUTH_URL=.*|NEXTAUTH_URL=http://$DOMAIN|g" .env
    else
        echo "NEXTAUTH_URL=http://$DOMAIN" >> .env
    fi
    
    echo "✓ .env updated (using HTTP for now)"
else
    echo "⚠️  .env file not found. Please create it from env.example"
fi

echo ""
echo "========================================="
echo "Configuration Complete!"
echo "========================================="
echo ""
echo "Your domain: $DOMAIN"
echo ""
echo "Next steps:"
echo ""
echo "1. Configure DNS (add these A records to your domain):"
echo "   Type: A, Name: @,   Value: YOUR_SERVER_IP"
echo "   Type: A, Name: www, Value: YOUR_SERVER_IP"
echo ""
echo "2. Wait for DNS propagation (5 mins - 48 hours)"
echo "   Test with: nslookup $DOMAIN"
echo ""
echo "3. Restart Docker containers:"
echo "   docker compose down"
echo "   docker compose up -d"
echo ""
echo "4. Test your site:"
echo "   http://$DOMAIN"
echo ""
echo "5. For SSL/HTTPS setup, run:"
echo "   ./setup-ssl.sh $DOMAIN your-email@example.com"
echo ""
echo "📖 For detailed instructions, see: DOMAIN-SETUP-GUIDE.md"
echo ""

