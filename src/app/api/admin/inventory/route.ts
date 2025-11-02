export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
// Import Category model to ensure it's registered
import '@/models/Category'
import Warehouse from '@/models/Warehouse'

// GET /api/admin/inventory - Get all inventory items with stock levels
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all' // all, in_stock, low_stock, out_of_stock
    const warehouse = searchParams.get('warehouse') || ''

    // Build query
    const query: any = {}

    // Search by product name or SKU
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ]
    }

    // Filter by status
    if (status === 'low_stock') {
      query.$expr = { $lte: ['$stock', '$lowStockThreshold'] }
    } else if (status === 'out_of_stock') {
      query.stock = 0
    } else if (status === 'in_stock') {
      query.$expr = { $gt: ['$stock', '$lowStockThreshold'] }
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get products with pagination
    const [products, total] = await Promise.all([
      Product.find(query)
        .select('name sku images stock lowStockThreshold reorderLevel maxStock price category isActive lastRestockedAt')
        .populate('category', 'name')
        .sort({ stock: 1 }) // Sort by stock level (ascending)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query)
    ])

    // Calculate stats
    const [
      totalProducts,
      inStockCount,
      lowStockCount,
      outOfStockCount,
      totalStockValue
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ $expr: { $gt: ['$stock', '$lowStockThreshold'] } }),
      Product.countDocuments({ $expr: { $lte: ['$stock', '$lowStockThreshold'] }, stock: { $gt: 0 } }),
      Product.countDocuments({ stock: 0 }),
      Product.aggregate([
        { $match: { stock: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$stock', '$price'] } } } }
      ])
    ])

    // Format inventory items
    const inventory = products.map((product: any) => {
      const currentStock = product.stock || 0
      const minStock = product.lowStockThreshold || 0
      const reorderLevel = product.reorderLevel || minStock
      const maxStock = product.maxStock || minStock * 5

      let itemStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock'
      if (currentStock === 0) {
        itemStatus = 'out_of_stock'
      } else if (currentStock <= minStock) {
        itemStatus = 'low_stock'
      }

      return {
        _id: product._id,
        productName: product.name,
        sku: product.sku,
        image: product.images?.[0] || '/images/products/placeholder.jpg',
        currentStock,
        minStock,
        maxStock,
        reorderLevel,
        status: itemStatus,
        lastRestocked: product.lastRestockedAt || product.createdAt,
        category: product.category?.name || 'Uncategorized',
        price: product.price,
        stockValue: currentStock * product.price
      }
    })

    // Calculate pages
    const pages = Math.ceil(total / limit)

    // Stats
    const stats = {
      totalItems: totalProducts,
      inStock: inStockCount,
      lowStock: lowStockCount,
      outOfStock: outOfStockCount,
      totalValue: totalStockValue[0]?.total || 0
    }

    return NextResponse.json({
      success: true,
      data: {
        inventory,
        stats,
        pagination: {
          page,
          limit,
          total,
          pages,
          hasNext: page < pages,
          hasPrev: page > 1
        }
      }
    })

  } catch (error: any) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}

// POST /api/admin/inventory - Bulk update inventory
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const body = await request.json()
    const { action, items } = body

    if (!action || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, message: 'Invalid request. Action and items array required.' },
        { status: 400 }
      )
    }

    let result: any = {}

    switch (action) {
      case 'adjust_stock':
        // Bulk stock adjustment
        const adjustResults = await Promise.all(
          items.map(async (item: any) => {
            const product = await Product.findById(item.productId)
            if (!product) {
              return { productId: item.productId, success: false, message: 'Product not found' }
            }

            if (item.operation === 'add') {
              product.stock += item.quantity
            } else if (item.operation === 'subtract') {
              product.stock = Math.max(0, product.stock - item.quantity)
            } else if (item.operation === 'set') {
              product.stock = item.quantity
            }

            product.lastRestockedAt = new Date()
            await product.save()

            return { productId: item.productId, success: true, newStock: product.stock }
          })
        )

        result = { adjustments: adjustResults }
        break

      case 'reorder':
        // Create reorder notifications (placeholder for now)
        result = { 
          message: 'Reorder requests created',
          items: items.map((item: any) => item.productId)
        }
        break

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message: 'Bulk operation completed',
      data: result
    })

  } catch (error: any) {
    console.error('Error in bulk inventory operation:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to perform bulk operation' },
      { status: 500 }
    )
  }
}

