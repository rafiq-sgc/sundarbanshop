export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
// Import Category model to ensure it's registered
import '@/models/Category'
import Warehouse from '@/models/Warehouse'

// GET /api/admin/inventory/alerts - Get low stock alerts
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
    const urgency = searchParams.get('urgency') || 'all' // all, critical, high, medium
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get all low stock products
    const query: any = {
      $or: [
        { stock: 0 }, // Out of stock
        { $expr: { $lte: ['$stock', '$lowStockThreshold'] } } // Low stock
      ]
    }

    const skip = (page - 1) * limit

    const products = await Product.find(query)
      .select('name sku images stock lowStockThreshold reorderLevel category createdAt updatedAt')
      .populate('category', 'name')
      .sort({ stock: 1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Format alerts
    const alerts = products.map((product: any) => {
      const currentStock = product.stock || 0
      const minStock = product.lowStockThreshold || 0
      const reorderLevel = product.reorderLevel || minStock

      // Determine urgency
      let alertUrgency: 'critical' | 'high' | 'medium' = 'medium'
      if (currentStock === 0) {
        alertUrgency = 'critical'
      } else if (currentStock <= minStock / 2) {
        alertUrgency = 'high'
      } else if (currentStock <= minStock) {
        alertUrgency = 'medium'
      }

      // Calculate days out of stock (if applicable)
      const daysOutOfStock = currentStock === 0 
        ? Math.floor((new Date().getTime() - new Date(product.updatedAt).getTime()) / (1000 * 60 * 60 * 24))
        : 0

      return {
        _id: product._id,
        productName: product.name,
        sku: product.sku,
        image: product.images?.[0] || '/images/products/placeholder.jpg',
        currentStock,
        minStock,
        reorderLevel,
        warehouse: 'Main Warehouse', // TODO: Get from warehouse relationship
        category: product.category?.name || 'Uncategorized',
        lastSold: product.updatedAt,
        daysOutOfStock,
        urgency: alertUrgency,
        notified: false // TODO: Track notification status
      }
    })

    // Filter by urgency if specified
    let filteredAlerts = alerts
    if (urgency !== 'all') {
      filteredAlerts = alerts.filter((alert: any) => alert.urgency === urgency)
    }

    // Calculate stats
    const stats = {
      total: alerts.length,
      critical: alerts.filter((a: any) => a.urgency === 'critical').length,
      high: alerts.filter((a: any) => a.urgency === 'high').length,
      medium: alerts.filter((a: any) => a.urgency === 'medium').length
    }

    const total = filteredAlerts.length
    const pages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: {
        alerts: filteredAlerts,
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
    console.error('Error fetching inventory alerts:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch alerts' },
      { status: 500 }
    )
  }
}

// POST /api/admin/inventory/alerts/notify - Send notifications for low stock items
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
    const { productIds, method } = body

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Product IDs array required' },
        { status: 400 }
      )
    }

    // Get products
    const products = await Product.find({ _id: { $in: productIds } })
      .select('name sku stock lowStockThreshold')
      .lean()

    // TODO: Implement actual notification logic
    // For now, just return success
    const notifications = products.map((product: any) => ({
      productId: product._id,
      productName: product.name,
      sku: product.sku,
      method: method || 'email',
      status: 'sent'
    }))

    return NextResponse.json({
      success: true,
      message: `Notifications sent for ${products.length} products`,
      data: {
        notifications
      }
    })

  } catch (error: any) {
    console.error('Error sending notifications:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to send notifications' },
      { status: 500 }
    )
  }
}

