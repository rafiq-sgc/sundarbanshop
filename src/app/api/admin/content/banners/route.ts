import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Banner from '@/models/Banner'
import ActivityLog from '@/models/ActivityLog'
import '@/models/User'

// GET - Get all banners
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
    const position = searchParams.get('position') || ''
    const status = searchParams.get('status') || ''

    // Build query
    const query: any = {}

    if (position && position !== 'all') {
      query.position = position
    }

    if (status === 'active') {
      query.isActive = true
    } else if (status === 'inactive') {
      query.isActive = false
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    // Get banners
    const banners = await Banner.find(query)
      .populate('createdBy', 'name email')
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean()

    // Get statistics
    const stats = {
      total: await Banner.countDocuments(),
      active: await Banner.countDocuments({ isActive: true }),
      inactive: await Banner.countDocuments({ isActive: false }),
      hero: await Banner.countDocuments({ position: 'hero' }),
      totalClicks: await Banner.aggregate([
        { $group: { _id: null, total: { $sum: '$clicks' } } }
      ]).then(result => result[0]?.total || 0)
    }

    return NextResponse.json({
      success: true,
      data: {
        banners: banners.map(banner => ({
          ...banner,
          createdBy: (banner as any).createdBy?.name || 'Unknown'
        })),
        stats
      }
    })

  } catch (error: any) {
    console.error('Error fetching banners:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch banners' },
      { status: 500 }
    )
  }
}

// POST - Create banner
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
    const {
      title,
      description,
      image,
      mobileImage,
      link,
      linkText,
      position,
      isActive,
      sortOrder,
      startDate,
      endDate
    } = body

    // Validate required fields
    if (!title || !image || !position) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create banner
    const banner = await Banner.create({
      title,
      description,
      image,
      mobileImage,
      link,
      linkText,
      position,
      isActive: isActive !== undefined ? isActive : true,
      sortOrder: sortOrder || 0,
      startDate,
      endDate,
      clicks: 0,
      createdBy: session.user.id
    })

    // Populate creator
    await banner.populate('createdBy', 'name email')

    // Log activity
    await ActivityLog.create({
      user: session.user.id,
      action: 'CREATE',
      entity: 'Banner',
      entityId: banner._id,
      description: `Created banner: ${title}`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      metadata: {
        title,
        position,
        isActive
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Banner created successfully',
      data: {
        ...banner.toObject(),
        createdBy: (banner as any).createdBy?.name || 'Unknown'
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error creating banner:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create banner' },
      { status: 500 }
    )
  }
}

