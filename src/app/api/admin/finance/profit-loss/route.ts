import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import Transaction from '@/models/Transaction'
import Product from '@/models/Product'

// GET - Get profit & loss report
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

    // Get paid orders
    const paidOrders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
      paymentStatus: 'paid'
    })
    .populate({
      path: 'items.product',
      select: 'costPrice'
    })
    .lean()

    // Calculate revenue
    const revenue = paidOrders.reduce((sum: number, order) => sum + order.total, 0)

    // Calculate cost of goods sold (COGS)
    let cogs = 0
    for (const order of paidOrders) {
      for (const item of order.items) {
        const product = item.product as any
        const costPrice = product?.costPrice || 0
        cogs += costPrice * item.quantity
      }
    }

    // Get shipping costs (from transactions or orders)
    const shippingCosts = paidOrders.reduce((sum: number, order) => sum + (order.shipping || 0), 0)

    // Get tax collected
    const taxCollected = paidOrders.reduce((sum: number, order) => sum + (order.tax || 0), 0)

    // Get discounts given
    const discounts = paidOrders.reduce((sum: number, order) => sum + (order.discount || 0), 0)

    // Get refunds
    const refundedOrders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
      paymentStatus: 'refunded'
    }).lean()

    const refunds = refundedOrders.reduce((sum: number, order) => sum + order.total, 0)

    // Get payment gateway fees
    const transactions = await Transaction.find({
      transactionDate: { $gte: startDate, $lte: endDate },
      type: 'income',
      status: 'completed'
    }).lean()

    const gatewayFees = transactions.reduce((sum: number, txn) => sum + (txn.gatewayFee || 0), 0)

    // Calculate profit
    const grossProfit = revenue - cogs
    const grossProfitMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0

    const totalExpenses = discounts + refunds + gatewayFees
    const netProfit = grossProfit - totalExpenses
    const netProfitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0

    // Monthly breakdown
    const monthlyData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$createdAt' }
          },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          revenue,
          cogs,
          grossProfit,
          grossProfitMargin,
          expenses: {
            discounts,
            refunds,
            gatewayFees,
            shipping: 0, // You can add shipping costs if tracked separately
            total: totalExpenses
          },
          netProfit,
          netProfitMargin,
          taxCollected,
          shippingRevenue: shippingCosts
        },
        monthlyData,
        period: {
          start: startDate,
          end: endDate
        }
      }
    })

  } catch (error: any) {
    console.error('Error fetching profit/loss data:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch profit/loss data' },
      { status: 500 }
    )
  }
}

