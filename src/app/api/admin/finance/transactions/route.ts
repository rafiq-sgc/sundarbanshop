import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Transaction from '@/models/Transaction'
import Order from '@/models/Order'

// GET - Get transactions with filters
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
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Filters
    const type = searchParams.get('type') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''
    const paymentMethod = searchParams.get('paymentMethod') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    const search = searchParams.get('search') || ''

    // Build query
    const query: any = {}

    if (type) query.type = type
    if (category) query.category = category
    if (status) query.status = status
    if (paymentMethod) query.paymentMethod = paymentMethod

    if (startDate || endDate) {
      query.transactionDate = {}
      if (startDate) query.transactionDate.$gte = new Date(startDate)
      if (endDate) query.transactionDate.$lte = new Date(endDate)
    }

    if (search) {
      query.$or = [
        { transactionNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { gatewayTransactionId: { $regex: search, $options: 'i' } }
      ]
    }

    // Get transactions
    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('user', 'name email')
        .populate('order', 'orderNumber')
        .sort({ transactionDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(query)
    ])

    // Get statistics
    const stats = await Transaction.aggregate([
      {
        $facet: {
          total: [
            { $group: { _id: null, amount: { $sum: '$amount' } } }
          ],
          byType: [
            { $group: { _id: '$type', amount: { $sum: '$amount' }, count: { $sum: 1 } } }
          ],
          byStatus: [
            { $group: { _id: '$status', amount: { $sum: '$amount' }, count: { $sum: 1 } } }
          ]
        }
      }
    ])

    const totalAmount = stats[0].total[0]?.amount || 0
    const income = stats[0].byType.find((t: any) => t._id === 'income')?.amount || 0
    const expense = stats[0].byType.find((t: any) => t._id === 'expense')?.amount || 0
    const refund = stats[0].byType.find((t: any) => t._id === 'refund')?.amount || 0

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        stats: {
          totalAmount,
          income,
          expense,
          refund,
          netRevenue: income - expense - refund,
          byType: stats[0].byType,
          byStatus: stats[0].byStatus
        }
      }
    })

  } catch (error: any) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

// POST - Create manual transaction
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

    const transaction = await Transaction.create({
      ...body,
      currency: 'BDT',
      user: session.user.id
    })

    return NextResponse.json({
      success: true,
      data: transaction,
      message: 'Transaction created successfully'
    })

  } catch (error: any) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create transaction' },
      { status: 500 }
    )
  }
}

