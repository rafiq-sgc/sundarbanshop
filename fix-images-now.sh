#!/bin/bash

##############################################################################
# Quick Image Fix Script
# Run this to fix the image display issue immediately
##############################################################################

set -e

echo "========================================="
echo "Quick Image Fix"
echo "========================================="
echo ""

cd "$(dirname "$0")"

echo "Step 1: Stopping containers..."
docker compose down

echo ""
echo "Step 2: Rebuilding with new configuration..."
docker compose build --no-cache

echo ""
echo "Step 3: Starting containers..."
docker compose up -d

echo ""
echo "Step 4: Waiting for services to start..."
sleep 10

echo ""
echo "Step 5: Checking status..."
docker compose ps

echo ""
echo "Step 6: Checking if uploads directory exists..."
docker compose exec app ls -la /app/public/uploads/ || true

echo ""
echo "========================================="
echo "Fix Applied!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Visit: https://sundarbanshop.com"
echo "2. Test uploading a new product image"
echo "3. Check if images display correctly"
echo ""
echo "Images are now configured to:"
echo "  - Load directly (unoptimized for better Docker compatibility)"
echo "  - Be stored in persistent volume"
echo "  - Survive container restarts"
echo ""
echo "View logs: docker compose logs -f app"
echo ""

