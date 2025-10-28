import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Cart from '@/models/Cart'
import Product from '@/models/Product'
import { z } from 'zod'

const updateQuantitySchema = z.object({
  quantity: z.number().min(1, 'Quantity must be at least 1')
})

// PATCH - Update item quantity
export async function PATCH(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
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
    const validatedData = updateQuantitySchema.parse(body)

    // Check product stock
    const product = await Product.findById(params.productId)

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      )
    }

    if (product.stock < validatedData.quantity) {
      return NextResponse.json(
        { success: false, message: 'Insufficient stock' },
        { status: 400 }
      )
    }

    // Update cart
    const cart = await Cart.findOne({ userId: session.user.id })

    if (!cart) {
      return NextResponse.json(
        { success: false, message: 'Cart not found' },
        { status: 404 }
      )
    }

    const itemIndex = cart.items.findIndex(
      (item: any) => item.product.toString() === params.productId
    )

    if (itemIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Item not found in cart' },
        { status: 404 }
      )
    }

    cart.items[itemIndex].quantity = validatedData.quantity

    await cart.save()

    // Populate and return
    const updatedCart = await Cart.findById(cart._id).populate('items.product')

    const subtotal = updatedCart!.items.reduce((sum: number, item: any) => {
      return sum + (item.price * item.quantity)
    }, 0)

    return NextResponse.json({
      success: true,
      message: 'Quantity updated',
      data: {
        ...updatedCart!.toObject(),
        subtotal,
        total: subtotal
      }
    })
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

    console.error('Error updating quantity:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove item from cart
export async function DELETE(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const cart = await Cart.findOne({ userId: session.user.id })

    if (!cart) {
      return NextResponse.json(
        { success: false, message: 'Cart not found' },
        { status: 404 }
      )
    }

    // Remove item
    cart.items = cart.items.filter(
      (item: any) => item.product.toString() !== params.productId
    )

    await cart.save()

    // Populate and return
    const updatedCart = await Cart.findById(cart._id).populate('items.product')

    const subtotal = updatedCart!.items.reduce((sum: number, item: any) => {
      return sum + (item.price * item.quantity)
    }, 0)

    return NextResponse.json({
      success: true,
      message: 'Item removed from cart',
      data: {
        ...updatedCart!.toObject(),
        subtotal,
        total: subtotal
      }
    })
  } catch (error) {
    console.error('Error removing from cart:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

