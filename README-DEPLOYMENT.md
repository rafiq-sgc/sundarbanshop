# Ekomart E-commerce Deployment Guide

This guide will help you deploy the Ekomart e-commerce application on Digital Ocean using Docker.

## Prerequisites

- Digital Ocean Droplet (Ubuntu 20.04+ recommended)
- Docker and Docker Compose installed
- Domain name (optional but recommended)
- SSL certificate (for production)

## Quick Start

1. **Clone the repository on your Digital Ocean droplet:**
   ```bash
   git clone <your-repository-url>
   cd ekomart
   ```

2. **Configure environment variables:**
   ```bash
   cp env.example .env
   nano .env
   ```

3. **Update the .env file with your configuration:**
   ```bash
   # Database Configuration
   MONGO_ROOT_USERNAME=admin
   MONGO_ROOT_PASSWORD=your-secure-password-here
   MONGO_DATABASE=ekomart

   # NextAuth Configuration
   NEXTAUTH_URL=http://your-domain.com
   NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production

   # Email Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password

   # JWT Secret
   JWT_SECRET=your-jwt-secret-key-change-this-in-production
   ```

4. **Deploy the application:**
   ```bash
   ./deploy.sh
   ```

## Manual Deployment

If you prefer to deploy manually:

1. **Build and start services:**
   ```bash
   docker-compose up -d --build
   ```

2. **Check service status:**
   ```bash
   docker-compose ps
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f
   ```

## Production Deployment

For production deployment, use the production compose file:

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

## SSL Configuration

1. **Obtain SSL certificates** (Let's Encrypt recommended):
   ```bash
   # Install certbot
   sudo apt update
   sudo apt install certbot

   # Get certificate
   sudo certbot certonly --standalone -d your-domain.com
   ```

2. **Copy certificates to ssl directory:**
   ```bash
   sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/cert.pem
   sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/key.pem
   sudo chown $USER:$USER ssl/*.pem
   ```

3. **Update nginx.conf** to enable HTTPS (uncomment HTTPS server block)

4. **Restart nginx:**
   ```bash
   docker-compose restart nginx
   ```

## Monitoring and Maintenance

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f mongodb
docker-compose logs -f nginx
```

### Backup Database
```bash
# Create backup
docker-compose exec mongodb mongodump --out /data/backup

# Copy backup from container
docker cp ekomart-mongodb:/data/backup ./backup-$(date +%Y%m%d)
```

### Restore Database
```bash
# Copy backup to container
docker cp ./backup-$(date +%Y%m%d) ekomart-mongodb:/data/restore

# Restore database
docker-compose exec mongodb mongorestore /data/restore
```

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

## Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   sudo netstat -tulpn | grep :80
   sudo kill -9 <PID>
   ```

2. **Permission denied:**
   ```bash
   sudo chown -R $USER:$USER .
   chmod +x deploy.sh
   ```

3. **MongoDB connection failed:**
   - Check if MongoDB container is running
   - Verify MONGODB_URI in .env file
   - Check MongoDB logs: `docker-compose logs mongodb`

4. **Email not sending:**
   - Verify SMTP credentials in .env
   - Check if Gmail app password is correct
   - Check email logs: `docker-compose logs app | grep -i email`

### Performance Optimization

1. **Enable Redis caching** (already configured)
2. **Configure MongoDB indexes** (already done in mongo-init.js)
3. **Use CDN for static assets**
4. **Enable gzip compression** (already configured in nginx)

## Security Considerations

1. **Change default passwords** in .env file
2. **Use strong secrets** for NEXTAUTH_SECRET and JWT_SECRET
3. **Enable HTTPS** in production
4. **Regular security updates:**
   ```bash
   docker-compose pull
   docker-compose up -d --build
   ```

## Scaling

For high traffic, consider:

1. **Horizontal scaling** with multiple app instances
2. **Load balancer** (HAProxy or Nginx)
3. **Database clustering** (MongoDB replica set)
4. **CDN** for static assets
5. **Redis clustering** for caching

## Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify environment variables
3. Check service status: `docker-compose ps`
4. Review this documentation

## File Structure

```
ekomart/
├── Dockerfile                 # Main application container
├── docker-compose.yml         # Development compose file
├── docker-compose.prod.yml    # Production compose file
├── nginx.conf                 # Nginx configuration
├── .dockerignore              # Docker ignore file
├── env.example                # Environment variables template
├── deploy.sh                  # Deployment script
├── scripts/
│   └── mongo-init.js          # MongoDB initialization
└── README-DEPLOYMENT.md       # This file
```
