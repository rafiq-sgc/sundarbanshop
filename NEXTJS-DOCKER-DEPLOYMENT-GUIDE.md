# Complete Next.js Docker Deployment Guide

A comprehensive guide for deploying Next.js applications with Docker, Nginx, SSL, and domain configuration.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Setup](#project-setup)
3. [Docker Configuration](#docker-configuration)
4. [DNS Configuration](#dns-configuration)
5. [SSL Certificate Setup](#ssl-certificate-setup)
6. [Deployment](#deployment)
7. [Maintenance](#maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Server Requirements
- Ubuntu/Debian Linux server (DigitalOcean, AWS, etc.)
- Minimum 2GB RAM, 1 CPU
- Ports 80, 443, and 3000 accessible
- Root or sudo access

### Software Requirements
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose -y

# Install Certbot for SSL
sudo apt install certbot -y

# Log out and back in for Docker permissions
```

### Domain Requirements
- A registered domain name
- Access to DNS management

---

## Project Setup

### 1. Next.js Configuration

Create/update `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  images: {
    domains: ['localhost', 'yourdomain.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
}

module.exports = nextConfig
```

### 2. Environment Variables

Create `.env` file:

```bash
# Application
NODE_ENV=production
PORT=3000

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# Authentication
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=generate-a-strong-random-secret-here
JWT_SECRET=another-strong-random-secret-here

# Email (if using)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com
```

**Generate secrets:**
```bash
# Generate random secrets
openssl rand -base64 32
```

---

## Docker Configuration

### 1. Dockerfile

Create `Dockerfile`:

```dockerfile
# Use Node.js 18 Alpine as base image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept build arguments for environment variables needed during build
ARG MONGODB_URI
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET
ARG JWT_SECRET
ARG EMAIL_SERVICE
ARG EMAIL_HOST
ARG EMAIL_PORT
ARG EMAIL_USER
ARG EMAIL_PASSWORD
ARG EMAIL_FROM

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV MONGODB_URI=${MONGODB_URI}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENV JWT_SECRET=${JWT_SECRET}
ENV EMAIL_SERVICE=${EMAIL_SERVICE}
ENV EMAIL_HOST=${EMAIL_HOST}
ENV EMAIL_PORT=${EMAIL_PORT}
ENV EMAIL_USER=${EMAIL_USER}
ENV EMAIL_PASSWORD=${EMAIL_PASSWORD}
ENV EMAIL_FROM=${EMAIL_FROM}

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public folder if it exists
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### 2. Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - MONGODB_URI=${MONGODB_URI}
        - NEXTAUTH_URL=${NEXTAUTH_URL}
        - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
        - JWT_SECRET=${JWT_SECRET}
        - EMAIL_SERVICE=${EMAIL_SERVICE}
        - EMAIL_HOST=${EMAIL_HOST}
        - EMAIL_PORT=${EMAIL_PORT}
        - EMAIL_USER=${EMAIL_USER}
        - EMAIL_PASSWORD=${EMAIL_PASSWORD}
        - EMAIL_FROM=${EMAIL_FROM}
    image: myapp:latest
    restart: always
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - PORT=3000
    ports:
      - "3000:3000"
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    restart: always
    ports:
      - "6379:6379"

  nginx:
    image: nginx:stable-alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./public:/app/public:ro
    depends_on:
      - app

networks:
  default:
    driver: bridge
```

### 3. Nginx Configuration

Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log warn;

    # Basic Settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    client_max_body_size 20M;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Upstream for Next.js app
    upstream nextjs_upstream {
        server app:3000;
    }

    # HTTP Server
    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        
        # Redirect HTTP to HTTPS (uncomment after SSL setup)
        # return 301 https://$host$request_uri;

        # Proxy to Next.js
        location / {
            proxy_pass http://nextjs_upstream;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }

    # HTTPS Server (uncomment after getting SSL certificate)
    # server {
    #     listen 443 ssl;
    #     http2 on;
    #     server_name yourdomain.com www.yourdomain.com;
    # 
    #     ssl_certificate /etc/nginx/ssl/fullchain.pem;
    #     ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    #     ssl_protocols TLSv1.2 TLSv1.3;
    # 
    #     location / {
    #         proxy_pass http://nextjs_upstream;
    #         proxy_http_version 1.1;
    #         proxy_set_header Upgrade $http_upgrade;
    #         proxy_set_header Connection 'upgrade';
    #         proxy_set_header Host $host;
    #         proxy_set_header X-Real-IP $remote_addr;
    #         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    #         proxy_set_header X-Forwarded-Proto $scheme;
    #         proxy_cache_bypass $http_upgrade;
    #     }
    # }
}
```

### 4. .dockerignore

Create `.dockerignore`:

```
node_modules
npm-debug.log*
.next/
.git
.gitignore
README.md
.env.local
.env.development.local
.env.test.local
.env.production.local
```

---

## DNS Configuration

### 1. Get Your Server IP

```bash
curl -4 ifconfig.me
```

### 2. Add DNS Records

Log into your domain registrar and add these A records:

```
Type: A
Name: @
Value: YOUR_SERVER_IP
TTL: 3600

Type: A
Name: www
Value: YOUR_SERVER_IP
TTL: 3600
```

### 3. Verify DNS Propagation

```bash
nslookup yourdomain.com
# Should return your server IP
```

Wait 5-30 minutes for DNS to propagate worldwide.

---

## SSL Certificate Setup

### Option 1: Let's Encrypt (Recommended for Production)

```bash
# Stop nginx
docker compose stop nginx

# Get certificate
sudo certbot certonly --standalone \
  -d yourdomain.com \
  -d www.yourdomain.com \
  --email your-email@example.com \
  --agree-tos

# Create ssl directory
mkdir -p ssl

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./ssl/
sudo chown $USER:$USER ./ssl/*.pem

# Update nginx.conf - uncomment HTTPS server block
# Update nginx.conf - uncomment HTTP to HTTPS redirect

# Restart services
docker compose up -d
```

### Option 2: Self-Signed Certificate (Testing Only)

```bash
mkdir -p ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/privkey.pem \
  -out ssl/fullchain.pem \
  -subj "/C=US/ST=State/L=City/O=YourOrg/CN=yourdomain.com"
```

### Auto-Renewal Setup

```bash
# Create renewal script
cat > renew-ssl.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
docker compose stop nginx
certbot renew
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./ssl/
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./ssl/
chown $USER:$USER ./ssl/*.pem
docker compose start nginx
EOF

chmod +x renew-ssl.sh

# Add to crontab (runs every Monday at 3 AM)
(crontab -l 2>/dev/null; echo "0 3 * * 1 $(pwd)/renew-ssl.sh >> /var/log/ssl-renewal.log 2>&1") | crontab -
```

---

## Deployment

### Initial Deployment

```bash
# 1. Clone your repository
git clone https://github.com/yourusername/yourproject.git
cd yourproject

# 2. Create .env file with your secrets
cp .env.example .env
nano .env  # Edit with your values

# 3. Build and start containers
docker compose up -d --build

# 4. Check status
docker compose ps
docker compose logs -f
```

### Updates/Redeployment

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose down
docker compose up -d --build

# Or without downtime
docker compose up -d --build --force-recreate
```

---

## Maintenance

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f app
docker compose logs -f nginx

# Last 100 lines
docker compose logs --tail=100
```

### Restart Services

```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart app
docker compose restart nginx
```

### Database Backup (MongoDB)

```bash
# Backup
docker compose exec -T app mongodump --uri="$MONGODB_URI" --archive > backup-$(date +%Y%m%d).archive

# Restore
docker compose exec -T app mongorestore --uri="$MONGODB_URI" --archive < backup-20240101.archive
```

### Clean Up Docker

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Full cleanup
docker system prune -a --volumes
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose logs app

# Check if port is in use
sudo netstat -tulpn | grep :3000

# Rebuild from scratch
docker compose down -v
docker compose up -d --build
```

### Nginx SSL Errors

```bash
# Test nginx config
docker compose exec nginx nginx -t

# Check certificate files
ls -la ssl/

# Regenerate self-signed cert
rm ssl/*.pem
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/privkey.pem -out ssl/fullchain.pem \
  -subj "/C=US/ST=State/L=City/O=Org/CN=yourdomain.com"
```

### DNS Not Working

```bash
# Check DNS
nslookup yourdomain.com
dig yourdomain.com +short

# Check from different DNS servers
dig @8.8.8.8 yourdomain.com
dig @1.1.1.1 yourdomain.com

# Online tools
# https://dnschecker.org
# https://www.whatsmydns.net
```

### Build Errors

```bash
# Clear Docker cache
docker builder prune -a

# Rebuild without cache
docker compose build --no-cache

# Check environment variables during build
docker compose config
```

### Database Connection Issues

```bash
# Test MongoDB connection
docker compose exec app node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ Connected'))
  .catch(err => console.error('✗ Error:', err));
"
```

---

## Security Best Practices

### 1. Environment Variables
- Never commit `.env` to git
- Use strong random secrets (32+ characters)
- Rotate secrets periodically

### 2. Firewall Configuration

```bash
# UFW Firewall
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### 3. Regular Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker compose pull
docker compose up -d
```

### 4. Monitoring

```bash
# Install monitoring tools
# Consider: Prometheus, Grafana, or cloud monitoring
```

---

## Performance Optimization

### 1. Enable Caching in Nginx

Add to nginx.conf:
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=STATIC:10m inactive=7d use_temp_path=off;

location /_next/static {
    proxy_cache STATIC;
    proxy_pass http://nextjs_upstream;
    add_header X-Cache-Status $upstream_cache_status;
}
```

### 2. Database Indexing

Ensure proper MongoDB indexes for frequently queried fields.

### 3. CDN Integration

Consider using Cloudflare or similar for static assets.

---

## Quick Reference Commands

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# Restart
docker compose restart

# Rebuild
docker compose up -d --build

# Check status
docker compose ps

# Execute command in container
docker compose exec app sh

# View resource usage
docker stats

# Check SSL certificate expiry
openssl x509 -in ssl/fullchain.pem -noout -dates
```

---

## Additional Resources

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Docker Documentation](https://docs.docker.com/)
- [Let's Encrypt](https://letsencrypt.org/)
- [Nginx Documentation](https://nginx.org/en/docs/)

---

## License

This guide is provided as-is for educational purposes.

---

**Last Updated:** 2025
**Version:** 1.0.0

For issues or improvements, please open an issue or pull request.


