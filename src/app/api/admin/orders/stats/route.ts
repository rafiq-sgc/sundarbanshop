import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { orderStatsSchema, ZodError } from '@/lib/validations/order'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all'
    const status = searchParams.get('status') || ''

    // Validate query parameters
    try {
      orderStatsSchema.parse({ period, status })
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json({
          success: false,
          message: 'Invalid query parameters',
          errors: error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        }, { status: 400 })
      }
      throw error
    }

    await connectDB()

    // Calculate date range based on period
    let dateFilter = {}
    const now = new Date()
    
    switch (period) {
      case 'today':
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        dateFilter = { createdAt: { $gte: startOfToday } }
        break
      case 'week':
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        dateFilter = { createdAt: { $gte: startOfWeek } }
        break
      case 'month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        dateFilter = { createdAt: { $gte: startOfMonth } }
        break
      case 'year':
        const startOfYear = new Date(now.getFullYear(), 0, 1)
        dateFilter = { createdAt: { $gte: startOfYear } }
        break
    }

    // Build query
    const query: any = { ...dateFilter }
    if (status) {
      query.orderStatus = status
    }

    // Get order statistics
    const [
      totalOrders,
      totalRevenue,
      statusCounts,
      paymentStatusCounts,
      recentOrders
    ] = await Promise.all([
      Order.countDocuments(query),
      Order.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.aggregate([
        { $match: query },
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
      ]),
      Order.aggregate([
        { $match: query },
        { $group: { _id: '$paymentStatus', count: { $sum: 1 } } }
      ]),
      Order.find(query)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
    ])

    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0

    // Format status counts
    const statusStats = {
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    }

    statusCounts.forEach((item: any) => {
      if (statusStats.hasOwnProperty(item._id)) {
        statusStats[item._id as keyof typeof statusStats] = item.count
      }
    })

    // Format payment status counts
    const paymentStats = {
      pending: 0,
      paid: 0,
      failed: 0,
      refunded: 0
    }

    paymentStatusCounts.forEach((item: any) => {
      if (paymentStats.hasOwnProperty(item._id)) {
        paymentStats[item._id as keyof typeof paymentStats] = item.count
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue: revenue,
        statusStats,
        paymentStats,
        recentOrders,
        period,
        status
      }
    })

  } catch (error) {
    console.error('Order stats API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
