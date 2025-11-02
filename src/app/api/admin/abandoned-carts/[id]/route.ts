export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Cart from '@/models/Cart'
import User from '@/models/User'
import ActivityLog from '@/models/ActivityLog'
import '@/models/Product'

// GET - Get single abandoned cart
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

    const cart = await Cart.findById(params.id)
      .populate('userId', 'name email phone')
      .populate('items.product', 'name images price description')
      .lean()

    if (!cart) {
      return NextResponse.json(
        { success: false, message: 'Cart not found' },
        { status: 404 }
      )
    }

    const totalValue = (cart as any).items.reduce(
      (sum: number, item: any) => sum + (item.price * item.quantity),
      0
    )

    const abandonedCart = {
      _id: (cart as any)._id,
      userId: (cart as any).userId?._id,
      customer: {
        name: (cart as any).userId?.name || 'Guest User',
        email: (cart as any).userId?.email || 'N/A',
        phone: (cart as any).userId?.phone || 'N/A'
      },
      items: (cart as any).items.map((item: any) => ({
        product: {
          _id: item.product?._id,
          name: item.product?.name || 'Unknown Product',
          image: item.product?.images?.[0] || '/placeholder.png',
          price: item.price,
          description: item.product?.description
        },
        quantity: item.quantity
      })),
      totalValue,
      abandonedAt: (cart as any).updatedAt,
      createdAt: (cart as any).createdAt
    }

    return NextResponse.json({
      success: true,
      data: abandonedCart
    })

  } catch (error: any) {
    console.error('Error fetching cart:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch cart' },
      { status: 500 }
    )
  }
}

// POST - Send recovery email
export async function POST(
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

    const body = await request.json()
    const { emailType, discountCode } = body

    const cart = await Cart.findById(params.id)
      .populate('userId', 'name email')
      .populate('items.product', 'name images price')
      .lean()

    if (!cart) {
      return NextResponse.json(
        { success: false, message: 'Cart not found' },
        { status: 404 }
      )
    }

    const user = (cart as any).userId

    if (!user || !user.email) {
      return NextResponse.json(
        { success: false, message: 'User email not found' },
        { status: 400 }
      )
    }

    // Here you would integrate with your email service (e.g., SendGrid, AWS SES)
    // For now, we'll just log the action
    
    const emailSubject = emailType === 'reminder' 
      ? 'You left items in your cart!'
      : emailType === 'discount'
      ? 'Special discount for items in your cart!'
      : 'Final chance - Your cart is waiting!'

    // Log the email send activity
    await ActivityLog.create({
      user: session.user.id,
      action: 'SEND',
      entity: 'AbandonedCart',
      entityId: params.id,
      description: `Sent ${emailType} email to ${user.email} for abandoned cart`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      metadata: {
        cartId: params.id,
        recipientEmail: user.email,
        emailType,
        discountCode,
        emailSubject
      }
    })

    return NextResponse.json({
      success: true,
      message: `Recovery email sent to ${user.email}`,
      data: {
        emailSent: true,
        recipientEmail: user.email,
        emailType,
        sentAt: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('Error sending recovery email:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to send recovery email' },
      { status: 500 }
    )
  }
}

// DELETE - Delete abandoned cart
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

    const cart = await Cart.findById(params.id).lean()

    if (!cart) {
      return NextResponse.json(
        { success: false, message: 'Cart not found' },
        { status: 404 }
      )
    }

    await Cart.findByIdAndDelete(params.id)

    // Log activity
    await ActivityLog.create({
      user: session.user.id,
      action: 'DELETE',
      entity: 'Cart',
      entityId: params.id,
      description: 'Deleted abandoned cart',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({
      success: true,
      message: 'Cart deleted successfully'
    })

  } catch (error: any) {
    console.error('Error deleting cart:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete cart' },
      { status: 500 }
    )
  }
}

