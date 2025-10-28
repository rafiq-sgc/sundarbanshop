import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Warehouse from '@/models/Warehouse'
import Product from '@/models/Product'

// GET /api/admin/inventory/low-stock - Get low stock alerts across all warehouses
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const warehouseId = searchParams.get('warehouseId')
    const criticalOnly = searchParams.get('critical') === 'true'
    const outOfStock = searchParams.get('outOfStock') === 'true'

    // Get all warehouses with inventory
    const query: any = { isActive: true }
    if (warehouseId) {
      query._id = warehouseId
    }

    const warehouses = await Warehouse.find(query)
      .populate({
        path: 'inventory.product',
        select: 'name sku images price stock lowStockThreshold category'
      })
      .lean()

    const lowStockItems: any[] = []
    const outOfStockItems: any[] = []

    warehouses.forEach((warehouse: any) => {
      warehouse.inventory.forEach((item: any) => {
        const product = item.product
        if (!product) return

        const available = item.quantity - item.reserved
        const threshold = product.lowStockThreshold || 10
        const criticalThreshold = Math.floor(threshold / 2)

        const stockItem = {
          warehouse: {
            _id: warehouse._id,
            name: warehouse.name,
            code: warehouse.code
          },
          product: {
            _id: product._id,
            name: product.name,
            sku: product.sku,
            images: product.images,
            price: product.price
          },
          quantity: item.quantity,
          reserved: item.reserved,
          available,
          threshold,
          criticalThreshold,
          isCritical: available <= criticalThreshold && available > 0,
          isOutOfStock: available <= 0,
          percentageRemaining: threshold > 0 ? (available / threshold) * 100 : 0
        }

        if (available <= 0) {
          outOfStockItems.push(stockItem)
        } else if (available <= threshold) {
          if (criticalOnly && available > criticalThreshold) {
            // Skip non-critical items if criticalOnly filter is on
            return
          }
          lowStockItems.push(stockItem)
        }
      })
    })

    // Sort by available quantity (ascending)
    lowStockItems.sort((a, b) => a.available - b.available)
    outOfStockItems.sort((a, b) => a.available - b.available)

    // Calculate stats
    const stats = {
      lowStock: lowStockItems.length,
      critical: lowStockItems.filter(item => item.isCritical).length,
      outOfStock: outOfStockItems.length,
      totalAlerts: lowStockItems.length + outOfStockItems.length
    }

    return NextResponse.json({
      lowStockItems: outOfStock ? [] : lowStockItems,
      outOfStockItems: outOfStock ? outOfStockItems : [],
      allAlerts: [...outOfStockItems, ...lowStockItems],
      stats,
    })
  } catch (error: any) {
    console.error('Get low stock error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch low stock alerts' },
      { status: 500 }
    )
  }
}

