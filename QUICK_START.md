# 🚀 Quick Start Guide - Admin Access

## ⚡ Super Fast Setup (2 Minutes)

### Step 1: Start MongoDB (if not running)
```bash
sudo systemctl start mongod
```

### Step 2: Create Admin Account
```bash
npm run seed:admin
```

### Step 3: Login
1. Open: http://localhost:3000/auth/signin
2. Use these credentials:
   - **Email**: `admin@ekomart.com`
   - **Password**: `Admin@123456`

### Step 4: Access Admin Dashboard
After login, you'll be automatically redirected to: http://localhost:3000/admin

---

## 📋 Default Admin Accounts

### Primary Admin
- **Email**: admin@ekomart.com
- **Password**: Admin@123456
- **Access**: Full admin access

### Super Admin
- **Email**: superadmin@ekomart.com
- **Password**: SuperAdmin@123
- **Access**: Full admin access

---

## 🔧 Troubleshooting

### Problem: Can't login / Invalid credentials

**Solution 1: Re-run the admin seed**
```bash
npm run seed:admin
```

**Solution 2: Check MongoDB is running**
```bash
sudo systemctl status mongod
```

**Solution 3: Check database connection**
```bash
mongosh
use ekomart
db.users.find({ email: "admin@ekomart.com" })
```

### Problem: MongoDB not installed

**Ubuntu/Debian:**
```bash
# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

---

## 📍 Important URLs

- **Homepage**: http://localhost:3000
- **Shop Page**: http://localhost:3000/shop
- **Login**: http://localhost:3000/auth/signin
- **Signup**: http://localhost:3000/auth/signup
- **Admin Dashboard**: http://localhost:3000/admin
- **Admin Products**: http://localhost:3000/admin/products
- **Admin Orders**: http://localhost:3000/admin/orders
- **User Dashboard**: http://localhost:3000/dashboard

---

## 🎯 Testing Checklist

- [ ] MongoDB is running
- [ ] Run `npm run seed:admin`
- [ ] Visit login page
- [ ] Login with admin credentials
- [ ] See admin dashboard
- [ ] Can access admin features
- [ ] Change default password

---

## 🔐 Security Reminder

⚠️ **IMPORTANT**: After first login, immediately change your password from the default!

The default passwords are:
- Publicly visible in this documentation
- Should NEVER be used in production
- Must be changed immediately

---

## 💡 Pro Tips

1. **Bookmark the admin dashboard** for quick access
2. **Use a password manager** to store your new password
3. **Enable 2FA** when available (coming soon)
4. **Regularly backup your database**
5. **Keep admin credentials secure**

---

## 📞 Need Help?

Check the detailed guide: `ADMIN_ACCESS_GUIDE.md`

Or run:
```bash
cat ADMIN_ACCESS_GUIDE.md
```

---

**That's it! You're ready to manage your ecommerce store! 🎉**
