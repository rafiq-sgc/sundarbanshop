import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import Product from '@/models/Product'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/dashboard/orders/[id]
 * Get single order details for the current logged-in user
 * User can only view their own orders
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please login to view order details.' },
        { status: 401 }
      )
    }

    await connectDB()

    // Find order and verify ownership
    const order = await Order.findOne({
      _id: params.id,
      user: session.user.id  // Users can only see their own orders
    })
      .populate('user', 'name email phone')
      .populate('items.product', 'name images')
      .lean()

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found or you do not have permission to view it' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: order
    })
  } catch (error) {
    console.error('Dashboard order detail API error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch order details' },
      { status: 500 }
    )
  }
}

