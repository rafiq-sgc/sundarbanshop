import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import User from '@/models/User'
import Product from '@/models/Product'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { orderSchema, ZodError } from '@/lib/validations/order'
import { orderEmailService } from '@/services/order'

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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'

    await connectDB()

    // Build query
    const query: any = {}

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'user.name': { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } }
      ]
    }

    if (status !== 'all') {
      query.orderStatus = status
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Execute query
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query)
    ])

    const pages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error('Admin orders API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('Order API received data:', JSON.stringify(body, null, 2))

    // Validate request body
    let validatedData
    try {
      validatedData = orderSchema.parse(body)
      console.log('Order validation successful')
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

    // Generate order number
    const orderCount = await Order.countDocuments()
    const orderNumber = `ORD-${String(orderCount + 1).padStart(6, '0')}`

    // Process items to handle both products and custom items
    const processedItems = validatedData.items.map((item: any) => {
      if (item.product === 'custom' || !item.product) {
        // Handle custom items
        return {
          product: null, // Custom items don't have a product reference
          name: item.name,
          sku: `CUSTOM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity
        }
      } else {
        // Handle product items
        return {
          product: item.product,
          name: item.name,
          sku: `PROD-${item.product}`,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity
        }
      }
    })

    // Create order
    const order = new Order({
      ...validatedData,
      items: processedItems,
      orderNumber
    })

    await order.save()

    // Populate user data
    await order.populate('user', 'name email phone')

    // Send order confirmation email if customer has email
    const customer = await User.findById(order.user)
    
    if (customer && customer.email) {
      console.log('Queuing order confirmation email to:', customer.email)
      
      // Generate tracking URL for guest tracking
      const trackingUrl = `${process.env.NEXTAUTH_URL}/track-order?order=${order.orderNumber}&email=${encodeURIComponent(customer.email)}`
      
      // Send order confirmation email with invoice PDF (async/background)
      orderEmailService.sendOrderConfirmationWithInvoice({
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
        orderUrl: `${process.env.NEXTAUTH_URL}/dashboard/orders/${order._id}`,
        trackingUrl
      }).then(() => {
        console.log('Order confirmation email sent successfully!')
      }).catch((emailError) => {
        console.error('Failed to send order confirmation email:', emailError)
      })
    } else {
      console.log('Customer has no email, skipping order confirmation email')
    }

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      data: order
    }, { status: 201 })

  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
