import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import ActivityLog from '@/models/ActivityLog'

// GET - Get activity logs with filters and pagination
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
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Filters
    const action = searchParams.get('action') || ''
    const entity = searchParams.get('entity') || ''
    const userId = searchParams.get('userId') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    const search = searchParams.get('search') || ''

    // Build query
    const query: any = {}

    if (action) {
      query.action = action
    }

    if (entity) {
      query.entity = entity
    }

    if (userId) {
      query.user = userId
    }

    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) {
        query.createdAt.$gte = new Date(startDate)
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate)
      }
    }

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { ipAddress: { $regex: search, $options: 'i' } }
      ]
    }

    // Get logs with pagination
    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .populate('user', 'name email role avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ActivityLog.countDocuments(query)
    ])

    // Get statistics
    const stats = {
      total: await ActivityLog.countDocuments(),
      today: await ActivityLog.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      thisWeek: await ActivityLog.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),
      thisMonth: await ActivityLog.countDocuments({
        createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
      }),
      byAction: await ActivityLog.aggregate([
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      byEntity: await ActivityLog.aggregate([
        { $group: { _id: '$entity', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    }

    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        stats
      }
    })

  } catch (error: any) {
    console.error('Error fetching activity logs:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch activity logs' },
      { status: 500 }
    )
  }
}

// POST - Create activity log (for manual logging)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const body = await request.json()
    const { action, entity, entityId, description, metadata } = body

    // Get IP and User Agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const log = await ActivityLog.create({
      user: session.user.id,
      action: action.toUpperCase(),
      entity,
      entityId,
      description,
      ipAddress,
      userAgent,
      metadata
    })

    return NextResponse.json({
      success: true,
      data: log,
      message: 'Activity logged successfully'
    })

  } catch (error: any) {
    console.error('Error creating activity log:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create activity log' },
      { status: 500 }
    )
  }
}

// DELETE - Clear old logs (admin only)
export async function DELETE(request: NextRequest) {
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
    const days = parseInt(searchParams.get('days') || '90')

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const result = await ActivityLog.deleteMany({
      createdAt: { $lt: cutoffDate }
    })

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.deletedCount} logs older than ${days} days`
    })

  } catch (error: any) {
    console.error('Error deleting activity logs:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete activity logs' },
      { status: 500 }
    )
  }
}

