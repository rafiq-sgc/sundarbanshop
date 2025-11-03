#!/bin/bash

##############################################################################
# Image Migration Script
# 
# This script migrates existing product images from the container to
# the persistent volume
##############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================="
echo "Image Migration Script"
echo "========================================="
echo ""

# Check if docker compose is running
if ! docker compose ps | grep -q "Up"; then
    echo "Error: Containers are not running"
    echo "Start them with: docker compose up -d"
    exit 1
fi

echo "Step 1: Creating backup of current uploads..."
mkdir -p backups
BACKUP_DIR="backups/uploads_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Copy uploads from container to backup
docker compose exec -T app sh -c 'if [ -d /app/public/uploads ]; then tar -cf - /app/public/uploads; else exit 0; fi' > "$BACKUP_DIR/uploads.tar" 2>/dev/null || true

if [ -s "$BACKUP_DIR/uploads.tar" ]; then
    echo "✓ Backup created: $BACKUP_DIR/uploads.tar"
else
    echo "ℹ No existing uploads found in container"
    rm -rf "$BACKUP_DIR"
fi

echo ""
echo "Step 2: Copying existing uploads from host public folder..."

# If there are uploads in the local public folder, copy them
if [ -d "./public/uploads" ] && [ "$(ls -A ./public/uploads 2>/dev/null)" ]; then
    echo "Found uploads in ./public/uploads"
    
    # Get the volume name
    VOLUME_NAME=$(docker compose config --format json | grep -o '"uploads"' | head -1 | tr -d '"')
    
    if [ -z "$VOLUME_NAME" ]; then
        VOLUME_NAME="${PWD##*/}_uploads"
    fi
    
    # Create a temporary container to access the volume
    echo "Copying files to persistent volume..."
    docker run --rm \
        -v "${VOLUME_NAME}":/uploads \
        -v "$(pwd)/public/uploads":/source:ro \
        alpine sh -c 'cp -r /source/* /uploads/ 2>/dev/null || true'
    
    echo "✓ Images copied to persistent volume"
else
    echo "ℹ No uploads found in ./public/uploads"
fi

echo ""
echo "Step 3: Verifying images in volume..."

# Check what's in the volume
VOLUME_NAME=$(docker volume ls --format "{{.Name}}" | grep uploads | head -1)
if [ -n "$VOLUME_NAME" ]; then
    FILE_COUNT=$(docker run --rm -v "${VOLUME_NAME}":/uploads alpine sh -c 'find /uploads -type f | wc -l')
    echo "✓ Found $FILE_COUNT files in uploads volume"
else
    echo "⚠ Uploads volume not found"
fi

echo ""
echo "========================================="
echo "Migration Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Restart containers: docker compose restart"
echo "2. Test uploading new images"
echo "3. Check if existing images display correctly"
echo ""
echo "Note: Images are now persisted in a Docker volume"
echo "They will survive container restarts and updates"
echo ""

