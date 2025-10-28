import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { z } from 'zod'

// Validation schema for update (all fields optional)
const updateAddressSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  phone: z.string().min(10, 'Phone number is required').optional(),
  address: z.string().min(1, 'Address is required').optional(),
  city: z.string().min(1, 'City is required').optional(),
  state: z.string().min(1, 'State is required').optional(),
  zipCode: z.string().min(1, 'ZIP code is required').optional(),
  country: z.string().min(1, 'Country is required').optional(),
  isDefault: z.boolean().optional(),
  type: z.enum(['home', 'work', 'other']).optional()
})

// PATCH - Update address
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
    
    // Validate input
    const validatedData = updateAddressSchema.parse(body)

    const user = await User.findById(session.user.id)

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.address || user.address.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No addresses found' },
        { status: 404 }
      )
    }

    // Find the address to update
    const addressIndex = user.address.findIndex(
      (addr: any) => addr._id.toString() === params.id
    )

    if (addressIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Address not found' },
        { status: 404 }
      )
    }

    // If setting as default, unset all other defaults
    if (validatedData.isDefault) {
      user.address.forEach((addr: any, index: number) => {
        if (index !== addressIndex) {
          addr.isDefault = false
        }
      })
    }

    // Update address fields
    Object.assign(user.address[addressIndex], validatedData)

    await user.save()

    return NextResponse.json({
      success: true,
      message: 'Address updated successfully',
      address: user.address[addressIndex]
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

    console.error('Error updating address:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete address
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

    if (!user.address || user.address.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No addresses found' },
        { status: 404 }
      )
    }

    // Find the address to delete
    const addressIndex = user.address.findIndex(
      (addr: any) => addr._id.toString() === params.id
    )

    if (addressIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Address not found' },
        { status: 404 }
      )
    }

    // Check if trying to delete default address
    const addressToDelete = user.address[addressIndex]
    if (addressToDelete.isDefault && user.address.length > 1) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Cannot delete default address. Please set another address as default first.' 
        },
        { status: 400 }
      )
    }

    // Remove address
    user.address.splice(addressIndex, 1)

    // If no addresses left, no problem
    // If addresses remain and none are default, set first as default
    if (user.address.length > 0 && !user.address.some((addr: any) => addr.isDefault)) {
      user.address[0].isDefault = true
    }

    await user.save()

    return NextResponse.json({
      success: true,
      message: 'Address deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting address:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

