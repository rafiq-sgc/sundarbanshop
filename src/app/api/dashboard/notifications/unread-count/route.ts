import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Notification from '@/models/Notification'

// GET - Get unread count
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

    const unreadCount = await Notification.countDocuments({ 
      userId: session.user.id,
      read: false 
    })

    return NextResponse.json({
      success: true,
      unreadCount
    })
  } catch (error) {
    console.error('Error fetching unread count:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

