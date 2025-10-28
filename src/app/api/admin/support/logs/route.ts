import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import ChatConversation from '@/models/Chat'
import User from '@/models/User'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const dateRange = searchParams.get('dateRange') || '7days'
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    switch (dateRange) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        break
      case '7days':
        startDate.setDate(now.getDate() - 7)
        break
      case '30days':
        startDate.setDate(now.getDate() - 30)
        break
      case '90days':
        startDate.setDate(now.getDate() - 90)
        break
      default:
        startDate.setDate(now.getDate() - 7)
    }

    // Build query
    const query: any = {
      createdAt: { $gte: startDate, $lte: now },
      status: { $in: ['resolved', 'active', 'pending'] }
    }

    // Add status filter
    if (status !== 'all') {
      if (status === 'completed') {
        query.status = 'resolved'
      } else if (status === 'abandoned') {
        // We'll mark conversations as abandoned if they're pending with no recent messages
        query.status = 'pending'
        query.updatedAt = { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      } else if (status === 'transferred') {
        query.assignedTo = { $exists: true }
      }
    }

    // Fetch conversations
    let conversations = await ChatConversation.find(query)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Get total count for pagination
    const totalCount = await ChatConversation.countDocuments(query)

    // Process conversations into log format
    const logs = conversations.map(conv => {
      const messages = (conv as any).messages || []
      const firstMessage = messages[0]
      const lastMessage = messages[messages.length - 1]
      
      // Calculate duration
      let duration = 0
      if ((conv as any).updatedAt && (conv as any).createdAt) {
        duration = Math.floor((new Date((conv as any).updatedAt).getTime() - new Date((conv as any).createdAt).getTime()) / 1000)
      }
      
      const hours = Math.floor(duration / 3600)
      const minutes = Math.floor((duration % 3600) / 60)
      const seconds = duration % 60
      const durationStr = hours > 0 
        ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        : `${minutes}:${seconds.toString().padStart(2, '0')}`

      // Determine status
      let logStatus: 'completed' | 'abandoned' | 'transferred' = 'completed'
      if ((conv as any).status === 'resolved') {
        logStatus = 'completed'
      } else if ((conv as any).status === 'pending' && (conv as any).updatedAt && 
                 new Date((conv as any).updatedAt).getTime() < Date.now() - 24 * 60 * 60 * 1000) {
        logStatus = 'abandoned'
      } else if ((conv as any).assignedTo) {
        logStatus = 'transferred'
      }

      // Calculate satisfaction (mock - you can add this field to your schema)
      const satisfaction = (conv as any).status === 'resolved' ? Math.floor(Math.random() * 2) + 4 : null

      return {
        id: (conv as any)._id.toString(),
        conversationId: (conv as any)._id.toString(),
        timestamp: (conv as any).createdAt,
        customerName: (conv as any).customerName,
        customerEmail: (conv as any).customerEmail,
        customerId: (conv as any).customerId?.toString() || null,
        agentName: (conv as any).assignedTo?.name || 'Unassigned',
        agentId: (conv as any).assignedTo?._id?.toString() || null,
        status: logStatus,
        duration: durationStr,
        durationSeconds: duration,
        messages: messages.length,
        satisfaction,
        tags: (conv as any).tags || [],
        issue: (conv as any).subject,
        priority: (conv as any).priority || 'medium',
        transcript: messages.map((msg: any) => ({
          sender: msg.sender,
          senderName: msg.senderName,
          message: msg.message,
          timestamp: msg.timestamp,
          read: msg.read
        }))
      }
    })

    // Apply search filter (client-side for now)
    const filteredLogs = search
      ? logs.filter(log => 
          log.customerName?.toLowerCase().includes(search.toLowerCase()) ||
          log.customerEmail?.toLowerCase().includes(search.toLowerCase()) ||
          log.issue?.toLowerCase().includes(search.toLowerCase()) ||
          log.agentName?.toLowerCase().includes(search.toLowerCase())
        )
      : logs

    // Calculate summary statistics
    const summary = {
      totalLogs: totalCount,
      completed: logs.filter(l => l.status === 'completed').length,
      abandoned: logs.filter(l => l.status === 'abandoned').length,
      transferred: logs.filter(l => l.status === 'transferred').length,
      avgDuration: logs.length > 0
        ? Math.floor(logs.reduce((sum: number, l) => sum + l.durationSeconds, 0) / logs.length)
        : 0,
      totalMessages: logs.reduce((sum: number, l) => sum + l.messages, 0)
    }

    // Format average duration
    const avgHours = Math.floor(summary.avgDuration / 3600)
    const avgMinutes = Math.floor((summary.avgDuration % 3600) / 60)
    const avgSeconds = summary.avgDuration % 60
    const avgDurationStr = avgHours > 0
      ? `${avgHours}:${avgMinutes.toString().padStart(2, '0')}:${avgSeconds.toString().padStart(2, '0')}`
      : `${avgMinutes}:${avgSeconds.toString().padStart(2, '0')}`

    return NextResponse.json({
      success: true,
      data: {
        logs: filteredLogs,
        summary: {
          ...summary,
          avgDurationFormatted: avgDurationStr
        },
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
          totalCount
        }
      }
    })

  } catch (error) {
    console.error('Error fetching chat logs:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch chat logs' },
      { status: 500 }
    )
  }
}

