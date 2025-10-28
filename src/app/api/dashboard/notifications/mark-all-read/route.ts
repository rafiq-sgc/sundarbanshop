import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Notification from '@/models/Notification'

// PATCH - Mark all as read
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

    await Notification.updateMany(
      { userId: session.user.id, read: false },
      { read: true }
    )

    return NextResponse.json({
      success: true,
      message: 'All notifications marked as read'
    })
  } catch (error) {
    console.error('Error marking all as read:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

