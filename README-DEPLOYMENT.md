# Ekomart E-commerce Deployment Guide

This guide will help you deploy the Ekomart e-commerce application on Digital Ocean using Docker with MongoDB Atlas.

## Prerequisites

- Digital Ocean Droplet (Ubuntu 20.04+ recommended)
- Docker and Docker Compose installed
- MongoDB Atlas account and cluster
- Domain name (optional but recommended)
- SSL certificate (for production)

## Quick Start

1. **Clone the repository on your Digital Ocean droplet:**
   ```bash
   git clone <your-repository-url>
   cd ekomart
   ```

2. **Set up MongoDB Atlas:**
   - Create a MongoDB Atlas account at [mongodb.com/atlas](https://mongodb.com/atlas)
   - Create a new cluster (free tier available)
   - Create a database user with read/write permissions
   - Whitelist your server's IP address
   - Get your connection string

3. **Configure environment variables:**
   ```bash
   cp env.example .env
   nano .env
   ```

4. **Update the .env file with your configuration:**
   ```bash
   # MongoDB Atlas Configuration
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

   # NextAuth Configuration
   NEXTAUTH_URL=https://your-domain.com
   NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production

   # Email Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password

   # JWT Secret
   JWT_SECRET=your-jwt-secret-key-change-this-in-production

   # Payment Configuration (optional)
   STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
   ```

5. **Deploy the application:**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

## Detailed Setup

### 1. Server Setup

**Install Docker and Docker Compose:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again to apply group changes
```

### 2. MongoDB Atlas Setup

1. **Create MongoDB Atlas Account:**
   - Go to [mongodb.com/atlas](https://mongodb.com/atlas)
   - Sign up for a free account
   - Create a new project

2. **Create a Cluster:**
   - Choose "Build a Database"
   - Select "M0 Sandbox" (free tier)
   - Choose a cloud provider and region
   - Name your cluster (e.g., "ekomart-cluster")

3. **Configure Database Access:**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Create a user with username and password
   - Set privileges to "Read and write to any database"

4. **Configure Network Access:**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Add your server's IP address or use "0.0.0.0/0" for all IPs (less secure)

5. **Get Connection String:**
   - Go to "Database"
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with your database name

### 3. Environment Configuration

**Required Environment Variables:**
```bash
# MongoDB Atlas (REQUIRED)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# NextAuth (REQUIRED)
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production

# JWT Secret (REQUIRED)
JWT_SECRET=your-jwt-secret-key-change-this-in-production

# Email (REQUIRED for order notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Payment (OPTIONAL)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
```

**Generate Secure Secrets:**
```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate JWT_SECRET
openssl rand -base64 32
```

### 4. SSL Certificate Setup (Production)

**Using Let's Encrypt:**
```bash
# Install Certbot
sudo apt install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates to project
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./ssl/key.pem
sudo chown $USER:$USER ./ssl/*.pem
```

**Update nginx.conf for HTTPS:**
- Uncomment the HTTPS server block
- Update server_name with your domain
- Ensure SSL certificate paths are correct

### 5. Deployment

**Run the deployment script:**
```bash
./deploy.sh
```

**Manual deployment:**
```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up -d --build

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## Service Architecture

The production setup includes:

- **Next.js App**: Main application server
- **Redis**: Caching and session storage
- **Nginx**: Reverse proxy and load balancer
- **MongoDB Atlas**: Cloud-hosted database (no local container)

## Monitoring and Maintenance

**Check Application Health:**
```bash
curl http://your-domain.com/health
```

**View Logs:**
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f app
```

**Update Application:**
```bash
git pull
./deploy.sh
```

**Backup Data:**
- MongoDB Atlas provides automatic backups
- For file uploads, backup the `public/uploads` directory

## Troubleshooting

**Common Issues:**

1. **MongoDB Connection Failed:**
   - Check your MongoDB Atlas connection string
   - Ensure your server IP is whitelisted
   - Verify database user credentials

2. **Application Won't Start:**
   - Check logs: `docker-compose -f docker-compose.prod.yml logs`
   - Verify all environment variables are set
   - Ensure ports 80 and 443 are open

3. **SSL Certificate Issues:**
   - Verify certificate files exist in `./ssl/`
   - Check nginx configuration
   - Ensure domain points to your server

4. **Email Not Working:**
   - Verify SMTP credentials
   - Check if 2FA is enabled (use app password for Gmail)
   - Test SMTP connection

**Useful Commands:**
```bash
# Restart specific service
docker-compose -f docker-compose.prod.yml restart app

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Stop all services
docker-compose -f docker-compose.prod.yml down

# Remove all containers and volumes
docker-compose -f docker-compose.prod.yml down -v
```

## Security Considerations

1. **Environment Variables:**
   - Never commit `.env` file to version control
   - Use strong, unique secrets
   - Rotate secrets regularly

2. **MongoDB Atlas:**
   - Use strong database passwords
   - Whitelist only necessary IP addresses
   - Enable MongoDB Atlas monitoring

3. **Server Security:**
   - Keep system updated
   - Use SSH keys instead of passwords
   - Configure firewall rules
   - Enable fail2ban

4. **Application Security:**
   - Use HTTPS in production
   - Implement rate limiting
   - Regular security updates
   - Monitor logs for suspicious activity

## Performance Optimization

1. **MongoDB Atlas:**
   - Use appropriate cluster size
   - Enable connection pooling
   - Monitor query performance

2. **Redis:**
   - Configure memory limits
   - Use appropriate eviction policies
   - Monitor memory usage

3. **Nginx:**
   - Enable gzip compression
   - Configure caching headers
   - Use CDN for static assets

4. **Application:**
   - Enable Next.js production optimizations
   - Use image optimization
   - Implement proper caching strategies

## Support

For issues and questions:
- Check the logs first
- Review this documentation
- Check MongoDB Atlas status
- Verify environment configuration

---

**Note:** This deployment uses MongoDB Atlas (cloud-hosted) instead of a local MongoDB container, which provides better reliability, automatic backups, and easier scaling.