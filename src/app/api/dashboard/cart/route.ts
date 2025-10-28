import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Cart from '@/models/Cart'
import Product from '@/models/Product'
import { z } from 'zod'

const cartItemVariantSchema = z.object({
  variantId: z.string().optional(),
  name: z.string().optional(),
  attributes: z.record(z.string(), z.string()).optional(),
  sku: z.string().optional()
})

const addToCartSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1').default(1),
  variant: cartItemVariantSchema.optional()
})

// GET - Get user's cart
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    let cart = await Cart.findOne({ userId: session.user.id }).populate('items.product')

    // Create empty cart if doesn't exist
    if (!cart) {
      cart = await Cart.create({ userId: session.user.id, items: [] })
    }

    // Calculate totals
    const subtotal = cart.items.reduce((sum: number, item: any) => {
      return sum + (item.price * item.quantity)
    }, 0)

    return NextResponse.json({
      success: true,
      data: {
        ...cart.toObject(),
        subtotal,
        total: subtotal
      }
    })
  } catch (error) {
    console.error('Error fetching cart:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Add item to cart
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
    const validatedData = addToCartSchema.parse(body)

    // Check product exists and has stock
    const product = await Product.findById(validatedData.productId)

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

    // Get or create cart
    let cart = await Cart.findOne({ userId: session.user.id })

    if (!cart) {
      cart = new Cart({ userId: session.user.id, items: [] })
    }

    // Validate variant if provided
    let variantPrice = product.price
    let variantStock = product.stock
    
    if (validatedData.variant && validatedData.variant.variantId) {
      const variant = product.variants?.find(
        (v: any) => v._id?.toString() === validatedData.variant?.variantId
      )
      
      if (!variant) {
        return NextResponse.json(
          { success: false, message: 'Selected variant not found' },
          { status: 404 }
        )
      }
      
      if (!variant.isActive) {
        return NextResponse.json(
          { success: false, message: 'Selected variant is not available' },
          { status: 400 }
        )
      }
      
      variantPrice = variant.price
      variantStock = variant.stock
    }

    // Check stock availability
    if (variantStock < validatedData.quantity) {
      return NextResponse.json(
        { success: false, message: 'Insufficient stock' },
        { status: 400 }
      )
    }

    // Check if product+variant combination already in cart
    const existingItemIndex = cart.items.findIndex((item: any) => {
      if (item.product.toString() !== validatedData.productId) return false
      
      // If no variant, match only product
      if (!validatedData.variant && !item.variant) return true
      
      // If variant provided, match variant ID
      if (validatedData.variant?.variantId && item.variant?.variantId) {
        return item.variant.variantId === validatedData.variant.variantId
      }
      
      return false
    })

    if (existingItemIndex > -1) {
      // Update quantity
      const newQuantity = cart.items[existingItemIndex].quantity + validatedData.quantity
      
      if (newQuantity > variantStock) {
        return NextResponse.json(
          { success: false, message: 'Cannot add more items. Stock limit reached.' },
          { status: 400 }
        )
      }

      cart.items[existingItemIndex].quantity = newQuantity
    } else {
      // Add new item
      cart.items.push({
        product: validatedData.productId,
        quantity: validatedData.quantity,
        price: variantPrice,
        variant: validatedData.variant
      } as any)
    }

    await cart.save()

    // Populate and return
    cart = await Cart.findById(cart._id).populate('items.product')

    const subtotal = cart!.items.reduce((sum: number, item: any) => {
      return sum + (item.price * item.quantity)
    }, 0)

    return NextResponse.json({
      success: true,
      message: 'Item added to cart',
      data: {
        ...cart!.toObject(),
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

    console.error('Error adding to cart:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Clear cart
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    await Cart.findOneAndUpdate(
      { userId: session.user.id },
      { items: [] }
    )

    return NextResponse.json({
      success: true,
      message: 'Cart cleared successfully'
    })
  } catch (error) {
    console.error('Error clearing cart:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

