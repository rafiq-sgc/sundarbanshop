import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { z } from 'zod'

// Validation schema
const addressSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'ZIP code is required'),
  country: z.string().min(1, 'Country is required'),
  isDefault: z.boolean().default(false),
  type: z.enum(['home', 'work', 'other']).optional().default('home')
})

// GET - Get all addresses for current user
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
      data: user.address || []
    })
  } catch (error) {
    console.error('Error fetching addresses:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Add new address
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
    
    // Validate input
    const validatedData = addressSchema.parse(body)

    const user = await User.findById(session.user.id)

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // If this is set as default, unset all other defaults
    if (validatedData.isDefault && user.address) {
      user.address.forEach((addr: any) => {
        addr.isDefault = false
      })
    }

    // If this is the first address, make it default
    if (!user.address || user.address.length === 0) {
      validatedData.isDefault = true
    }

    // Add new address
    if (!user.address) {
      user.address = []
    }
    user.address.push(validatedData)

    await user.save()

    return NextResponse.json({
      success: true,
      message: 'Address added successfully',
      address: user.address[user.address.length - 1]
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

    console.error('Error adding address:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

