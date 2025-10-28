import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || 'all'

    await connectDB()

    // Build query
    const query: any = {}

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ]
    }

    if (role !== 'all') {
      query.role = role
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Execute query
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query)
    ])

    const pages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error('Admin users API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    const { name, email, phone, password, role = 'user', customerType = 'phone', canLogin = true } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json({
        success: false,
        message: 'Name is required'
      }, { status: 400 })
    }
    
    if (!phone) {
      return NextResponse.json({
        success: false,
        message: 'Phone number is required'
      }, { status: 400 })
    }
    
    // If email is provided, password is required
    if (email && email.trim() !== '') {
      if (!password || password.length < 6) {
        return NextResponse.json({
          success: false,
          message: 'Password must be at least 6 characters when email is provided'
        }, { status: 400 })
      }
    }

    await connectDB()

    // Check if user already exists (by email or phone)
    const existingUserQuery: any = { $or: [{ phone }] }
    if (email && email.trim() !== '') {
      existingUserQuery.$or.push({ email })
    }
    
    const existingUser = await User.findOne(existingUserQuery)
    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: 'User with this email or phone already exists'
      }, { status: 400 })
    }

    // Create new user
    const userData: any = {
      name,
      phone,
      role,
      customerType,
      canLogin: email && email.trim() !== '' ? canLogin : false
    }
    
    // Only add email and password if email is provided
    if (email && email.trim() !== '') {
      userData.email = email
      userData.password = password
    }
    
    const user = new User(userData)

    await user.save()

    // Return user without password, but include isNewUser flag and credentials if applicable
    const { password: _, ...userWithoutPassword } = user.toObject()

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: {
        ...userWithoutPassword,
        isNewUser: true,
        // Include plain password in response ONLY if email provided (for welcome email)
        temporaryPassword: email && email.trim() !== '' ? password : null
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
