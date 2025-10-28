import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import User from '@/models/User'
import Product from '@/models/Product'

/**
 * POST /api/track-order
 * Track order without authentication
 * Requires: orderNumber + (email OR phone)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderNumber, email, phone } = body

    // Validation
    if (!orderNumber) {
      return NextResponse.json(
        { success: false, message: 'Order number is required' },
        { status: 400 }
      )
    }

    if (!email && !phone) {
      return NextResponse.json(
        { success: false, message: 'Email or phone number is required' },
        { status: 400 }
      )
    }

    await connectDB()

    // Find order by order number
    const order = await Order.findOne({ orderNumber })
      .populate('user', 'name email phone')
      .populate('items.product', 'name images')
      .lean()

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found. Please check your order number and try again.' },
        { status: 404 }
      )
    }

    // Verify order belongs to the provided email or phone
    const user = await User.findById((order as any).user).lean()
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      )
    }

    // Check if email or phone matches
    const emailMatch = email && (user as any).email?.toLowerCase() === email.toLowerCase()
    const phoneMatch = phone && (user as any).phone === phone

    if (!emailMatch && !phoneMatch) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Order not found with the provided information. Please verify your order number and email/phone.' 
        },
        { status: 404 }
      )
    }

    // Return order details (without sensitive user information)
    return NextResponse.json({
      success: true,
      data: {
        _id: (order as any)._id,
        orderNumber: (order as any).orderNumber,
        orderDate: (order as any).createdAt,
        orderStatus: (order as any).orderStatus,
        paymentStatus: (order as any).paymentStatus,
        paymentMethod: (order as any).paymentMethod,
        items: (order as any).items,
        shippingAddress: (order as any).shippingAddress,
        subtotal: (order as any).subtotal,
        tax: (order as any).tax,
        shipping: (order as any).shipping,
        discount: (order as any).discount,
        total: (order as any).total,
        currency: (order as any).currency,
        trackingNumber: (order as any).trackingNumber,
        shippedAt: (order as any).shippedAt,
        deliveredAt: (order as any).deliveredAt,
        notes: (order as any).notes,
        customer: {
          name: (user as any).name,
          email: (user as any).email,
          phone: (user as any).phone
        }
      }
    })
  } catch (error) {
    console.error('Track order API error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to track order. Please try again.' },
      { status: 500 }
    )
  }
}

