export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import ChatConversation from '@/models/Chat'
import User from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const dateRange = searchParams.get('dateRange') || '7days'
    
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

    // Get all conversations in date range
    const conversations = await ChatConversation.find({
      createdAt: { $gte: startDate, $lte: now }
    }).populate('assignedTo', 'name email')

    // Get all messages from conversations in date range
    const messages = conversations.flatMap(conv => conv.messages || [])

    // Calculate basic statistics
    const totalConversations = conversations.length
    const activeChats = conversations.filter(conv => conv.status === 'active').length
    const resolvedToday = conversations.filter(conv => 
      conv.status === 'resolved' && 
      conv.updatedAt && 
      conv.updatedAt.toDateString() === now.toDateString()
    ).length

    // Calculate response times
    const responseTimes: number[] = []
    const resolutionTimes: number[] = []
    
    for (const conversation of conversations) {
      const convMessages = conversation.messages || []
      
      if (convMessages.length > 0) {
        // First response time
        const firstAdminMessage = convMessages
          .filter((msg: any) => msg.sender === 'admin')
          .sort((a: any, b: any) => a.timestamp.getTime() - b.timestamp.getTime())[0]
        
        const firstCustomerMessage = convMessages
          .filter((msg: any) => msg.sender === 'customer')
          .sort((a: any, b: any) => a.timestamp.getTime() - b.timestamp.getTime())[0]
        
        if (firstAdminMessage && firstCustomerMessage) {
          const responseTime = (firstAdminMessage.timestamp.getTime() - firstCustomerMessage.timestamp.getTime()) / (1000 * 60) // minutes
          if (responseTime > 0) {
            responseTimes.push(responseTime)
          }
        }

        // Resolution time
        if (conversation.status === 'resolved' && conversation.updatedAt) {
          const resolutionTime = (conversation.updatedAt.getTime() - conversation.createdAt.getTime()) / (1000 * 60) // minutes
          resolutionTimes.push(resolutionTime)
        }
      }
    }

    const avgResponseTime = responseTimes.length > 0 
      ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(1)
      : 0

    const avgResolutionTime = resolutionTimes.length > 0
      ? (resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length).toFixed(1)
      : 0

    const firstResponseTime = responseTimes.length > 0
      ? Math.min(...responseTimes).toFixed(1)
      : 0

    // Calculate customer satisfaction (mock for now - would need rating system)
    const customerSatisfaction = 4.7

    // Calculate abandonment rate
    const abandonedChats = conversations.filter(conv => 
      conv.status === 'active' && 
      conv.updatedAt && 
      (now.getTime() - conv.updatedAt.getTime()) > 24 * 60 * 60 * 1000 // 24 hours
    ).length

    const chatAbandonment = totalConversations > 0 
      ? ((abandonedChats / totalConversations) * 100).toFixed(1)
      : 0

    // Status distribution
    const statusDistribution = {
      resolved: conversations.filter(conv => conv.status === 'resolved').length,
      active: conversations.filter(conv => conv.status === 'active').length,
      pending: conversations.filter(conv => conv.status === 'pending').length
    }

    // Daily conversation trends
    const dailyTrends = []
    const daysBack = dateRange === 'today' ? 1 : dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90
    
    for (let i = daysBack - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
      
      const dayConversations = conversations.filter(conv => 
        conv.createdAt >= dayStart && conv.createdAt < dayEnd
      )
      
      const dayResolved = conversations.filter(conv => 
        conv.status === 'resolved' && 
        conv.updatedAt && 
        conv.updatedAt >= dayStart && 
        conv.updatedAt < dayEnd
      )
      
      const dayActive = dayConversations.filter(conv => conv.status === 'active')
      
      dailyTrends.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        conversations: dayConversations.length,
        resolved: dayResolved.length,
        active: dayActive.length
      })
    }

    // Hourly volume
    const hourlyVolume = []
    for (let hour = 0; hour < 24; hour += 3) {
      const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour)
      const hourEnd = new Date(hourStart.getTime() + 3 * 60 * 60 * 1000)
      
      let hourMessageCount = 0
      for (const conversation of conversations) {
        const convMessages = conversation.messages || []
        hourMessageCount += convMessages.filter((msg: any) => 
          msg.timestamp >= hourStart && msg.timestamp < hourEnd
        ).length
      }
      
      hourlyVolume.push({
        hour: `${hour === 0 ? '12' : hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'PM' : 'AM'}`,
        volume: hourMessageCount
      })
    }

    // Agent performance
    const agentStats = new Map()
    
    for (const conversation of conversations) {
      if (conversation.assignedTo) {
        const agentId = conversation.assignedTo._id.toString()
        const agentName = conversation.assignedTo.name || 'Unknown Agent'
        
        if (!agentStats.has(agentId)) {
          agentStats.set(agentId, {
            agent: agentName,
            conversations: 0,
            avgRating: 4.5, // Mock rating
            avgResponse: 2.0 // Mock response time
          })
        }
        
        const stats = agentStats.get(agentId)
        stats.conversations++
      }
    }

    const agentPerformance = Array.from(agentStats.values())

    // Top issues (mock data for now)
    const topIssues = [
      { issue: 'Order Status', count: Math.floor(totalConversations * 0.285), percentage: 28.5 },
      { issue: 'Product Information', count: Math.floor(totalConversations * 0.231), percentage: 23.1 },
      { issue: 'Shipping Delays', count: Math.floor(totalConversations * 0.190), percentage: 19.0 },
      { issue: 'Returns & Refunds', count: Math.floor(totalConversations * 0.163), percentage: 16.3 },
      { issue: 'Technical Issues', count: Math.floor(totalConversations * 0.131), percentage: 13.1 }
    ]

    // Response time by hour
    const responseTimeByHour = []
    for (let hour = 9; hour <= 17; hour++) {
      const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour)
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000)
      
      // Calculate actual response times for this hour
      const hourResponseTimes: number[] = []
      for (const conversation of conversations) {
        const convMessages = conversation.messages || []
        const hourMessages = convMessages.filter((msg: any) => 
          msg.timestamp >= hourStart && msg.timestamp < hourEnd
        )
        
        if (hourMessages.length > 0) {
          const firstAdminMessage = hourMessages
            .filter((msg: any) => msg.sender === 'admin')
            .sort((a: any, b: any) => a.timestamp.getTime() - b.timestamp.getTime())[0]
          
          const firstCustomerMessage = hourMessages
            .filter((msg: any) => msg.sender === 'customer')
            .sort((a: any, b: any) => a.timestamp.getTime() - b.timestamp.getTime())[0]
          
          if (firstAdminMessage && firstCustomerMessage) {
            const responseTime = (firstAdminMessage.timestamp.getTime() - firstCustomerMessage.timestamp.getTime()) / (1000 * 60)
            if (responseTime > 0) {
              hourResponseTimes.push(responseTime)
            }
          }
        }
      }
      
      const avgTime = hourResponseTimes.length > 0 
        ? hourResponseTimes.reduce((a, b) => a + b, 0) / hourResponseTimes.length
        : 2.0 + Math.random() * 1.5 // Fallback to mock data
      
      responseTimeByHour.push({
        hour: `${hour === 12 ? 12 : hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'PM' : 'AM'}`,
        avgTime: parseFloat(avgTime.toFixed(1))
      })
    }

    const analytics = {
      stats: {
        totalConversations,
        activeChats,
        avgResponseTime: `${avgResponseTime} min`,
        avgResolutionTime: `${avgResolutionTime} min`,
        customerSatisfaction,
        resolvedToday,
        firstResponseTime: `${firstResponseTime} min`,
        chatAbandonment: `${chatAbandonment}%`
      },
      trends: {
        conversations: dailyTrends,
        responseTime: responseTimeByHour,
        hourlyVolume
      },
      distribution: {
        status: statusDistribution
      },
      performance: {
        agents: agentPerformance,
        topIssues
      }
    }

    return NextResponse.json({
      success: true,
      data: analytics
    })

  } catch (error) {
    console.error('Error fetching chat analytics:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
