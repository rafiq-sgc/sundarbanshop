import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import Order from '@/models/Order'

// GET /api/admin/products/stats - Get product statistics
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

    // Get overall product statistics
    const [
      totalProducts,
      activeProducts,
      inactiveProducts,
      featuredProducts,
      onSaleProducts,
      outOfStockProducts,
      lowStockProducts
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: false }),
      Product.countDocuments({ isFeatured: true }),
      Product.countDocuments({ isOnSale: true }),
      Product.countDocuments({ stock: 0 }),
      Product.countDocuments({ stock: { $gt: 0, $lte: 10 } })
    ])

    // Get category distribution
    const categoryDistribution = await Product.aggregate([
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: '$categoryInfo' },
      {
        $group: {
          _id: '$category',
          name: { $first: '$categoryInfo.name' },
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$price', '$stock'] } }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])

    // Get price statistics
    const priceStats = await Product.aggregate([
      {
        $group: {
          _id: null,
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          totalInventoryValue: { $sum: { $multiply: ['$price', '$stock'] } }
        }
      }
    ])

    // Get top selling products (from orders)
    const topSelling = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.total' }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $project: {
          _id: 1,
          name: '$productInfo.name',
          image: { $arrayElemAt: ['$productInfo.images', 0] },
          totalSold: 1,
          revenue: 1
        }
      }
    ])

    // Get recently added products
    const recentProducts = await Product.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name images price stock createdAt')
      .lean()

    // Get products needing attention
    const needsAttention = await Product.find({
      $or: [
        { stock: 0 },
        { stock: { $lte: 10 } },
        { images: { $size: 0 } },
        { description: { $exists: false } }
      ]
    })
      .sort({ stock: 1 })
      .limit(10)
      .select('name stock images description')
      .lean()

    return NextResponse.json({
      success: true,
      stats: {
        overview: {
          total: totalProducts,
          active: activeProducts,
          inactive: inactiveProducts,
          featured: featuredProducts,
          onSale: onSaleProducts,
          outOfStock: outOfStockProducts,
          lowStock: lowStockProducts
        },
        pricing: priceStats[0] || {
          avgPrice: 0,
          minPrice: 0,
          maxPrice: 0,
          totalInventoryValue: 0
        },
        categories: categoryDistribution,
        topSelling,
        recentProducts,
        needsAttention
      }
    })

  } catch (error: any) {
    console.error('Error fetching product stats:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch product statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

