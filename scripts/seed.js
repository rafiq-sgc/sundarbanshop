const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ekomart')
    console.log('MongoDB connected successfully')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  avatar: { type: String },
  phone: { type: String },
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: true }
}, { timestamps: true })

// Category Schema
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  image: { type: String },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true })

// Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  shortDescription: { type: String },
  price: { type: Number, required: true },
  comparePrice: { type: Number },
  costPrice: { type: Number },
  sku: { type: String, required: true, unique: true },
  barcode: { type: String },
  weight: { type: Number },
  images: [{ type: String }],
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  tags: [{ type: String }],
  stock: { type: Number, required: true, default: 0 },
  trackQuantity: { type: Boolean, default: true },
  allowBackorder: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isDigital: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  isOnSale: { type: Boolean, default: false },
  salePrice: { type: Number },
  saleStartDate: { type: Date },
  saleEndDate: { type: Date },
  metaTitle: { type: String },
  metaDescription: { type: String },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  reviewCount: { type: Number, min: 0, default: 0 }
}, { timestamps: true })

// Models
const User = mongoose.model('User', userSchema)
const Category = mongoose.model('Category', categorySchema)
const Product = mongoose.model('Product', productSchema)

// Seed data
const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({})
    await Category.deleteMany({})
    await Product.deleteMany({})

    console.log('Cleared existing data')

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12)
    const admin = new User({
      name: 'Admin User',
      email: 'sundarbanshop.com@gmail.com',
      password: hashedPassword,
      role: 'admin',
      phone: '+1234567890'
    })
    await admin.save()
    console.log('Created admin user')

    // Create test user
    const testUser = new User({
      name: 'John Doe',
      email: 'john@example.com',
      password: hashedPassword,
      role: 'user',
      phone: '+1234567891'
    })
    await testUser.save()
    console.log('Created test user')

    // Create categories
    const categories = [
      {
        name: 'Breakfast & Dairy',
        slug: 'breakfast-dairy',
        description: 'Fresh dairy products and breakfast items',
        sortOrder: 1
      },
      {
        name: 'Meats & Seafood',
        slug: 'meats-seafood',
        description: 'Fresh meats and seafood products',
        sortOrder: 2
      },
      {
        name: 'Breads & Bakery',
        slug: 'breads-bakery',
        description: 'Fresh breads and bakery items',
        sortOrder: 3
      },
      {
        name: 'Chips & Snacks',
        slug: 'chips-snacks',
        description: 'Chips, crackers, and snack foods',
        sortOrder: 4
      },
      {
        name: 'Medical Healthcare',
        slug: 'medical-healthcare',
        description: 'Health and medical products',
        sortOrder: 5
      },
      {
        name: 'Frozen Foods',
        slug: 'frozen-foods',
        description: 'Frozen food products',
        sortOrder: 6
      },
      {
        name: 'Grocery & Staples',
        slug: 'grocery-staples',
        description: 'Basic grocery and staple items',
        sortOrder: 7
      },
      {
        name: 'Other Items',
        slug: 'other-items',
        description: 'Miscellaneous items',
        sortOrder: 8
      }
    ]

    const createdCategories = []
    for (const categoryData of categories) {
      const category = new Category(categoryData)
      await category.save()
      createdCategories.push(category)
      console.log(`Created category: ${category.name}`)
    }

    // Create products
    const products = [
      {
        name: 'Fresh Organic Milk',
        slug: 'fresh-organic-milk',
        description: 'Premium organic milk from grass-fed cows',
        shortDescription: 'Fresh organic milk, 1 gallon',
        price: 4.99,
        comparePrice: 5.99,
        sku: 'MILK-001',
        images: ['/images/products/milk-1.jpg'],
        category: createdCategories[0]._id,
        tags: ['organic', 'dairy', 'fresh'],
        stock: 100,
        isFeatured: true,
        rating: 4.5,
        reviewCount: 128
      },
      {
        name: 'Free Range Eggs',
        slug: 'free-range-eggs',
        description: 'Fresh free-range eggs from happy hens',
        shortDescription: 'Dozen free-range eggs',
        price: 3.99,
        comparePrice: 4.99,
        sku: 'EGGS-001',
        images: ['/images/products/eggs-1.jpg'],
        category: createdCategories[0]._id,
        tags: ['organic', 'eggs', 'free-range'],
        stock: 50,
        isFeatured: true,
        rating: 4.8,
        reviewCount: 95
      },
      {
        name: 'Grass-Fed Beef Steak',
        slug: 'grass-fed-beef-steak',
        description: 'Premium grass-fed beef steak',
        shortDescription: '1 lb grass-fed beef steak',
        price: 12.99,
        comparePrice: 15.99,
        sku: 'BEEF-001',
        images: ['/images/products/beef-1.jpg'],
        category: createdCategories[1]._id,
        tags: ['beef', 'grass-fed', 'premium'],
        stock: 25,
        isOnSale: true,
        salePrice: 10.99,
        rating: 4.7,
        reviewCount: 67
      },
      {
        name: 'Fresh Salmon Fillet',
        slug: 'fresh-salmon-fillet',
        description: 'Fresh Atlantic salmon fillet',
        shortDescription: '1 lb fresh salmon fillet',
        price: 18.99,
        comparePrice: 22.99,
        sku: 'SALMON-001',
        images: ['/images/products/salmon-1.jpg'],
        category: createdCategories[1]._id,
        tags: ['salmon', 'seafood', 'fresh'],
        stock: 30,
        isFeatured: true,
        rating: 4.9,
        reviewCount: 142
      },
      {
        name: 'Artisan Sourdough Bread',
        slug: 'artisan-sourdough-bread',
        description: 'Handcrafted artisan sourdough bread',
        shortDescription: 'Fresh baked sourdough loaf',
        price: 6.99,
        comparePrice: 8.99,
        sku: 'BREAD-001',
        images: ['/images/products/bread-1.jpg'],
        category: createdCategories[2]._id,
        tags: ['bread', 'artisan', 'sourdough'],
        stock: 40,
        isFeatured: true,
        rating: 4.6,
        reviewCount: 89
      },
      {
        name: 'Organic Potato Chips',
        slug: 'organic-potato-chips',
        description: 'Crispy organic potato chips',
        shortDescription: '8 oz bag of organic chips',
        price: 4.49,
        comparePrice: 5.99,
        sku: 'CHIPS-001',
        images: ['/images/products/chips-1.jpg'],
        category: createdCategories[3]._id,
        tags: ['chips', 'organic', 'snacks'],
        stock: 75,
        isOnSale: true,
        salePrice: 3.99,
        rating: 4.3,
        reviewCount: 156
      },
      {
        name: 'Vitamin C Supplements',
        slug: 'vitamin-c-supplements',
        description: 'High-quality vitamin C supplements',
        shortDescription: '100 tablets vitamin C',
        price: 9.99,
        comparePrice: 12.99,
        sku: 'VITAMIN-001',
        images: ['/images/products/vitamin-1.jpg'],
        category: createdCategories[4]._id,
        tags: ['vitamin', 'health', 'supplements'],
        stock: 60,
        isFeatured: true,
        rating: 4.4,
        reviewCount: 203
      },
      {
        name: 'Frozen Mixed Berries',
        slug: 'frozen-mixed-berries',
        description: 'Frozen mixed berries for smoothies',
        shortDescription: '2 lb bag frozen berries',
        price: 7.99,
        comparePrice: 9.99,
        sku: 'BERRIES-001',
        images: ['/images/products/berries-1.jpg'],
        category: createdCategories[5]._id,
        tags: ['frozen', 'berries', 'smoothies'],
        stock: 35,
        isOnSale: true,
        salePrice: 6.99,
        rating: 4.5,
        reviewCount: 78
      },
      {
        name: 'Organic Quinoa',
        slug: 'organic-quinoa',
        description: 'Premium organic quinoa grain',
        shortDescription: '2 lb bag organic quinoa',
        price: 8.99,
        comparePrice: 11.99,
        sku: 'QUINOA-001',
        images: ['/images/products/quinoa-1.jpg'],
        category: createdCategories[6]._id,
        tags: ['quinoa', 'organic', 'grain'],
        stock: 45,
        isFeatured: true,
        rating: 4.7,
        reviewCount: 134
      },
      {
        name: 'Extra Virgin Olive Oil',
        slug: 'extra-virgin-olive-oil',
        description: 'Premium extra virgin olive oil',
        shortDescription: '500ml bottle olive oil',
        price: 11.99,
        comparePrice: 14.99,
        sku: 'OIL-001',
        images: ['/images/products/oil-1.jpg'],
        category: createdCategories[6]._id,
        tags: ['olive oil', 'cooking', 'premium'],
        stock: 55,
        isFeatured: true,
        rating: 4.8,
        reviewCount: 167
      }
    ]

    for (const productData of products) {
      const product = new Product(productData)
      await product.save()
      console.log(`Created product: ${product.name}`)
    }

    console.log('Database seeded successfully!')
    console.log(`Created ${await User.countDocuments()} users`)
    console.log(`Created ${await Category.countDocuments()} categories`)
    console.log(`Created ${await Product.countDocuments()} products`)

  } catch (error) {
    console.error('Seeding error:', error)
  } finally {
    mongoose.connection.close()
  }
}

// Run the seed function
const runSeed = async () => {
  await connectDB()
  await seedData()
}

runSeed()
