# Next.js Docker Deployment - Quick Reference Card

## 🚀 One-Command Deployment

```bash
./deploy.sh setup yourdomain.com your-email@example.com
```

---

## 📋 Essential Commands

### Deployment
```bash
./deploy.sh deploy              # Deploy/Update application
./deploy.sh restart             # Restart all services
./deploy.sh start               # Start services
./deploy.sh stop                # Stop services
```

### Monitoring
```bash
./deploy.sh status              # Check container status
./deploy.sh logs                # View all logs
./deploy.sh logs app            # View app logs only
./deploy.sh logs nginx          # View nginx logs only
```

### DNS & SSL
```bash
./deploy.sh check-dns example.com     # Verify DNS configuration
./deploy.sh ssl-renew example.com     # Renew SSL certificate
```

### Maintenance
```bash
./deploy.sh backup              # Create backup
./deploy.sh clean               # Clean unused Docker resources
```

---

## 🔧 Manual Docker Commands

### Basic Operations
```bash
docker compose up -d            # Start in background
docker compose down             # Stop and remove containers
docker compose restart          # Restart all services
docker compose ps               # List containers
docker compose logs -f          # Follow logs
```

### Building
```bash
docker compose build            # Build images
docker compose up -d --build    # Build and start
docker compose build --no-cache # Build without cache
```

### Troubleshooting
```bash
docker compose logs app --tail=100        # Last 100 log lines
docker compose exec app sh                # Enter app container
docker compose exec nginx nginx -t        # Test nginx config
docker stats                              # Resource usage
```

---

## 🌐 DNS Configuration

**Your Server IP:** Run `curl -4 ifconfig.me`

**Add these A records at your domain registrar:**
```
Type: A    Name: @      Value: YOUR_SERVER_IP
Type: A    Name: www    Value: YOUR_SERVER_IP
```

**Verify DNS:**
```bash
nslookup yourdomain.com
dig yourdomain.com +short
```

---

## 🔒 SSL Certificate Setup

### Let's Encrypt (Production)
```bash
# Stop nginx
docker compose stop nginx

# Get certificate
sudo certbot certonly --standalone \
  -d yourdomain.com \
  -d www.yourdomain.com \
  --email your-email@example.com \
  --agree-tos

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./ssl/
sudo chown $USER:$USER ./ssl/*.pem

# Start nginx
docker compose start nginx
```

### Self-Signed (Testing)
```bash
mkdir -p ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/privkey.pem -out ssl/fullchain.pem \
  -subj "/C=US/ST=State/L=City/O=Org/CN=yourdomain.com"
```

### Auto-Renewal
```bash
# Add to crontab
0 3 * * 1 ./deploy.sh ssl-renew yourdomain.com >> /var/log/ssl-renewal.log 2>&1
```

---

## 📁 File Structure

```
project/
├── Dockerfile                          # Docker build configuration
├── docker-compose.yml                  # Services configuration
├── nginx.conf                          # Nginx configuration
├── .env                                # Environment variables
├── .dockerignore                       # Docker ignore file
├── ssl/                                # SSL certificates
│   ├── fullchain.pem
│   └── privkey.pem
├── deploy.sh                           # Deployment script
├── NEXTJS-DOCKER-DEPLOYMENT-GUIDE.md  # Full documentation
└── QUICK-REFERENCE.md                 # This file
```

---

## 🔐 Environment Variables Template

```bash
# Application
NODE_ENV=production
PORT=3000

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# Authentication
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=generate-random-32-char-string
JWT_SECRET=generate-random-32-char-string

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com
```

**Generate secrets:**
```bash
openssl rand -base64 32
```

---

## 🐛 Common Issues & Fixes

### Container won't start
```bash
docker compose logs app              # Check logs
docker compose down && docker compose up -d --build
```

### Port already in use
```bash
sudo netstat -tulpn | grep :3000     # Find process
sudo kill -9 <PID>                   # Kill process
```

### SSL certificate errors
```bash
docker compose exec nginx nginx -t   # Test config
ls -la ssl/                          # Check cert files
docker compose restart nginx         # Restart nginx
```

### Database connection failed
```bash
# Test MongoDB connection
docker compose exec app node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ Connected'))
  .catch(err => console.error('✗ Error:', err));
"
```

### DNS not resolving
```bash
nslookup yourdomain.com              # Check DNS
dig yourdomain.com +short            # Alternative check
# Wait 5-30 mins for propagation
# Check: https://dnschecker.org
```

### Build fails
```bash
docker compose build --no-cache      # Clear cache
docker system prune -a               # Clean everything
```

---

## 🔥 Emergency Commands

### Complete Reset
```bash
docker compose down -v               # Stop and remove volumes
docker system prune -a -f            # Clean everything
rm -rf .next node_modules            # Clear build files
npm install                          # Reinstall
docker compose up -d --build         # Fresh start
```

### View All Environment Variables
```bash
docker compose config                # Show merged config
docker compose exec app env          # View container env
```

### Disk Space Issues
```bash
df -h                                # Check disk usage
docker system df                     # Docker disk usage
docker system prune -a --volumes     # Free up space
```

---

## 📊 Monitoring & Health Checks

### Check Application Health
```bash
curl http://localhost:3000/api/health    # Health endpoint
curl -I https://yourdomain.com           # Check HTTPS
```

### Resource Usage
```bash
docker stats                         # Real-time stats
docker compose top                   # Process list
htop                                 # System resources
```

### Database Status
```bash
docker compose exec app mongosh "$MONGODB_URI" --eval "db.adminCommand('ping')"
```

---

## 🔄 Update Workflow

```bash
# 1. Pull latest code
git pull origin main

# 2. Stop services
docker compose down

# 3. Backup (optional)
./deploy.sh backup

# 4. Update and restart
docker compose up -d --build

# 5. Check logs
docker compose logs -f
```

---

## 📞 Support & Resources

- **Full Documentation:** `NEXTJS-DOCKER-DEPLOYMENT-GUIDE.md`
- **Deployment Script:** `./deploy.sh help`
- **Next.js Docs:** https://nextjs.org/docs
- **Docker Docs:** https://docs.docker.com
- **Let's Encrypt:** https://letsencrypt.org

---

## ⚡ Quick Tips

1. **Always check logs first:** `docker compose logs -f`
2. **DNS takes time:** Wait 5-30 minutes after DNS changes
3. **SSL renewal:** Set up automatic renewal with cron
4. **Backups:** Regular backups of `.env` and database
5. **Security:** Keep secrets in `.env`, never in git
6. **Updates:** Regularly update Docker images and packages
7. **Monitoring:** Set up uptime monitoring (UptimeRobot, etc.)

---

**Last Updated:** 2025  
**Version:** 1.0.0

For detailed step-by-step instructions, see `NEXTJS-DOCKER-DEPLOYMENT-GUIDE.md`

