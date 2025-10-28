import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import EmailCampaign from '@/models/EmailCampaign'
import User from '@/models/User'
import ActivityLog from '@/models/ActivityLog'

// GET - Get all email campaigns
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const status = searchParams.get('status') || ''

    // Build query
    const query: any = {}

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ]
    }

    if (type) {
      query.type = type
    }

    if (status) {
      query.status = status
    }

    const campaigns = await EmailCampaign.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean()

    // Calculate stats
    const stats = {
      total: await EmailCampaign.countDocuments(),
      draft: await EmailCampaign.countDocuments({ status: 'draft' }),
      scheduled: await EmailCampaign.countDocuments({ status: 'scheduled' }),
      sent: await EmailCampaign.countDocuments({ status: 'sent' }),
      totalSent: await EmailCampaign.aggregate([
        { $match: { status: 'sent' } },
        { $group: { _id: null, count: { $sum: '$stats.sent' } } }
      ]).then(res => res[0]?.count || 0),
      totalOpened: await EmailCampaign.aggregate([
        { $match: { status: 'sent' } },
        { $group: { _id: null, count: { $sum: '$stats.opened' } } }
      ]).then(res => res[0]?.count || 0)
    }

    return NextResponse.json({
      success: true,
      data: {
        campaigns,
        stats
      }
    })

  } catch (error: any) {
    console.error('Error fetching email campaigns:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}

// POST - Create new email campaign
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const body = await request.json()

    // Calculate recipient count based on type
    let recipientCount = 0
    if (body.recipients.type === 'all') {
      recipientCount = await User.countDocuments({ role: 'user', isActive: true, emailVerified: true })
    } else if (body.recipients.type === 'custom' && body.recipients.emails) {
      recipientCount = body.recipients.emails.length
    } else if (body.recipients.type === 'segment') {
      // Build segment query
      const segmentQuery: any = { role: 'user', isActive: true, emailVerified: true }
      // Add segment filters if needed
      recipientCount = await User.countDocuments(segmentQuery)
    }

    // Create campaign
    const campaign = await EmailCampaign.create({
      ...body,
      createdBy: session.user.id,
      stats: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        unsubscribed: 0
      }
    })

    // Log activity
    await ActivityLog.create({
      user: session.user.id,
      action: 'CREATE',
      entity: 'EmailCampaign',
      entityId: campaign._id,
      description: `Created email campaign: ${campaign.name}`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      metadata: {
        campaignName: campaign.name,
        campaignType: campaign.type,
        recipientCount
      }
    })

    return NextResponse.json({
      success: true,
      data: campaign,
      message: 'Email campaign created successfully'
    })

  } catch (error: any) {
    console.error('Error creating email campaign:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create campaign' },
      { status: 500 }
    )
  }
}

