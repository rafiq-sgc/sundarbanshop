import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Warehouse from '@/models/Warehouse'
import Product from '@/models/Product'
import StockTransfer from '@/models/StockTransfer'
import InventoryAdjustment from '@/models/InventoryAdjustment'

// GET /api/admin/inventory/stats - Get inventory statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    // Get all warehouses
    const warehouses = await Warehouse.find({ isActive: true })
      .populate('inventory.product', 'price lowStockThreshold')
      .lean()

    // Calculate inventory stats
    let totalProducts = 0
    let totalQuantity = 0
    let totalReserved = 0
    let totalAvailable = 0
    let totalValue = 0
    let lowStockCount = 0
    let outOfStockCount = 0

    const productMap = new Map()

    warehouses.forEach((warehouse: any) => {
      warehouse.inventory?.forEach((item: any) => {
        if (!item.product) return

        const productId = item.product._id.toString()
        const available = item.quantity - item.reserved
        const price = item.product.price || 0
        const threshold = item.product.lowStockThreshold || 10

        // Aggregate by product
        if (!productMap.has(productId)) {
          productMap.set(productId, {
            quantity: 0,
            reserved: 0,
            available: 0,
            value: 0
          })
        }

        const productData = productMap.get(productId)
        productData.quantity += item.quantity
        productData.reserved += item.reserved
        productData.available += available
        productData.value += item.quantity * price

        totalQuantity += item.quantity
        totalReserved += item.reserved
        totalAvailable += available
        totalValue += item.quantity * price

        // Check low stock
        if (available <= 0) {
          outOfStockCount++
        } else if (available <= threshold) {
          lowStockCount++
        }
      })
    })

    totalProducts = productMap.size

    // Get transfer stats
    const pendingTransfers = await StockTransfer.countDocuments({ status: 'pending' })
    const inTransitTransfers = await StockTransfer.countDocuments({ status: 'in_transit' })

    // Get adjustment stats
    const pendingAdjustments = await InventoryAdjustment.countDocuments({ status: 'pending' })

    // Get top products by quantity
    const topProducts = Array.from(productMap.entries())
      .sort((a, b) => b[1].quantity - a[1].quantity)
      .slice(0, 5)
      .map(([productId, data]) => ({
        productId,
        ...data
      }))

    // Warehouse stats
    const warehouseStats = warehouses.map((warehouse: any) => {
      const inventoryCount = warehouse.inventory?.length || 0
      const totalQty = warehouse.inventory?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0
      const totalRes = warehouse.inventory?.reduce((sum: number, item: any) => sum + item.reserved, 0) || 0

      return {
        _id: warehouse._id,
        name: warehouse.name,
        code: warehouse.code,
        itemCount: inventoryCount,
        totalQuantity: totalQty,
        totalReserved: totalRes,
        totalAvailable: totalQty - totalRes
      }
    })

    return NextResponse.json({
      overview: {
        totalWarehouses: warehouses.length,
        totalProducts,
        totalQuantity,
        totalReserved,
        totalAvailable,
        totalValue,
        lowStockCount,
        outOfStockCount,
      },
      transfers: {
        pending: pendingTransfers,
        inTransit: inTransitTransfers,
        total: pendingTransfers + inTransitTransfers
      },
      adjustments: {
        pending: pendingAdjustments
      },
      topProducts,
      warehouses: warehouseStats,
    })
  } catch (error: any) {
    console.error('Get inventory stats error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch inventory stats' },
      { status: 500 }
    )
  }
}

