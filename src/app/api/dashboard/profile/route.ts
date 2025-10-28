import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

// Validation schema for profile update
const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').optional().or(z.literal('')),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').optional(),
  confirmPassword: z.string().optional()
}).refine(data => {
  // If changing password, all password fields are required
  if (data.newPassword || data.confirmPassword || data.currentPassword) {
    return !!(data.currentPassword && data.newPassword && data.confirmPassword)
  }
  return true
}, {
  message: 'All password fields are required when changing password',
  path: ['currentPassword']
}).refine(data => {
  // New password and confirm password must match
  if (data.newPassword && data.confirmPassword) {
    return data.newPassword === data.confirmPassword
  }
  return true
}, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

// GET - Get current user profile
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

    const user = await User.findById(session.user.id).select('-password')

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update user profile
export async function PATCH(request: NextRequest) {
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
    const validatedData = updateProfileSchema.parse(body)

    const user = await User.findById(session.user.id)

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Update basic fields
    if (validatedData.name) {
      user.name = validatedData.name
    }

    // Update email (convert empty string to null)
    if ('email' in validatedData) {
      if (validatedData.email && validatedData.email.trim() !== '') {
        // Check if email already exists (for other users)
        const existingUser = await User.findOne({ 
          email: validatedData.email,
          _id: { $ne: user._id }
        })
        
        if (existingUser) {
          return NextResponse.json(
            { success: false, message: 'Email already in use by another account' },
            { status: 400 }
          )
        }
        
        user.email = validatedData.email.trim()
      }
    }

    // Update phone (convert empty string to null)
    if ('phone' in validatedData) {
      if (validatedData.phone && validatedData.phone.trim() !== '') {
        // Check if phone already exists (for other users)
        const existingUser = await User.findOne({ 
          phone: validatedData.phone,
          _id: { $ne: user._id }
        })
        
        if (existingUser) {
          return NextResponse.json(
            { success: false, message: 'Phone number already in use by another account' },
            { status: 400 }
          )
        }
        
        user.phone = validatedData.phone.trim()
      }
    }

    // Change password if requested
    if (validatedData.currentPassword && validatedData.newPassword) {
      // Verify current password
      if (!user.password) {
        return NextResponse.json(
          { success: false, message: 'Account has no password set' },
          { status: 400 }
        )
      }

      const isValidPassword = await bcrypt.compare(validatedData.currentPassword, user.password)
      
      if (!isValidPassword) {
        return NextResponse.json(
          { success: false, message: 'Current password is incorrect' },
          { status: 400 }
        )
      }

      // Set new password (will be hashed by pre-save hook)
      user.password = validatedData.newPassword
    }

    await user.save()

    // Return updated user without password
    const updatedUser = await User.findById(user._id).select('-password')

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
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

    console.error('Error updating profile:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

