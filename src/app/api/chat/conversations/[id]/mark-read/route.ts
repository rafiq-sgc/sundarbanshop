import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import ChatConversation from '@/models/Chat'

// POST /api/chat/conversations/[id]/mark-read - Mark messages as read
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const conversation = await ChatConversation.findById(params.id)

    if (!conversation) {
      return NextResponse.json(
        { success: false, message: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Check access
    if (session.user.role !== 'admin' && conversation.customerId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      )
    }

    const isAdmin = session.user.role === 'admin'

    // Mark all messages as read and reset unread count
    conversation.messages.forEach((msg: any) => {
      if (isAdmin && msg.sender === 'customer') {
        msg.read = true
      } else if (!isAdmin && msg.sender === 'admin') {
        msg.read = true
      }
    })

    if (isAdmin) {
      conversation.unreadAdminCount = 0
    } else {
      conversation.unreadCustomerCount = 0
    }

    await conversation.save()

    return NextResponse.json({
      success: true,
      message: 'Messages marked as read'
    })
  } catch (error: any) {
    console.error('Error marking as read:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to mark as read' },
      { status: 500 }
    )
  }
}

