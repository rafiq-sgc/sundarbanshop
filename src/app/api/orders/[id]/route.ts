import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const orderId = params.id
    
    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Find order by ID (works for both authenticated and guest orders)
    const order = await Order.findById(orderId).lean()
    
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      )
    }

    // Return order data (no sensitive information exposed)
    return NextResponse.json({
      success: true,
      data: {
        _id: (order as any)._id,
        orderNumber: (order as any).orderNumber,
        items: (order as any).items,
        subtotal: (order as any).subtotal,
        tax: (order as any).tax,
        shipping: (order as any).shipping,
        discount: (order as any).discount,
        total: (order as any).total,
        currency: (order as any).currency,
        paymentMethod: (order as any).paymentMethod,
        orderStatus: (order as any).orderStatus,
        paymentStatus: (order as any).paymentStatus,
        shippingAddress: (order as any).shippingAddress,
        billingAddress: (order as any).billingAddress,
        createdAt: (order as any).createdAt,
        updatedAt: (order as any).updatedAt,
        // Don't expose user ID or guest email for security
        isGuestOrder: !(order as any).user
      }
    })
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}