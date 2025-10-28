import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import ChatConversation from '@/models/Chat'
import User from '@/models/User'

// GET /api/chat/conversations - Get all conversations (for admin) or user's conversations
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')

    let query: any = {}

    // If admin, can see all conversations
    if (session.user.role === 'admin') {
      if (status && status !== 'all') {
        query.status = status
      }
      if (customerId) {
        query.customerId = customerId
      }
    } else {
      // Regular users can only see their own conversations
      query.customerId = session.user.id
    }

    const conversations = await ChatConversation.find(query)
      .sort({ lastMessageTime: -1 })
      .populate('customerId', 'name email')
      .lean()

    // Transform for frontend
    const transformedConversations = conversations.map((conv: any) => ({
      ...conv,
      id: conv._id.toString(),
      customerId: conv.customerId.toString(),
      // For admin, show unread count from customer messages
      // For customer, show unread count from admin messages
      unreadCount: session.user.role === 'admin' ? conv.unreadAdminCount : conv.unreadCustomerCount
    }))

    return NextResponse.json({
      success: true,
      data: transformedConversations
    })
  } catch (error: any) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

// POST /api/chat/conversations - Create new conversation
export async function POST(request: NextRequest) {
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
    const { subject, message, customerName, customerEmail } = body

    if (!subject || !message) {
      return NextResponse.json(
        { success: false, message: 'Subject and message are required' },
        { status: 400 }
      )
    }

    // Get customer info
    let customerId = session.user.id
    let name = customerName || session.user.name
    let email = customerEmail || session.user.email

    // If admin creating on behalf of customer
    if (session.user.role === 'admin' && customerEmail) {
      const customer = await User.findOne({ email: customerEmail })
      if (customer) {
        customerId = customer._id.toString()
        name = customer.name
        email = customer.email
      }
    }

    const conversation = await ChatConversation.create({
      customerId,
      customerName: name,
      customerEmail: email,
      subject,
      lastMessage: message,
      status: 'pending',
      priority: 'medium',
      unreadAdminCount: 1, // Admin needs to read this
      unreadCustomerCount: 0,
      messages: [{
        sender: 'customer',
        senderName: name,
        message,
        timestamp: new Date(),
        read: false
      }]
    })

    return NextResponse.json({
      success: true,
      message: 'Conversation created successfully',
      data: {
        ...conversation.toObject(),
        id: conversation._id.toString()
      }
    })
  } catch (error: any) {
    console.error('Error creating conversation:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create conversation' },
      { status: 500 }
    )
  }
}

