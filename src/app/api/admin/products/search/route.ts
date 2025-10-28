import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'

// GET /api/admin/products/search - Advanced product search with autocomplete
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

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    // Search in multiple fields with text index
    const products = await Product.find(
      {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { sku: { $regex: query, $options: 'i' } },
          { barcode: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ],
        isActive: true
      },
      {
        name: 1,
        slug: 1,
        sku: 1,
        price: 1,
        images: { $slice: 1 },
        stock: 1,
        category: 1
      }
    )
      .populate('category', 'name')
      .limit(limit)
      .lean()

    return NextResponse.json({
      success: true,
      data: products,
      count: products.length
    })

  } catch (error: any) {
    console.error('Error searching products:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Search failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

