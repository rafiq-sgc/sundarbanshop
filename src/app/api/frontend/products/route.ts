import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import Category from '@/models/Category'

// GET - Get all products (PUBLIC - No authentication required)
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const sort = searchParams.get('sort') || '-createdAt'
    const category = searchParams.get('category')
    const featured = searchParams.get('featured')
    const search = searchParams.get('search')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const onSale = searchParams.get('onSale')

    // Build query
    const query: any = { isActive: true } // Only show active products

    if (category) {
      // Find category by slug first
      const categoryDoc = await Category.findOne({ slug: category, isActive: true })
      if (categoryDoc) {
        query.category = categoryDoc._id
      } else {
        // If category not found, return empty results
        return NextResponse.json({
          success: true,
          data: [],
          count: 0,
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0,
            hasNext: false,
            hasPrev: false
          }
        })
      }
    }

    if (featured === 'true') {
      query.isFeatured = true
    }

    if (onSale === 'true') {
      query.isOnSale = true
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ]
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {}
      if (minPrice) query.price.$gte = parseFloat(minPrice)
      if (maxPrice) query.price.$lte = parseFloat(maxPrice)
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get total count for pagination
    const total = await Product.countDocuments(query)

    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-__v')

    const pages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: products,
      count: products.length,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

