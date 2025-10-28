import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/dashboard/orders/stats
 * Get order statistics for the current logged-in user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const userId = session.user.id

    // Get order counts by status
    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalSpent
    ] = await Promise.all([
      Order.countDocuments({ user: userId }),
      Order.countDocuments({ user: userId, orderStatus: 'pending' }),
      Order.countDocuments({ user: userId, orderStatus: 'confirmed' }),
      Order.countDocuments({ user: userId, orderStatus: 'processing' }),
      Order.countDocuments({ user: userId, orderStatus: 'shipped' }),
      Order.countDocuments({ user: userId, orderStatus: 'delivered' }),
      Order.countDocuments({ user: userId, orderStatus: 'cancelled' }),
      Order.aggregate([
        { $match: { user: session.user.id, orderStatus: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ])
    ])

    return NextResponse.json({
      success: true,
      data: {
        totalOrders,
        totalSpent: totalSpent[0]?.total || 0,
        ordersByStatus: {
          pending: pendingOrders,
          confirmed: confirmedOrders,
          processing: processingOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders
        }
      }
    })
  } catch (error) {
    console.error('Dashboard orders stats API error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch order statistics' },
      { status: 500 }
    )
  }
}

