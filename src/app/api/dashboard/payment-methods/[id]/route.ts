import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { z } from 'zod'

const updatePaymentMethodSchema = z.object({
  type: z.enum(['card', 'bkash', 'nagad', 'rocket', 'bank']).optional(),
  isDefault: z.boolean().optional(),
  cardNumber: z.string().optional(),
  cardHolderName: z.string().optional(),
  expiryDate: z.string().optional(),
  accountNumber: z.string().optional(),
  accountName: z.string().optional(),
  bankName: z.string().optional(),
  accountHolderName: z.string().optional(),
  routingNumber: z.string().optional()
})

// PATCH - Update payment method
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const validatedData = updatePaymentMethodSchema.parse(body)

    const user = await User.findById(session.user.id)

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.paymentMethods || user.paymentMethods.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No payment methods found' },
        { status: 404 }
      )
    }

    const pmIndex = user.paymentMethods.findIndex(
      (pm: any) => pm._id.toString() === params.id
    )

    if (pmIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Payment method not found' },
        { status: 404 }
      )
    }

    // If setting as default, unset all other defaults
    if (validatedData.isDefault) {
      user.paymentMethods.forEach((pm: any, index: number) => {
        if (index !== pmIndex) {
          pm.isDefault = false
        }
      })
    }

    // Update payment method fields
    Object.assign(user.paymentMethods[pmIndex], validatedData)

    await user.save()

    return NextResponse.json({
      success: true,
      message: 'Payment method updated successfully',
      paymentMethod: user.paymentMethods[pmIndex]
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

    console.error('Error updating payment method:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete payment method
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const user = await User.findById(session.user.id)

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.paymentMethods || user.paymentMethods.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No payment methods found' },
        { status: 404 }
      )
    }

    const pmIndex = user.paymentMethods.findIndex(
      (pm: any) => pm._id.toString() === params.id
    )

    if (pmIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Payment method not found' },
        { status: 404 }
      )
    }

    const pmToDelete = user.paymentMethods[pmIndex]
    if (pmToDelete.isDefault && user.paymentMethods.length > 1) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Cannot delete default payment method. Please set another method as default first.' 
        },
        { status: 400 }
      )
    }

    // Remove payment method
    user.paymentMethods.splice(pmIndex, 1)

    // If no payment methods left, no problem
    // If payment methods remain and none are default, set first as default
    if (user.paymentMethods.length > 0 && !user.paymentMethods.some((pm: any) => pm.isDefault)) {
      user.paymentMethods[0].isDefault = true
    }

    await user.save()

    return NextResponse.json({
      success: true,
      message: 'Payment method deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting payment method:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

