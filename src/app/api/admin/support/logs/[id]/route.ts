import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import ChatConversation from '@/models/Chat'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is admin
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const conversation = await ChatConversation.findById(params.id)
      .populate('assignedTo', 'name email')
      .lean()

    if (!conversation) {
      return NextResponse.json(
        { success: false, message: 'Log not found' },
        { status: 404 }
      )
    }

    const messages = (conversation as any).messages || []
    
    // Calculate duration
    let duration = 0
    if ((conversation as any).updatedAt && (conversation as any).createdAt) {
      duration = Math.floor((new Date((conversation as any).updatedAt).getTime() - new Date((conversation as any).createdAt).getTime()) / 1000)
    }
    
    const hours = Math.floor(duration / 3600)
    const minutes = Math.floor((duration % 3600) / 60)
    const seconds = duration % 60
    const durationStr = hours > 0 
      ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      : `${minutes}:${seconds.toString().padStart(2, '0')}`

    // Determine status
    let logStatus: 'completed' | 'abandoned' | 'transferred' = 'completed'
    if ((conversation as any).status === 'resolved') {
      logStatus = 'completed'
    } else if ((conversation as any).status === 'pending' && (conversation as any).updatedAt && 
               new Date((conversation as any).updatedAt).getTime() < Date.now() - 24 * 60 * 60 * 1000) {
      logStatus = 'abandoned'
    } else if ((conversation as any).assignedTo) {
      logStatus = 'transferred'
    }

    // Calculate satisfaction (mock - you can add this field to your schema)
    const satisfaction = (conversation as any).status === 'resolved' ? Math.floor(Math.random() * 2) + 4 : null

    const log = {
      id: (conversation as any)._id.toString(),
      conversationId: (conversation as any)._id.toString(),
      timestamp: (conversation as any).createdAt,
      customerName: (conversation as any).customerName,
      customerEmail: (conversation as any).customerEmail,
      customerId: (conversation as any).customerId?.toString() || null,
      agentName: (conversation as any).assignedTo?.name || 'Unassigned',
      agentEmail: (conversation as any).assignedTo?.email || null,
      agentId: (conversation as any).assignedTo?._id?.toString() || null,
      status: logStatus,
      duration: durationStr,
      durationSeconds: duration,
      messages: messages.length,
      satisfaction,
      tags: (conversation as any).tags || [],
      issue: (conversation as any).subject,
      priority: (conversation as any).priority || 'medium',
      transcript: messages.map((msg: any) => ({
        sender: msg.sender,
        senderName: msg.senderName,
        message: msg.message,
        timestamp: msg.timestamp,
        read: msg.read
      }))
    }

    return NextResponse.json({
      success: true,
      data: log
    })

  } catch (error) {
    console.error('Error fetching log details:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch log details' },
      { status: 500 }
    )
  }
}

