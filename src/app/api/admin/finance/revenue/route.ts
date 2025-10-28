import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import Transaction from '@/models/Transaction'

// GET - Get revenue analytics
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
    const period = searchParams.get('period') || '30days'

    // Calculate date range
    let startDate = new Date()
    let endDate = new Date()

    switch (period) {
      case '7days':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30days':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90days':
        startDate.setDate(startDate.getDate() - 90)
        break
      case '1year':
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
      case 'thisMonth':
        startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
        break
      case 'lastMonth':
        startDate = new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1)
        endDate = new Date(startDate.getFullYear(), startDate.getMonth(), 0)
        break
      default:
        startDate.setDate(startDate.getDate() - 30)
    }

    // Get orders in date range
    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
      paymentStatus: { $in: ['paid', 'pending'] }
    }).lean()

    // Calculate total revenue
    const totalRevenue = orders.reduce((sum: number, order) => sum + order.total, 0)
    const paidRevenue = orders
      .filter(o => o.paymentStatus === 'paid')
      .reduce((sum: number, order) => sum + order.total, 0)
    const pendingRevenue = orders
      .filter(o => o.paymentStatus === 'pending')
      .reduce((sum: number, order) => sum + order.total, 0)

    // Calculate average order value
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0

    // Get previous period for comparison
    const prevPeriodStart = new Date(startDate)
    const prevPeriodEnd = new Date(endDate)
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    prevPeriodStart.setDate(prevPeriodStart.getDate() - daysDiff)
    prevPeriodEnd.setDate(prevPeriodEnd.getDate() - daysDiff)

    const prevOrders = await Order.find({
      createdAt: { $gte: prevPeriodStart, $lte: prevPeriodEnd },
      paymentStatus: 'paid'
    }).lean()

    const prevRevenue = prevOrders.reduce((sum: number, order) => sum + order.total, 0)
    const revenueChange = prevRevenue > 0 ? ((paidRevenue - prevRevenue) / prevRevenue) * 100 : 0

    // Revenue by date (daily breakdown)
    const revenueByDate = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])

    // Revenue by category
    const revenueByCategory = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          paymentStatus: 'paid'
        }
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productData'
        }
      },
      { $unwind: '$productData' },
      {
        $lookup: {
          from: 'categories',
          localField: 'productData.category',
          foreignField: '_id',
          as: 'categoryData'
        }
      },
      { $unwind: '$categoryData' },
      {
        $group: {
          _id: '$categoryData.name',
          revenue: { $sum: '$items.total' },
          orders: { $addToSet: '$_id' }
        }
      },
      {
        $project: {
          name: '$_id',
          revenue: 1,
          orderCount: { $size: '$orders' }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ])

    // Revenue by payment method
    const revenueByPayment = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          revenue: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      { $sort: { revenue: -1 } }
    ])

    // Get refunds
    const refunds = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          paymentStatus: 'refunded'
        }
      },
      {
        $group: {
          _id: null,
          totalRefunded: { $sum: '$total' },
          count: { $sum: 1 }
        }
      }
    ])

    const totalRefunded = refunds.length > 0 ? refunds[0].totalRefunded : 0
    const refundCount = refunds.length > 0 ? refunds[0].count : 0

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalRevenue,
          paidRevenue,
          pendingRevenue,
          avgOrderValue,
          totalOrders: orders.length,
          paidOrders: orders.filter(o => o.paymentStatus === 'paid').length,
          pendingOrders: orders.filter(o => o.paymentStatus === 'pending').length,
          revenueChange,
          totalRefunded,
          refundCount
        },
        revenueByDate,
        revenueByCategory,
        revenueByPayment,
        period: {
          start: startDate,
          end: endDate
        }
      }
    })

  } catch (error: any) {
    console.error('Error fetching revenue data:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch revenue data' },
      { status: 500 }
    )
  }
}

