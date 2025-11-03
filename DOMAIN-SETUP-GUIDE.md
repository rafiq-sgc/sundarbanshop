# Domain Setup Guide for Ekomart

This guide will help you configure your domain name to access your Ekomart application.

## Prerequisites

- A registered domain name
- Access to your domain's DNS settings
- Your server's public IP address
- Docker containers running successfully

## Step 1: Configure DNS Records

Log in to your domain registrar (e.g., GoDaddy, Namecheap, Cloudflare) and add the following DNS records:

### A Records

```
Type: A
Name: @
Value: YOUR_SERVER_IP
TTL: 3600 (or Auto)

Type: A
Name: www
Value: YOUR_SERVER_IP
TTL: 3600 (or Auto)
```

**Example:**
- If your domain is `ekomart.com` and your server IP is `192.168.1.100`
- Add an A record for `@` pointing to `192.168.1.100`
- Add an A record for `www` pointing to `192.168.1.100`

**Note:** DNS propagation can take 5 minutes to 48 hours. You can check the status using:
```bash
nslookup your-domain.com
dig your-domain.com
```

## Step 2: Update Nginx Configuration

1. Open `nginx.conf` in your editor

2. Replace `your-domain.com` with your actual domain name:

```nginx
server_name your-domain.com www.your-domain.com;
```

For example, if your domain is `ekomart.com`:
```nginx
server_name ekomart.com www.ekomart.com;
```

3. Save the file

## Step 3: Update Environment Variables

Update your `.env` file with the correct domain:

```env
NEXTAUTH_URL=http://your-domain.com
```

For HTTPS (after SSL setup):
```env
NEXTAUTH_URL=https://your-domain.com
```

## Step 4: Restart Docker Containers

```bash
cd /home/sgc/Rafiqul/projects/ekomart
docker compose down
docker compose up -d
```

## Step 5: Test HTTP Access

Open your browser and visit:
- `http://your-domain.com`
- `http://www.your-domain.com`

If you see your application, congratulations! HTTP is working.

## Step 6: Set Up SSL/HTTPS (Recommended for Production)

### Option A: Using Let's Encrypt (Free & Recommended)

1. Make the setup script executable:
```bash
chmod +x setup-ssl.sh
```

2. Stop nginx temporarily (certbot needs port 80):
```bash
docker compose stop nginx
```

3. Run the SSL setup script:
```bash
./setup-ssl.sh your-domain.com your-email@example.com
```

4. Or manually obtain certificates:
```bash
sudo certbot certonly --standalone \
  -d your-domain.com \
  -d www.your-domain.com \
  --email your-email@example.com \
  --agree-tos
```

5. Copy certificates to your project:
```bash
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./ssl/
sudo chown $USER:$USER ./ssl/*.pem
```

6. Update `nginx.conf`:
   - Uncomment the HTTPS server block (lines 150-254)
   - Replace `your-domain.com` with your actual domain
   - Uncomment the HTTP to HTTPS redirect (line 57)

7. Restart containers:
```bash
docker compose up -d
```

### Option B: Self-Signed Certificate (Testing Only)

**⚠️ WARNING: Only use this for testing! Browsers will show security warnings.**

```bash
mkdir -p ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/privkey.pem \
  -out ssl/fullchain.pem \
  -subj "/C=US/ST=State/L=City/O=YourOrg/CN=your-domain.com"
```

Then update `nginx.conf` as described above.

## Step 7: Auto-Renewal for Let's Encrypt (Production)

Let's Encrypt certificates expire every 90 days. Set up auto-renewal:

1. Create a renewal script:
```bash
cat > renew-ssl.sh << 'EOF'
#!/bin/bash
docker compose stop nginx
certbot renew
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./ssl/
cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./ssl/
docker compose start nginx
EOF

chmod +x renew-ssl.sh
```

2. Add to crontab (runs every Monday at 3 AM):
```bash
sudo crontab -e
```

Add this line:
```
0 3 * * 1 cd /home/sgc/Rafiqul/projects/ekomart && ./renew-ssl.sh >> /var/log/ssl-renewal.log 2>&1
```

## Troubleshooting

### Domain not accessible

1. Check DNS propagation:
```bash
nslookup your-domain.com
```

2. Check if containers are running:
```bash
docker compose ps
```

3. Check nginx logs:
```bash
docker compose logs nginx
```

### SSL Certificate Errors

1. Verify certificate files exist:
```bash
ls -la ssl/
```

2. Check nginx configuration:
```bash
docker compose exec nginx nginx -t
```

3. Check certificate expiration:
```bash
openssl x509 -in ssl/fullchain.pem -noout -dates
```

### Port Issues

Make sure ports 80 and 443 are open on your firewall:

```bash
# Ubuntu/Debian
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

### Check if ports are in use

```bash
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443
```

## Quick Reference Commands

```bash
# Check DNS
nslookup your-domain.com

# View container status
docker compose ps

# View logs
docker compose logs -f nginx
docker compose logs -f app

# Restart all containers
docker compose restart

# Rebuild and restart
docker compose down && docker compose up -d --build

# Test nginx configuration
docker compose exec nginx nginx -t

# Reload nginx without downtime
docker compose exec nginx nginx -s reload
```

## Security Checklist

- [ ] SSL/HTTPS enabled
- [ ] HTTP redirects to HTTPS
- [ ] Firewall configured (ports 80, 443 open)
- [ ] Strong passwords for admin accounts
- [ ] NEXTAUTH_SECRET is a strong random string
- [ ] JWT_SECRET is a strong random string
- [ ] Database credentials are secure
- [ ] Regular backups configured
- [ ] SSL certificate auto-renewal set up

## Example Complete Configuration

For domain: `ekomart.com`

**.env:**
```env
NEXTAUTH_URL=https://ekomart.com
NEXTAUTH_SECRET=your-super-secret-key-here
JWT_SECRET=another-super-secret-key-here
# ... other variables
```

**nginx.conf:**
```nginx
server_name ekomart.com www.ekomart.com;
```

**DNS Records:**
```
A     @      192.168.1.100
A     www    192.168.1.100
```

## Support

If you encounter issues:

1. Check the logs: `docker compose logs -f`
2. Verify DNS with: `nslookup your-domain.com`
3. Test nginx config: `docker compose exec nginx nginx -t`
4. Check firewall: `sudo ufw status`

Good luck! 🚀

