import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Invoice from '@/models/Invoice'
import Order from '@/models/Order'
import Product from '@/models/Product'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json({
        success: false,
        message: 'Order ID is required'
      }, { status: 400 })
    }

    await connectDB()

    // Get the order with populated data
    const order = await Order.findById(orderId)
      .populate('user', 'name email phone')
      .populate('items.product', 'name images')
      .lean()

    if (!order) {
      return NextResponse.json({
        success: false,
        message: 'Order not found'
      }, { status: 404 })
    }

    // Check if invoice already exists
    const existingInvoice = await Invoice.findOne({ order: orderId })
    if (existingInvoice) {
      return NextResponse.json({
        success: false,
        message: 'Invoice already exists for this order'
      }, { status: 400 })
    }

    // Generate invoice number
    const invoiceCount = await Invoice.countDocuments()
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(6, '0')}`

    // Prepare invoice items
    const invoiceItems = (order as any).items.map((item: any) => {
      if (item.product) {
        // Product item
        return {
          product: item.product._id,
          name: item.name,
          description: item.product.name,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity,
          image: item.image || item.product.images[0]
        }
      } else {
        // Custom item
        return {
          product: null,
          name: item.name,
          description: item.description || 'Custom Item',
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity,
          image: item.image || null
        }
      }
    })

    // Create invoice
    const invoice = new Invoice({
      invoiceNumber,
      order: orderId,
      customer: {
        _id: (order as any).user._id,
        name: (order as any).user.name,
        email: (order as any).user.email || null,
        phone: (order as any).user.phone
      },
      billingAddress: (order as any).billingAddress || (order as any).shippingAddress,
      items: invoiceItems,
      subtotal: (order as any).subtotal,
      tax: (order as any).tax,
      shipping: (order as any).shipping,
      discount: (order as any).discount,
      total: (order as any).total,
      currency: (order as any).currency,
      status: 'draft',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      notes: (order as any).notes
    })

    await invoice.save()

    // Populate the created invoice
    await invoice.populate('order', 'orderNumber orderStatus')

    return NextResponse.json({
      success: true,
      message: 'Invoice created successfully',
      data: invoice
    }, { status: 201 })

  } catch (error) {
    console.error('Create invoice error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
