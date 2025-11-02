export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import ChatConversation from '@/models/Chat'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const dateRange = searchParams.get('dateRange') || '7days'
    const format = searchParams.get('format') || 'csv'
    
    // Calculate date range
    const now = new Date()
    let startDate: Date
    
    switch (dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    // Get conversations
    const conversations = await ChatConversation.find({
      createdAt: { $gte: startDate, $lte: now }
    }).populate('assignedTo', 'name email')

    if (format === 'csv') {
      // Generate CSV data
      const csvData = generateCSV(conversations)
      
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="chat-analytics-${dateRange}.csv"`
        }
      })
    } else if (format === 'pdf') {
      // For PDF, we'll return a JSON response with data that can be used to generate PDF on frontend
      const reportData = {
        dateRange,
        generatedAt: now.toISOString(),
        summary: {
          totalConversations: conversations.length,
          activeChats: conversations.filter(conv => conv.status === 'active').length,
          resolvedChats: conversations.filter(conv => conv.status === 'resolved').length,
          totalMessages: conversations.reduce((total, conv) => total + (conv.messages?.length || 0), 0)
        },
        conversations: conversations.map(conv => ({
          id: conv._id,
          subject: conv.subject,
          customerName: conv.customerName,
          customerEmail: conv.customerEmail,
          status: conv.status,
          assignedTo: conv.assignedTo?.name || 'Unassigned',
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
          messageCount: conv.messages?.length || 0
        }))
      }

      return NextResponse.json({
        success: true,
        data: reportData
      })
    }

    return NextResponse.json({ success: false, message: 'Invalid format' }, { status: 400 })

  } catch (error) {
    console.error('Error exporting analytics:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to export analytics' },
      { status: 500 }
    )
  }
}

function generateCSV(conversations: any[]): string {
  const headers = [
    'Conversation ID',
    'Subject',
    'Customer Name',
    'Customer Email',
    'Status',
    'Priority',
    'Assigned To',
    'Created At',
    'Updated At',
    'Message Count',
    'First Response Time (min)',
    'Resolution Time (min)',
    'Last Message',
    'Tags'
  ]

  const rows = conversations.map(conv => {
    const convMessages = conv.messages || []
    const firstAdminMessage = convMessages
      .filter((msg: any) => msg.sender === 'admin')
      .sort((a: any, b: any) => a.timestamp.getTime() - b.timestamp.getTime())[0]
    
    const firstCustomerMessage = convMessages
      .filter((msg: any) => msg.sender === 'customer')
      .sort((a: any, b: any) => a.timestamp.getTime() - b.timestamp.getTime())[0]

    let firstResponseTime = 0
    if (firstAdminMessage && firstCustomerMessage) {
      firstResponseTime = (firstAdminMessage.timestamp.getTime() - firstCustomerMessage.timestamp.getTime()) / (1000 * 60)
    }

    let resolutionTime = 0
    if (conv.status === 'resolved' && conv.updatedAt) {
      resolutionTime = (conv.updatedAt.getTime() - conv.createdAt.getTime()) / (1000 * 60)
    }

    const lastMessage = convMessages.length > 0 
      ? convMessages[convMessages.length - 1]?.message || ''
      : ''

    return [
      conv._id,
      `"${conv.subject}"`,
      `"${conv.customerName || ''}"`,
      conv.customerEmail || '',
      conv.status,
      conv.priority || 'medium',
      `"${conv.assignedTo?.name || 'Unassigned'}"`,
      conv.createdAt.toISOString(),
      conv.updatedAt?.toISOString() || '',
      convMessages.length,
      firstResponseTime.toFixed(2),
      resolutionTime.toFixed(2),
      `"${lastMessage}"`,
      `"${(conv.tags || []).join(', ')}"`
    ]
  })

  const csvContent = [headers, ...rows]
    .map(row => row.join(','))
    .join('\n')

  return csvContent
}
