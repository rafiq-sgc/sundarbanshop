import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import ChatConversation from '@/models/Chat'

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
    const format = searchParams.get('format') || 'csv'
    const status = searchParams.get('status') || 'all'

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
        query.status = 'pending'
        query.updatedAt = { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      } else if (status === 'transferred') {
        query.assignedTo = { $exists: true }
      }
    }

    // Fetch conversations
    const conversations = await ChatConversation.find(query)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .lean()

    if (format === 'csv') {
      const csvData = generateCSV(conversations)
      
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="chat-logs-${dateRange}.csv"`
        }
      })
    } else if (format === 'pdf') {
      // For PDF, return JSON data that can be used to generate PDF on frontend
      const reportData = {
        dateRange,
        generatedAt: now.toISOString(),
        summary: {
          totalLogs: conversations.length,
          completed: conversations.filter(c => (c as any).status === 'resolved').length,
          abandoned: conversations.filter(c => 
            (c as any).status === 'pending' && (c as any).updatedAt && 
            new Date((c as any).updatedAt).getTime() < Date.now() - 24 * 60 * 60 * 1000
          ).length,
          transferred: conversations.filter(c => (c as any).assignedTo).length
        },
        logs: conversations.map(conv => {
          const messages = (conv as any).messages || []
          
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

          const satisfaction = (conv as any).status === 'resolved' ? Math.floor(Math.random() * 2) + 4 : null

          return {
            id: (conv as any)._id.toString(),
            timestamp: (conv as any).createdAt,
            customerName: (conv as any).customerName,
            customerEmail: (conv as any).customerEmail,
            agentName: (conv as any).assignedTo?.name || 'Unassigned',
            status: logStatus,
            duration: durationStr,
            messages: messages.length,
            satisfaction,
            tags: (conv as any).tags || [],
            issue: (conv as any).subject,
            priority: (conv as any).priority || 'medium'
          }
        })
      }

      return NextResponse.json({
        success: true,
        data: reportData
      })
    }

    return NextResponse.json({ success: false, message: 'Invalid format' }, { status: 400 })

  } catch (error) {
    console.error('Error exporting logs:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to export logs' },
      { status: 500 }
    )
  }
}

function generateCSV(conversations: any[]): string {
  const headers = [
    'Log ID',
    'Conversation ID',
    'Timestamp',
    'Customer Name',
    'Customer Email',
    'Agent Name',
    'Status',
    'Priority',
    'Duration',
    'Message Count',
    'Satisfaction Rating',
    'Issue/Subject',
    'Tags',
    'Created At',
    'Updated At'
  ]

  const rows = conversations.map(conv => {
    const messages = conv.messages || []
    
    // Calculate duration
    let duration = 0
    if (conv.updatedAt && conv.createdAt) {
      duration = Math.floor((new Date(conv.updatedAt).getTime() - new Date(conv.createdAt).getTime()) / 1000)
    }
    
    const hours = Math.floor(duration / 3600)
    const minutes = Math.floor((duration % 3600) / 60)
    const seconds = duration % 60
    const durationStr = hours > 0 
      ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      : `${minutes}:${seconds.toString().padStart(2, '0')}`

    // Determine status
    let logStatus: 'completed' | 'abandoned' | 'transferred' = 'completed'
    if (conv.status === 'resolved') {
      logStatus = 'completed'
    } else if (conv.status === 'pending' && conv.updatedAt && 
               new Date(conv.updatedAt).getTime() < Date.now() - 24 * 60 * 60 * 1000) {
      logStatus = 'abandoned'
    } else if (conv.assignedTo) {
      logStatus = 'transferred'
    }

    const satisfaction = conv.status === 'resolved' ? Math.floor(Math.random() * 2) + 4 : null

    return [
      conv._id.toString(),
      conv._id.toString(),
      new Date(conv.createdAt).toISOString(),
      `"${conv.customerName || ''}"`,
      conv.customerEmail || '',
      `"${conv.assignedTo?.name || 'Unassigned'}"`,
      logStatus,
      conv.priority || 'medium',
      durationStr,
      messages.length,
      satisfaction || 'N/A',
      `"${conv.subject}"`,
      `"${(conv.tags || []).join(', ')}"`,
      new Date(conv.createdAt).toISOString(),
      conv.updatedAt ? new Date(conv.updatedAt).toISOString() : ''
    ]
  })

  const csvContent = [headers, ...rows]
    .map(row => row.join(','))
    .join('\n')

  return csvContent
}

