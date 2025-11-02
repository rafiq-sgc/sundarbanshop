export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Coupon from '@/models/Coupon'
import ActivityLog from '@/models/ActivityLog'

// GET - Get all coupons with filters
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
    const type = searchParams.get('type') || ''
    const isActive = searchParams.get('isActive') || ''
    const status = searchParams.get('status') || '' // active, expired, upcoming

    // Build query
    const query: any = {}

    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    if (type) {
      query.type = type
    }

    if (isActive) {
      query.isActive = isActive === 'true'
    }

    // Status filter (active, expired, upcoming)
    const now = new Date()
    if (status === 'expired') {
      query.endDate = { $lt: now }
    } else if (status === 'upcoming') {
      query.startDate = { $gt: now }
    } else if (status === 'active') {
      query.isActive = true
      query.$or = [
        { startDate: { $exists: false } },
        { startDate: { $lte: now } }
      ]
      query.$and = [
        {
          $or: [
            { endDate: { $exists: false } },
            { endDate: { $gte: now } }
          ]
        }
      ]
    }

    const coupons = await Coupon.find(query)
      .populate('createdBy', 'name email')
      .populate('applicableCategories', 'name')
      .sort({ createdAt: -1 })
      .lean()

    // Calculate stats
    const stats = {
      total: await Coupon.countDocuments(),
      active: await Coupon.countDocuments({ 
        isActive: true,
        $or: [
          { endDate: { $exists: false } },
          { endDate: { $gte: now } }
        ]
      }),
      expired: await Coupon.countDocuments({ endDate: { $lt: now } }),
      percentage: await Coupon.countDocuments({ type: 'percentage' }),
      fixed: await Coupon.countDocuments({ type: 'fixed' })
    }

    return NextResponse.json({
      success: true,
      data: {
        coupons,
        stats
      }
    })

  } catch (error: any) {
    console.error('Error fetching coupons:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch coupons' },
      { status: 500 }
    )
  }
}

// POST - Create new coupon
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

    // Validate coupon code uniqueness
    const existing = await Coupon.findOne({ code: body.code.toUpperCase() })
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Coupon code already exists' },
        { status: 400 }
      )
    }

    // Create coupon
    const coupon = await Coupon.create({
      ...body,
      code: body.code.toUpperCase(),
      createdBy: session.user.id,
      usageCount: 0,
      usedBy: []
    })

    // Log activity
    await ActivityLog.create({
      user: session.user.id,
      action: 'CREATE',
      entity: 'Coupon',
      entityId: coupon._id,
      description: `Created coupon: ${coupon.code}`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      metadata: {
        couponCode: coupon.code,
        couponType: coupon.type,
        couponValue: coupon.value
      }
    })

    return NextResponse.json({
      success: true,
      data: coupon,
      message: 'Coupon created successfully'
    })

  } catch (error: any) {
    console.error('Error creating coupon:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create coupon' },
      { status: 500 }
    )
  }
}

