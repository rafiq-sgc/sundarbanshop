# Next.js Docker Deployment Package

A complete, production-ready deployment solution for Next.js applications with Docker, Nginx, SSL, and domain configuration.

## 📦 What's Included

This deployment package includes everything you need to deploy a Next.js application to production:

- ✅ **Docker Configuration** - Multi-stage Dockerfile for optimized builds
- ✅ **Docker Compose** - Complete service orchestration (App, Redis, Nginx)
- ✅ **Nginx Reverse Proxy** - Production-ready configuration with SSL
- ✅ **SSL Certificate Setup** - Automated Let's Encrypt integration
- ✅ **Domain Configuration** - DNS setup and verification
- ✅ **Deployment Scripts** - One-command deployment automation
- ✅ **Complete Documentation** - Detailed guides and quick reference

## 🚀 Quick Start

### Option 1: Automated Deployment (Recommended)

```bash
# Full setup with domain and SSL
./deploy.sh setup yourdomain.com your-email@example.com
```

That's it! The script handles everything automatically.

### Option 2: Manual Step-by-Step

```bash
# 1. Configure environment
cp .env.example .env
nano .env  # Edit your configuration

# 2. Build and deploy
docker compose up -d --build

# 3. Access via IP first
# http://YOUR_SERVER_IP

# 4. Configure DNS (see documentation)

# 5. Get SSL certificate (see documentation)
```

## 📚 Documentation

### For First-Time Deployment
👉 **[NEXTJS-DOCKER-DEPLOYMENT-GUIDE.md](./NEXTJS-DOCKER-DEPLOYMENT-GUIDE.md)**
- Complete step-by-step guide
- Prerequisites and setup
- Troubleshooting section
- Security best practices

### For Daily Operations
👉 **[QUICK-REFERENCE.md](./QUICK-REFERENCE.md)**
- Essential commands
- Common tasks
- Quick troubleshooting
- Emergency fixes

### Deployment Script
👉 **[deploy.sh](./deploy.sh)**
```bash
./deploy.sh help  # Show all available commands
```

## 🎯 Common Use Cases

### Deploy New Application
```bash
./deploy.sh setup example.com admin@example.com
```

### Update Existing Deployment
```bash
git pull
./deploy.sh deploy
```

### View Logs
```bash
./deploy.sh logs           # All services
./deploy.sh logs app       # Just the app
```

### Restart Services
```bash
./deploy.sh restart
```

### Check Status
```bash
./deploy.sh status
```

### Renew SSL Certificate
```bash
./deploy.sh ssl-renew example.com
```

## 🔧 Prerequisites

### Server Requirements
- Ubuntu/Debian Linux (20.04+ recommended)
- 2GB RAM minimum
- 1 CPU minimum
- 20GB disk space
- Root or sudo access

### Software (Auto-installed if missing)
- Docker & Docker Compose
- Certbot (for SSL certificates)
- Basic utilities (curl, git, openssl)

### Domain Requirements
- Registered domain name
- Access to DNS management
- Domain pointing to your server IP

## 📁 File Structure

```
your-project/
├── 📄 Dockerfile                          # Docker image configuration
├── 📄 docker-compose.yml                  # Services configuration
├── 📄 nginx.conf                          # Nginx reverse proxy config
├── 📄 .dockerignore                       # Docker build ignore rules
├── 📄 .env                                # Environment variables (create this)
├── 📄 .env.example                        # Environment template
├── 📁 ssl/                                # SSL certificates (auto-generated)
│   ├── fullchain.pem
│   └── privkey.pem
├── 📜 deploy.sh                           # Automated deployment script
├── 📜 setup-domain.sh                     # Domain configuration helper
├── 📜 setup-ssl.sh                        # SSL setup helper
├── 📜 check-dns.sh                        # DNS verification tool
├── 📖 NEXTJS-DOCKER-DEPLOYMENT-GUIDE.md  # Complete documentation
├── 📖 QUICK-REFERENCE.md                  # Command reference
├── 📖 DOMAIN-SETUP-GUIDE.md               # DNS/Domain guide
└── 📖 DEPLOYMENT-README.md                # This file
```

## ⚙️ Configuration

### Essential Environment Variables

Create `.env` file with:

```bash
# Application
NODE_ENV=production
PORT=3000

# Database (MongoDB example)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# Authentication
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-random-secret-32-chars
JWT_SECRET=another-random-secret-32-chars

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com
```

**Generate secure secrets:**
```bash
openssl rand -base64 32
```

## 🔒 Security Checklist

Before going to production:

- [ ] Strong secrets in `.env` (32+ characters)
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] HTTP redirects to HTTPS
- [ ] Firewall configured (ports 80, 443 open)
- [ ] `.env` file in `.gitignore`
- [ ] Regular backups configured
- [ ] SSL auto-renewal set up
- [ ] Monitoring/alerts configured
- [ ] Database secured (strong password, IP whitelist)
- [ ] Rate limiting enabled (included in nginx.conf)

## 🎓 Learning Path

### New to Docker Deployment?
1. Read [NEXTJS-DOCKER-DEPLOYMENT-GUIDE.md](./NEXTJS-DOCKER-DEPLOYMENT-GUIDE.md) (30 mins)
2. Follow the "Prerequisites" section
3. Do a test deployment on a development server
4. Use the automated script for production

### Experienced with Docker?
1. Check [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) (5 mins)
2. Review the Docker files (Dockerfile, docker-compose.yml)
3. Configure `.env` file
4. Run: `./deploy.sh setup yourdomain.com your-email@example.com`

## 🐛 Troubleshooting

### Quick Diagnostics
```bash
# Check if everything is running
./deploy.sh status

# View logs
./deploy.sh logs

# Test DNS
./deploy.sh check-dns yourdomain.com

# Test nginx config
docker compose exec nginx nginx -t
```

### Common Issues

**Container won't start:**
```bash
docker compose logs app
docker compose down && docker compose up -d --build
```

**SSL certificate errors:**
```bash
ls -la ssl/
# If missing, run: ./deploy.sh setup yourdomain.com email@example.com
```

**DNS not working:**
```bash
nslookup yourdomain.com
# Wait 5-30 minutes for propagation
# Check: https://dnschecker.org
```

For detailed troubleshooting, see the [Full Guide](./NEXTJS-DOCKER-DEPLOYMENT-GUIDE.md).

## 🔄 Update & Maintenance

### Regular Updates
```bash
# Pull latest code
git pull origin main

# Update and restart
./deploy.sh deploy

# Or with zero downtime
docker compose up -d --build --no-deps app
```

### SSL Certificate Renewal
```bash
# Manual renewal
./deploy.sh ssl-renew yourdomain.com

# Or set up automatic (recommended)
# See NEXTJS-DOCKER-DEPLOYMENT-GUIDE.md "Auto-Renewal Setup"
```

### Backups
```bash
# Create backup
./deploy.sh backup

# Backups saved to: ./backups/YYYYMMDD_HHMMSS/
```

## 📊 Monitoring

### Check Application Health
```bash
# Container status
./deploy.sh status

# Resource usage
docker stats

# Application logs
./deploy.sh logs app

# Access logs
./deploy.sh logs nginx
```

### External Monitoring (Recommended)
- **Uptime monitoring:** UptimeRobot, Pingdom
- **Error tracking:** Sentry
- **Performance:** New Relic, DataDog
- **Logs:** Papertrail, Loggly

## 💡 Tips & Best Practices

### Development
- Test locally first: `docker compose -f docker-compose.dev.yml up`
- Use environment-specific configs
- Keep dependencies updated

### Deployment
- Always use tagged versions in production
- Deploy during low-traffic periods
- Keep previous version for quick rollback
- Test after every deployment

### Security
- Never commit `.env` to git
- Rotate secrets periodically
- Keep Docker images updated
- Use strong database passwords
- Enable firewall on server
- Regular security audits

### Performance
- Enable CDN for static assets
- Use Redis for caching
- Optimize database queries
- Monitor resource usage
- Set up proper logging

## 🆘 Support & Resources

### Documentation
- [Complete Guide](./NEXTJS-DOCKER-DEPLOYMENT-GUIDE.md) - Full documentation
- [Quick Reference](./QUICK-REFERENCE.md) - Command cheat sheet
- [Domain Setup](./DOMAIN-SETUP-GUIDE.md) - DNS configuration

### External Resources
- [Next.js Docs](https://nextjs.org/docs/deployment)
- [Docker Documentation](https://docs.docker.com/)
- [Let's Encrypt](https://letsencrypt.org/)
- [Nginx Documentation](https://nginx.org/en/docs/)

### Getting Help
1. Check logs: `./deploy.sh logs`
2. Review [Troubleshooting](./NEXTJS-DOCKER-DEPLOYMENT-GUIDE.md#troubleshooting)
3. Search for error messages
4. Check Docker/Next.js community forums

## 📈 Success Metrics

After successful deployment, you should have:

- ✅ Application accessible via HTTPS
- ✅ Valid SSL certificate (no browser warnings)
- ✅ HTTP automatically redirects to HTTPS
- ✅ Proper error handling and logging
- ✅ Health checks passing
- ✅ Automated SSL renewal configured
- ✅ Regular backups scheduled
- ✅ Monitoring/alerts configured

## 🎉 You're Ready!

This deployment package has been battle-tested and is ready for production use. Follow the guides, use the automation scripts, and you'll have a secure, scalable Next.js application running in no time.

### Quick Deploy Now:
```bash
./deploy.sh setup yourdomain.com your-email@example.com
```

---

## 📝 Version History

- **v1.0.0** (2025) - Initial release
  - Complete Docker setup
  - Automated deployment scripts
  - SSL/Domain configuration
  - Comprehensive documentation

---

## 📄 License

This deployment package is provided as-is for use with your Next.js applications.

---

**Happy Deploying! 🚀**

For questions or issues, refer to the documentation or check the troubleshooting section.

_Remember: Always test on a development server before deploying to production!_

