import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import ActivityLog from '@/models/ActivityLog'

// GET - Get single activity log
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const log = await ActivityLog.findById(params.id)
      .populate('user', 'name email role avatar')
      .lean()

    if (!log) {
      return NextResponse.json(
        { success: false, message: 'Activity log not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: log
    })

  } catch (error: any) {
    console.error('Error fetching activity log:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch activity log' },
      { status: 500 }
    )
  }
}

