import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Cart from '@/models/Cart'
import User from '@/models/User'
import Order from '@/models/Order'
import Product from '@/models/Product'
import Invoice from '@/models/Invoice'
import { z } from 'zod'
import { orderEmailService } from '@/services/order'

const checkoutSchema = z.object({
  shippingAddressId: z.string().min(1, 'Shipping address is required'),
  billingAddressId: z.string().optional(),
  paymentMethod: z.enum(['cod', 'card', 'bkash', 'nagad', 'rocket', 'bank']),
  paymentMethodId: z.string().optional(),
  notes: z.string().optional()
})

// POST - Create order from cart
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const body = await request.json()
    const validatedData = checkoutSchema.parse(body)

    // Get user with addresses
    const user = await User.findById(session.user.id)

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Get cart
    const cart = await Cart.findOne({ userId: session.user.id }).populate('items.product')

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Cart is empty' },
        { status: 400 }
      )
    }

    // Find addresses
    const shippingAddress = user.address?.find(
      (addr: any) => addr._id.toString() === validatedData.shippingAddressId
    )

    if (!shippingAddress) {
      return NextResponse.json(
        { success: false, message: 'Shipping address not found' },
        { status: 404 }
      )
    }

    const billingAddress = validatedData.billingAddressId 
      ? user.address?.find((addr: any) => addr._id.toString() === validatedData.billingAddressId)
      : shippingAddress

    // Validate stock for all items (considering variants)
    for (const item of cart.items) {
      const product = await Product.findById((item as any).product._id)
      if (!product) {
        return NextResponse.json(
          { success: false, message: `Product not found: ${(item as any).product.name}` },
          { status: 404 }
        )
      }
      
      // Check variant stock if variant is selected
      const cartItem = item as any
      if (cartItem.variant && cartItem.variant.variantId) {
        const variant = product.variants?.find(
          (v: any) => v._id?.toString() === cartItem.variant.variantId
        )
        
        if (!variant || variant.stock < item.quantity) {
          return NextResponse.json(
            { success: false, message: `Insufficient stock for ${product.name} (${cartItem.variant.name})` },
            { status: 400 }
          )
        }
      } else {
        // Check product stock
        if (product.stock < item.quantity) {
          return NextResponse.json(
            { success: false, message: `Insufficient stock for ${product.name}` },
            { status: 400 }
          )
        }
      }
    }

    // Calculate totals
    const subtotal = cart.items.reduce((sum: number, item: any) => {
      return sum + (item.price * item.quantity)
    }, 0)

    const tax = subtotal * 0.08 // 8% tax
    const shipping = subtotal > 50 ? 0 : 10 // Free shipping over $50
    const total = subtotal + tax + shipping

    // Create order
    const order = await Order.create({
      user: session.user.id,
      items: cart.items.map((item: any) => ({
        product: item.product._id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
        sku: item.variant?.sku || item.product.sku || 'N/A',
        variant: item.variant ? {
          variantId: item.variant.variantId,
          name: item.variant.name,
          attributes: item.variant.attributes,
          sku: item.variant.sku
        } : undefined
      })),
      shippingAddress: {
        name: shippingAddress.name,
        phone: shippingAddress.phone,
        address: shippingAddress.address,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zipCode: shippingAddress.zipCode,
        country: shippingAddress.country
      },
      billingAddress: {
        name: billingAddress.name,
        phone: billingAddress.phone,
        address: billingAddress.address,
        city: billingAddress.city,
        state: billingAddress.state,
        zipCode: billingAddress.zipCode,
        country: billingAddress.country
      },
      paymentMethod: validatedData.paymentMethod,
      paymentStatus: validatedData.paymentMethod === 'cod' ? 'pending' : 'pending',
      orderStatus: 'pending',
      subtotal,
      tax,
      shipping,
      discount: 0,
      total,
      currency: 'BDT',
      notes: validatedData.notes
    })

    // Update product/variant stock
    for (const item of cart.items) {
      const cartItem = item as any
      
      if (cartItem.variant && cartItem.variant.variantId) {
        // Update variant stock
        await Product.findOneAndUpdate(
          { 
            _id: cartItem.product._id,
            'variants._id': cartItem.variant.variantId
          },
          { 
            $inc: { 'variants.$.stock': -item.quantity } 
          }
        )
      } else {
        // Update product stock
        await Product.findByIdAndUpdate(
          cartItem.product._id,
          { $inc: { stock: -item.quantity } }
        )
      }
    }

    // Clear cart
    await Cart.findByIdAndUpdate(cart._id, { items: [] })

    // Create invoice
    const invoiceCount = await Invoice.countDocuments()
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(6, '0')}`
    
    const invoice = await Invoice.create({
      invoiceNumber: invoiceNumber,
      order: order._id,
      customer: {
        _id: user._id,
        name: user.name,
        email: user.email || null,
        phone: user.phone || shippingAddress.phone
      },
      billingAddress: {
        name: billingAddress.name,
        phone: billingAddress.phone,
        address: billingAddress.address,
        city: billingAddress.city,
        state: billingAddress.state,
        zipCode: billingAddress.zipCode,
        country: billingAddress.country
      },
      items: order.items.map((item: any) => ({
        product: item.product,
        name: item.variant ? `${item.name} (${item.variant.name})` : item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity,
        sku: item.sku
      })),
      subtotal: order.subtotal,
      tax: order.tax,
      shipping: order.shipping,
      discount: order.discount,
      total: order.total,
      currency: order.currency,
      status: order.paymentStatus === 'paid' ? 'paid' : 'sent',
      notes: order.notes
    })

    // Send order confirmation email with invoice (asynchronously, non-blocking)
    if (user.email) {
      setImmediate(async () => {
        try {
          await orderEmailService.sendOrderConfirmationWithInvoice({
            orderNumber: order.orderNumber,
            orderDate: order.createdAt,
            customer: {
              name: user.name,
              email: user.email!,
              phone: user.phone || shippingAddress.phone
            },
            items: order.items.map((item: any) => ({
              name: item.name,
              sku: item.sku || 'N/A',
              quantity: item.quantity,
              price: item.price,
              total: item.price * item.quantity
            })),
            shippingAddress: {
              name: shippingAddress.name,
              address: shippingAddress.address,
              city: shippingAddress.city,
              state: shippingAddress.state,
              zipCode: shippingAddress.zipCode,
              country: shippingAddress.country,
              phone: shippingAddress.phone
            },
            subtotal: order.subtotal,
            tax: order.tax,
            shipping: order.shipping,
            discount: order.discount,
            total: order.total,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            orderStatus: order.orderStatus,
            orderUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/dashboard/orders/${order._id}`,
            trackingUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/track-order?order=${order.orderNumber}&phone=${user.phone || shippingAddress.phone}`
          })
          
          console.log('✅ Order confirmation email sent successfully to:', user.email)
        } catch (emailError) {
          console.error('❌ Failed to send order confirmation email:', emailError)
        }
      })
    } else {
      console.log('ℹ️ No email provided - skipping order confirmation email')
    }

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        total: order.total
      }
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation error',
          errors: error.issues
        },
        { status: 400 }
      )
    }

    console.error('Error creating order:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

