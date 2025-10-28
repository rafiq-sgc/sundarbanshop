import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import Category from '@/models/Category'
import ActivityLog from '@/models/ActivityLog'
import { productSchema } from '@/lib/validations/product'
import { ZodError } from 'zod'

// GET /api/admin/products - List all products with pagination, search, and filters
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    await connectDB()

    // Extract query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || '' // active, inactive, all
    const featured = searchParams.get('featured') || '' // true, false, all
    const onSale = searchParams.get('onSale') || '' // true, false, all
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const minStock = searchParams.get('minStock')
    const maxStock = searchParams.get('maxStock')

    // Build filter query
    const filter: any = {}

    // Search in name, description, sku
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ]
    }

    // Category filter
    if (category && category !== 'all') {
      filter.category = category
    }

    // Status filter
    if (status === 'active') {
      filter.isActive = true
    } else if (status === 'inactive') {
      filter.isActive = false
    }

    // Featured filter
    if (featured === 'true') {
      filter.isFeatured = true
    } else if (featured === 'false') {
      filter.isFeatured = false
    }

    // On Sale filter
    if (onSale === 'true') {
      filter.isOnSale = true
    } else if (onSale === 'false') {
      filter.isOnSale = false
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {}
      if (minPrice) filter.price.$gte = parseFloat(minPrice)
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice)
    }

    // Stock range filter
    if (minStock || maxStock) {
      filter.stock = {}
      if (minStock) filter.stock.$gte = parseInt(minStock)
      if (maxStock) filter.stock.$lte = parseInt(maxStock)
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Build sort object
    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    // Execute query with pagination
    const [products, totalCount] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter)
    ])

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    // Get category counts for filtering
    const categoryStats = await Product.aggregate([
      { $match: filter },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ])

    // Get stock statistics
    const stockStats = await Product.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          inStock: { $sum: { $cond: [{ $gt: ['$stock', 0] }, 1, 0] } },
          outOfStock: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } },
          lowStock: { $sum: { $cond: [{ $and: [{ $gt: ['$stock', 0] }, { $lt: ['$stock', 10] }] }, 1, 0] } }
        }
      }
    ])

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      stats: {
        categories: categoryStats,
        stock: stockStats[0] || { inStock: 0, outOfStock: 0, lowStock: 0 }
      }
    })

  } catch (error: any) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch products',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// POST /api/admin/products - Create new product
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    await connectDB()

    const body = await request.json()

    // Validate with Zod schema
    try {
      productSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))
        return NextResponse.json(
          { 
            success: false, 
            message: 'Validation failed',
            errors 
          },
          { status: 400 }
        )
      }
    }

    // Check if slug already exists
    const existingSlug = await Product.findOne({ slug: body.slug })
    if (existingSlug) {
      return NextResponse.json(
        { success: false, message: 'Product with this slug already exists' },
        { status: 400 }
      )
    }

    // Check if SKU already exists
    const existingSKU = await Product.findOne({ sku: body.sku })
    if (existingSKU) {
      return NextResponse.json(
        { success: false, message: 'Product with this SKU already exists' },
        { status: 400 }
      )
    }

    // Verify category exists
    const categoryExists = await Category.findById(body.category)
    if (!categoryExists) {
      return NextResponse.json(
        { success: false, message: 'Invalid category ID' },
        { status: 400 }
      )
    }

    // Validate images array
    if (!body.images || !Array.isArray(body.images) || body.images.length === 0) {
      return NextResponse.json(
        { success: false, message: 'At least one product image is required' },
        { status: 400 }
      )
    }

    // Validate price values
    if (body.price < 0) {
      return NextResponse.json(
        { success: false, message: 'Price cannot be negative' },
        { status: 400 }
      )
    }

    if (body.comparePrice && body.comparePrice < body.price) {
      return NextResponse.json(
        { success: false, message: 'Compare price must be greater than regular price' },
        { status: 400 }
      )
    }

    if (body.salePrice && body.salePrice >= body.price) {
      return NextResponse.json(
        { success: false, message: 'Sale price must be less than regular price' },
        { status: 400 }
      )
    }

    // Create product
    const product = await Product.create({
      ...body,
      rating: 0,
      reviewCount: 0
    })

    // Populate category before returning
    await product.populate('category', 'name slug')

    // Log activity
    await ActivityLog.create({
      user: session.user.id,
      action: 'CREATE',
      entity: 'Product',
      entityId: product._id,
      description: `Created product: ${product.name}`,
      metadata: {
        productName: product.name,
        sku: product.sku
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      data: product
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error creating product:', error)
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.issues).map((err: any) => err.message)
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation failed',
          errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create product',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
