const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

// Define User Schema (same as in your model)
const addressSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
})

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: { 
    type: String, 
    enum: ['user', 'admin'], 
    default: 'user' 
  },
  avatar: { 
    type: String,
    default: null
  },
  phone: { 
    type: String,
    trim: true
  },
  address: [addressSchema],
  isActive: { 
    type: Boolean, 
    default: true 
  },
  emailVerified: { 
    type: Boolean, 
    default: false 
  },
  lastLogin: { 
    type: Date 
  }
}, {
  timestamps: true
})

// Get or create User model
const User = mongoose.models.User || mongoose.model('User', userSchema)

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ekomart'
    await mongoose.connect(mongoURI)
    console.log('✅ MongoDB connected successfully')
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message)
    throw error
  }
}

// Admin user data
const adminUsers = [
  {
    name: 'Admin User',
    email: 'sundarbanshop.com@gmail.com',
    password: 'Admin@123456',
    role: 'admin',
    phone: '+1234567890',
    isActive: true,
    emailVerified: true
  },
  {
    name: 'Super Admin',
    email: 'superadmin@ekomart.com',
    password: 'SuperAdmin@123',
    role: 'admin',
    phone: '+1234567891',
    isActive: true,
    emailVerified: true
  }
]

// Seed admin users
const seedAdminUsers = async () => {
  try {
    console.log('🌱 Starting admin user seeding...')
    
    for (const adminData of adminUsers) {
      // Check if admin user already exists
      const existingUser = await User.findOne({ email: adminData.email })
      
      if (existingUser) {
        console.log(`⚠️  Admin user already exists: ${adminData.email}`)
        
        // Update password if user exists
        const salt = await bcrypt.genSalt(12)
        const hashedPassword = await bcrypt.hash(adminData.password, salt)
        
        await User.updateOne(
          { email: adminData.email },
          { 
            $set: { 
              password: hashedPassword,
              role: 'admin',
              isActive: true
            } 
          }
        )
        
        console.log(`✅ Admin user updated: ${adminData.email}`)
        console.log(`   Email: ${adminData.email}`)
        console.log(`   Password: ${adminData.password}`)
        console.log('')
      } else {
        // Hash password
        const salt = await bcrypt.genSalt(12)
        const hashedPassword = await bcrypt.hash(adminData.password, salt)
        
        // Create admin user
        const admin = await User.create({
          ...adminData,
          password: hashedPassword
        })
        
        console.log(`✅ Admin user created successfully!`)
        console.log(`   Email: ${admin.email}`)
        console.log(`   Password: ${adminData.password}`)
        console.log(`   Role: ${admin.role}`)
        console.log('')
      }
    }
    
    console.log('🎉 Admin user seeding completed!')
    console.log('')
    console.log('📋 Admin Login Credentials:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    adminUsers.forEach((admin) => {
      console.log(`Email: ${admin.email}`)
      console.log(`Password: ${admin.password}`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    })
    console.log('')
    console.log('🔗 Next Steps:')
    console.log('1. Visit: http://localhost:3000/auth/signin')
    console.log('2. Login with the credentials above')
    console.log('3. Access Admin Dashboard: http://localhost:3000/admin')
    console.log('4. ⚠️  IMPORTANT: Change your password after first login!')
    console.log('')
    
  } catch (error) {
    console.error('❌ Error seeding admin users:', error.message)
    throw error
  }
}

// Main function
const runSeed = async () => {
  try {
    // Connect to database
    await connectDB()
    
    // Seed admin users
    await seedAdminUsers()
    
    // Close connection
    await mongoose.connection.close()
    console.log('👋 Database connection closed')
    process.exit(0)
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

// Run the seed script
runSeed()
