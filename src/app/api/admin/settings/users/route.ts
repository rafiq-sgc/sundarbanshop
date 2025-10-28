import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import ActivityLog from '@/models/ActivityLog'

// GET - Get all admin users
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const isActive = searchParams.get('isActive') || ''

    // Build query - only get admin users
    const query: any = { role: 'admin' }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }

    if (isActive) {
      query.isActive = isActive === 'true'
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .lean()

    // Get statistics
    const stats = {
      total: await User.countDocuments({ role: 'admin' }),
      active: await User.countDocuments({ role: 'admin', isActive: true }),
      inactive: await User.countDocuments({ role: 'admin', isActive: false })
    }

    return NextResponse.json({
      success: true,
      data: {
        users,
        stats
      }
    })

  } catch (error: any) {
    console.error('Error fetching admin users:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST - Create new admin user
export async function POST(request: NextRequest) {
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
    const { name, email, password, phone, isActive, notes } = body

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { success: false, message: 'Name and email are required' },
        { status: 400 }
      )
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Email already exists' },
        { status: 400 }
      )
    }

    // Create admin user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: 'admin',
      isActive: isActive !== false,
      emailVerified: true,
      canLogin: true,
      customerType: 'online',
      createdBy: session.user.id,
      notes
    })

    // Log activity
    await ActivityLog.create({
      user: session.user.id,
      action: 'CREATE',
      entity: 'User',
      entityId: user._id,
      description: `Created admin user: ${user.email}`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      metadata: {
        userRole: 'admin',
        userName: user.name,
        userEmail: user.email
      }
    })

    // Remove password from response
    const userResponse = user.toJSON()

    return NextResponse.json({
      success: true,
      data: userResponse,
      message: 'Admin user created successfully'
    })

  } catch (error: any) {
    console.error('Error creating admin user:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create user' },
      { status: 500 }
    )
  }
}

