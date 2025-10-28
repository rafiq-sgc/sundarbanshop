import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import Cart from '@/models/Cart'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { orderEmailService } from '@/services/email/order.service'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
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
    const query: any = { user: session.user.id }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } }
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
        .populate('items.product', 'name images')
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
    console.error('Orders API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    
    await connectDB()

    // Helper function to clean address data
    const cleanAddressData = (address: any) => {
      if (!address) return address
      return {
        ...address,
        state: address.state && address.state.trim() ? address.state : undefined,
        zipCode: address.zipCode && address.zipCode.trim() ? address.zipCode : undefined,
        email: address.email && address.email.trim() ? address.email : undefined
      }
    }

    // Prepare order data
    const orderData = {
      ...body,
      orderStatus: 'pending',
      paymentStatus: 'pending',
      shippingAddress: cleanAddressData(body.shippingAddress)
    }

    // Only add billingAddress if it's provided
    if (body.billingAddress) {
      orderData.billingAddress = cleanAddressData(body.billingAddress)
    }

    // Add user ID if authenticated, otherwise it's a guest order
    if (session) {
      orderData.user = session.user.id
      
      // For authenticated users, get cart items from database
      const cart = await Cart.findOne({ user: session.user.id }).populate('items.product')
      if (cart && cart.items.length > 0) {
        orderData.items = cart.items.map((item: any) => ({
          product: item.product._id,
          name: item.product.name,
          sku: item.variant?.sku || item.product.sku || 'N/A',
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity,
          variant: item.variant ? {
            variantId: item.variant.variantId,
            name: item.variant.name,
            attributes: item.variant.attributes,
            sku: item.variant.sku
          } : undefined
        }))
        
        // Calculate totals
        const subtotal = cart.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
        const tax = subtotal * 0.08
        const shipping = subtotal > 50 ? 0 : 10
        const total = subtotal + tax + shipping
        
        orderData.subtotal = subtotal
        orderData.tax = tax
        orderData.shipping = shipping
        orderData.total = total
        orderData.currency = 'BDT'
      }
    } else {
      // For guest orders, ensure we have guest email if provided
      if (body.guestEmail) {
        orderData.guestEmail = body.guestEmail
      }
      
      // For guest orders, use items from the request body
      if (body.items && body.items.length > 0) {
        orderData.items = body.items.map((item: any) => ({
          product: item.product || null,
          name: item.name,
          sku: item.sku || 'N/A',
          price: item.price,
          quantity: item.quantity,
          total: item.total,
          variant: item.variant || undefined
        }))
      }
    }

    const order = new Order(orderData)
    await order.save()

    // Send order confirmation email if email is provided
    const customerEmail = session?.user?.email || body.guestEmail || body.shippingAddress?.email
    const customerName = session?.user?.name || body.shippingAddress?.name

    if (customerEmail) {
      try {
        await orderEmailService.sendOrderConfirmation({
          order: order,
          customerEmail: customerEmail,
          customerName: customerName
        })
      } catch (emailError) {
        console.error('Failed to send order confirmation email:', emailError)
        // Don't fail the order if email fails
      }
    }

    // Clear cart for authenticated users
    if (session) {
      await Cart.findOneAndDelete({ user: session.user.id })
    }
    
    // For guest users, we'll return a flag to clear localStorage on the frontend
    // The frontend will handle clearing the localStorage

    return NextResponse.json(
      { 
        success: true, 
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          total: order.total,
          clearCart: !session // Flag to clear localStorage for guest users
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create order' },
      { status: 500 }
    )
  }
}
