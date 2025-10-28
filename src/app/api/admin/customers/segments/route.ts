import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Order from '@/models/Order'

// GET /api/admin/customers/segments - Get customer segmentation data
export async function GET(request: NextRequest) {
  try {
    console.log('=== GET CUSTOMER SEGMENTS API CALLED ===')
    
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    // Get all customers
    const customers = await User.find({ role: 'user' }).lean()

    // Get all orders
    const orders = await Order.find().lean()

    // Calculate segments
    let newCount = 0
    let vipCount = 0
    let loyalCount = 0
    let regularCount = 0
    let dormantCount = 0
    let oneTimeCount = 0

    for (const customer of customers) {
      const customerOrders = orders.filter(
        order => order.user.toString() === (customer as any)._id.toString()
      )
      
      const totalOrders = customerOrders.length
      const totalSpent = customerOrders.reduce((sum: number, order) => sum + order.total, 0)
      
      const lastOrder = customerOrders.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0]
      
      const daysSinceLastOrder = lastOrder 
        ? (Date.now() - new Date(lastOrder.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        : Infinity

      // Segment logic
      if (totalOrders === 0) {
        newCount++
      } else if (totalSpent >= 1000 && totalOrders >= 10) {
        vipCount++
      } else if (totalOrders >= 5) {
        loyalCount++
      } else if (daysSinceLastOrder > 90) {
        dormantCount++
      } else if (totalOrders === 1) {
        oneTimeCount++
      } else {
        regularCount++
      }
    }

    console.log('Customer segments calculated')

    return NextResponse.json({
      segments: {
        all: customers.length,
        new: newCount,
        vip: vipCount,
        loyal: loyalCount,
        regular: regularCount,
        dormant: dormantCount,
        oneTime: oneTimeCount,
      },
    })
  } catch (error: any) {
    console.error('Get customer segments error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch customer segments' },
      { status: 500 }
    )
  }
}

