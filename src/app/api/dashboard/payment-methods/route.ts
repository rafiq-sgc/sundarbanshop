import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { z } from 'zod'

// Validation schema
const paymentMethodSchema = z.object({
  type: z.enum(['card', 'bkash', 'nagad', 'rocket', 'bank']),
  isDefault: z.boolean().default(false),
  // Card fields
  cardNumber: z.string().optional(),
  cardHolderName: z.string().optional(),
  expiryDate: z.string().optional(),
  // Mobile wallet fields
  accountNumber: z.string().optional(),
  accountName: z.string().optional(),
  // Bank fields
  bankName: z.string().optional(),
  accountHolderName: z.string().optional(),
  routingNumber: z.string().optional()
})

// GET - Get all payment methods
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
    const user = await User.findById(session.user.id)

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: user.paymentMethods || []
    })
  } catch (error) {
    console.error('Error fetching payment methods:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Add new payment method
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
    const validatedData = paymentMethodSchema.parse(body)

    const user = await User.findById(session.user.id)

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // If this is set as default, unset all other defaults
    if (validatedData.isDefault && user.paymentMethods) {
      user.paymentMethods.forEach((pm: any) => {
        pm.isDefault = false
      })
    }

    // If this is the first payment method, make it default
    if (!user.paymentMethods || user.paymentMethods.length === 0) {
      validatedData.isDefault = true
    }

    // Add new payment method
    if (!user.paymentMethods) {
      user.paymentMethods = []
    }
    user.paymentMethods.push(validatedData)

    await user.save()

    return NextResponse.json({
      success: true,
      message: 'Payment method added successfully',
      paymentMethod: user.paymentMethods[user.paymentMethods.length - 1]
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

    console.error('Error adding payment method:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

