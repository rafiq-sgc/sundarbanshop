#!/bin/bash

# Ekomart Ecommerce Setup Script
echo "🚀 Setting up Ekomart Ecommerce Application..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if MongoDB is running
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB is not installed. Please install MongoDB first."
    echo "   Visit: https://docs.mongodb.com/manual/installation/"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create environment file if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating environment file..."
    cat > .env.local << EOF
# Database
MONGODB_URI=mongodb://localhost:27017/ekomart

# NextAuth
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000

# JWT
JWT_SECRET=$(openssl rand -base64 32)

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Ekomart

# Google OAuth (Optional)
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret
EOF
    echo "✅ Environment file created"
else
    echo "✅ Environment file already exists"
fi

# Start MongoDB if not running
echo "🗄️  Checking MongoDB connection..."
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB:"
    echo "   sudo systemctl start mongod"
    echo "   or"
    echo "   brew services start mongodb/brew/mongodb-community"
    echo ""
    echo "   Then run this script again."
    exit 1
fi

echo "✅ MongoDB is running"

# Seed the database
echo "🌱 Seeding database with sample data..."
npm run seed

if [ $? -ne 0 ]; then
    echo "❌ Failed to seed database"
    exit 1
fi

echo "✅ Database seeded successfully"

# Build the application
echo "🔨 Building the application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Failed to build application"
    exit 1
fi

echo "✅ Application built successfully"

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Start the development server: npm run dev"
echo "2. Open http://localhost:3000 in your browser"
echo "3. Admin credentials:"
echo "   Email: sundarbanshop.com@gmail.com"
echo "   Password: admin123"
echo "4. Test user credentials:"
echo "   Email: john@example.com"
echo "   Password: admin123"
echo ""
echo "🔗 Useful links:"
echo "   - Homepage: http://localhost:3000"
echo "   - Shop: http://localhost:3000/shop"
echo "   - Admin Dashboard: http://localhost:3000/admin"
echo "   - User Dashboard: http://localhost:3000/dashboard"
echo ""
echo "📚 Documentation: README.md"
echo "🐛 Issues: Create an issue on GitHub"
echo ""
echo "Happy coding! 🚀"
