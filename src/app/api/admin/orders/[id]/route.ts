import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import User from '@/models/User'
import Product from '@/models/Product'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { orderUpdateSchema, ZodError } from '@/lib/validations/order'
import { orderEmailService } from '@/services/order'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const order = await Order.findById(params.id)
      .populate('user', 'name email phone')
      .populate('items.product', 'name images')
      .lean()

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: order
    })
  } catch (error) {
    console.error('Get order error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleOrderUpdate(request, params)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleOrderUpdate(request, params)
}

// Shared update logic for both PUT and PATCH
async function handleOrderUpdate(
  request: NextRequest,
  params: { id: string }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('Order update received:', JSON.stringify(body, null, 2))

    // Validate request body
    try {
      const validatedData = orderUpdateSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        console.error('Order validation error:', error.issues)
        return NextResponse.json({
          success: false,
          message: 'Validation failed',
          errors: error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        }, { status: 400 })
      }
      throw error
    }
    
    await connectDB()

    // Get current order to check if status changed
    const currentOrder = await Order.findById(params.id)
    if (!currentOrder) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      )
    }

    const statusChanged = body.orderStatus && body.orderStatus !== currentOrder.orderStatus
    console.log('Status changed:', statusChanged, 'Old:', currentOrder.orderStatus, 'New:', body.orderStatus)

    // Handle special date fields
    const updateData = { ...body }
    if (body.shippedAt) {
      updateData.shippedAt = new Date(body.shippedAt)
    }
    if (body.deliveredAt) {
      updateData.deliveredAt = new Date(body.deliveredAt)
    }

    const order = await Order.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('user', 'name email phone')
      .populate('items.product', 'name images')

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      )
    }

    // Send email notification if status changed (background task, NO PDF)
    if (statusChanged) {
      const customer = await User.findById(order.user)
      
      if (customer && customer.email) {
        console.log(`Order status changed to ${order.orderStatus}, queuing status update email to ${customer.email}`)
        
        // Send email in background (don't await, NO PDF attachment)
        orderEmailService.sendOrderStatusUpdate(
          {
            orderNumber: order.orderNumber,
            orderDate: order.createdAt,
            customer: {
              name: customer.name,
              email: customer.email,
              phone: customer.phone
            },
            items: order.items.map((item: any) => ({
              name: item.name,
              sku: item.sku,
              quantity: item.quantity,
              price: item.price,
              total: item.total
            })),
            shippingAddress: order.shippingAddress,
            subtotal: order.subtotal,
            tax: order.tax,
            shipping: order.shipping,
            discount: order.discount,
            total: order.total,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            orderStatus: order.orderStatus,
            trackingNumber: order.trackingNumber,
            orderUrl: `${process.env.NEXTAUTH_URL}/dashboard/orders/${order._id}`
          },
          {
            trackingNumber: order.trackingNumber,
            cancellationReason: body.cancellationReason
          }
        ).then(() => {
          console.log('✅ Order status update email sent successfully!')
        }).catch((emailError) => {
          console.error('❌ Failed to send order status update email:', emailError)
        })
      } else {
        console.log('Customer has no email, skipping status update email')
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      data: order
    })
  } catch (error) {
    console.error('Update order error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update order' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const order = await Order.findByIdAndDelete(params.id)

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully'
    })
  } catch (error) {
    console.error('Delete order error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete order' },
      { status: 500 }
    )
  }
}
