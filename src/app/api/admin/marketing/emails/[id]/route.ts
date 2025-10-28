import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import EmailCampaign from '@/models/EmailCampaign'
import ActivityLog from '@/models/ActivityLog'

// GET - Get single campaign
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const campaign = await EmailCampaign.findById(params.id)
      .populate('createdBy', 'name email')
      .lean()

    if (!campaign) {
      return NextResponse.json(
        { success: false, message: 'Campaign not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: campaign
    })

  } catch (error: any) {
    console.error('Error fetching campaign:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch campaign' },
      { status: 500 }
    )
  }
}

// PUT - Update campaign
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const oldCampaign = await EmailCampaign.findById(params.id).lean()

    if (!oldCampaign) {
      return NextResponse.json(
        { success: false, message: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Don't allow editing sent campaigns
    if ((oldCampaign as any).status === 'sent' || (oldCampaign as any).status === 'sending') {
      return NextResponse.json(
        { success: false, message: 'Cannot edit sent or sending campaigns' },
        { status: 400 }
      )
    }

    const campaign = await EmailCampaign.findByIdAndUpdate(
      params.id,
      body,
      { new: true, runValidators: true }
    )

    // Log activity
    await ActivityLog.create({
      user: session.user.id,
      action: 'UPDATE',
      entity: 'EmailCampaign',
      entityId: params.id,
      description: `Updated email campaign: ${(oldCampaign as any).name}`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      changes: {
        before: {
          name: (oldCampaign as any).name,
          subject: (oldCampaign as any).subject,
          status: (oldCampaign as any).status
        },
        after: {
          name: campaign?.name,
          subject: campaign?.subject,
          status: campaign?.status
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: campaign,
      message: 'Campaign updated successfully'
    })

  } catch (error: any) {
    console.error('Error updating campaign:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update campaign' },
      { status: 500 }
    )
  }
}

// DELETE - Delete campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const campaign = await EmailCampaign.findById(params.id).lean()

    if (!campaign) {
      return NextResponse.json(
        { success: false, message: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Don't allow deletion of sent campaigns
    if ((campaign as any).status === 'sent' || (campaign as any).status === 'sending') {
      return NextResponse.json(
        { success: false, message: 'Cannot delete sent or sending campaigns' },
        { status: 400 }
      )
    }

    await EmailCampaign.findByIdAndDelete(params.id)

    // Log activity
    await ActivityLog.create({
      user: session.user.id,
      action: 'DELETE',
      entity: 'EmailCampaign',
      entityId: params.id,
      description: `Deleted email campaign: ${(campaign as any).name}`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      metadata: {
        deletedName: (campaign as any).name,
        deletedType: (campaign as any).type,
        wasSent: (campaign as any).status === 'sent'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Campaign deleted successfully'
    })

  } catch (error: any) {
    console.error('Error deleting campaign:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete campaign' },
      { status: 500 }
    )
  }
}

// PATCH - Send campaign or update status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { action } = body

    const campaign = await EmailCampaign.findById(params.id)

    if (!campaign) {
      return NextResponse.json(
        { success: false, message: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (action === 'send') {
      // Change status to sending (actual email sending would be done in background job)
      campaign.status = 'sending'
      campaign.sentAt = new Date()
      await campaign.save()

      // Log activity
      await ActivityLog.create({
        user: session.user.id,
        action: 'SEND',
        entity: 'EmailCampaign',
        entityId: params.id,
        description: `Sent email campaign: ${campaign.name}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        metadata: {
          campaignName: campaign.name,
          recipientType: campaign.recipients.type
        }
      })

      return NextResponse.json({
        success: true,
        data: campaign,
        message: 'Campaign is being sent'
      })
    } else if (action === 'pause') {
      campaign.status = 'paused'
      await campaign.save()

      return NextResponse.json({
        success: true,
        data: campaign,
        message: 'Campaign paused'
      })
    } else if (action === 'duplicate') {
      const newCampaign = await EmailCampaign.create({
        name: `${campaign.name} (Copy)`,
        subject: campaign.subject,
        content: campaign.content,
        template: campaign.template,
        type: campaign.type,
        recipients: campaign.recipients,
        status: 'draft',
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

      return NextResponse.json({
        success: true,
        data: newCampaign,
        message: 'Campaign duplicated successfully'
      })
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    )

  } catch (error: any) {
    console.error('Error updating campaign:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update campaign' },
      { status: 500 }
    )
  }
}

