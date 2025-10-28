import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import ChatConversation from '@/models/Chat'

// POST /api/chat/conversations/[id]/messages - Send a message
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

    const body = await request.json()
    const { message, attachments } = body

    if (!message || !message.trim()) {
      return NextResponse.json(
        { success: false, message: 'Message cannot be empty' },
        { status: 400 }
      )
    }

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

    // Determine sender
    const isAdmin = session.user.role === 'admin'
    const sender = isAdmin ? 'admin' : 'customer'

    // Create new message
    const newMessage = {
      sender,
      senderName: session.user.name || 'User',
      senderAvatar: (session.user as any).image,
      message: message.trim(),
      timestamp: new Date(),
      read: false,
      attachments: attachments || []
    }

    // Add message to conversation
    conversation.messages.push(newMessage as any)
    
    // Update unread counts
    if (isAdmin) {
      conversation.unreadCustomerCount += 1
      conversation.unreadAdminCount = 0 // Admin has read all customer messages
    } else {
      conversation.unreadAdminCount += 1
      conversation.unreadCustomerCount = 0 // Customer has read all admin messages
    }

    // Update status if it was resolved
    if (conversation.status === 'resolved') {
      conversation.status = 'active'
    }

    await conversation.save()

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      data: {
        ...conversation.toObject(),
        id: conversation._id.toString()
      }
    })
  } catch (error: any) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to send message' },
      { status: 500 }
    )
  }
}

