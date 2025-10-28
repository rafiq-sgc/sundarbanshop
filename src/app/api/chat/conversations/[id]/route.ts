import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import ChatConversation from '@/models/Chat'

// GET /api/chat/conversations/[id] - Get single conversation
export async function GET(
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
      .populate('customerId', 'name email')
      .lean()

    if (!conversation) {
      return NextResponse.json(
        { success: false, message: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Check if user has access
    if (session.user.role !== 'admin' && (conversation as any).customerId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...conversation,
        id: (conversation as any)._id.toString(),
        customerId: (conversation as any).customerId.toString()
      }
    })
  } catch (error: any) {
    console.error('Error fetching conversation:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch conversation' },
      { status: 500 }
    )
  }
}

// PATCH /api/chat/conversations/[id] - Update conversation (status, priority, assign)
export async function PATCH(
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

    // Only admins can update conversations
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Admin access required.' },
        { status: 403 }
      )
    }

    await connectDB()

    const body = await request.json()
    const { status, priority, assignedTo, tags } = body

    const updateData: any = {}
    if (status) updateData.status = status
    if (priority) updateData.priority = priority
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo
    if (tags) updateData.tags = tags

    const conversation = await ChatConversation.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    )

    if (!conversation) {
      return NextResponse.json(
        { success: false, message: 'Conversation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Conversation updated successfully',
      data: {
        ...conversation.toObject(),
        id: conversation._id.toString()
      }
    })
  } catch (error: any) {
    console.error('Error updating conversation:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update conversation' },
      { status: 500 }
    )
  }
}

// DELETE /api/chat/conversations/[id] - Delete conversation (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    await connectDB()

    const conversation = await ChatConversation.findByIdAndDelete(params.id)

    if (!conversation) {
      return NextResponse.json(
        { success: false, message: 'Conversation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting conversation:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete conversation' },
      { status: 500 }
    )
  }
}

