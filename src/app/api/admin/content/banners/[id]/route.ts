import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Banner from '@/models/Banner'
import ActivityLog from '@/models/ActivityLog'
import '@/models/User'

// GET - Get single banner
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

    const banner = await Banner.findById(params.id)
      .populate('createdBy', 'name email')
      .lean()

    if (!banner) {
      return NextResponse.json(
        { success: false, message: 'Banner not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...banner,
        createdBy: (banner as any).createdBy?.name || 'Unknown'
      }
    })

  } catch (error: any) {
    console.error('Error fetching banner:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch banner' },
      { status: 500 }
    )
  }
}

// PUT - Update banner
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
    const {
      title,
      description,
      image,
      mobileImage,
      link,
      linkText,
      position,
      isActive,
      sortOrder,
      startDate,
      endDate
    } = body

    const banner = await Banner.findById(params.id)

    if (!banner) {
      return NextResponse.json(
        { success: false, message: 'Banner not found' },
        { status: 404 }
      )
    }

    // Track changes
    const changes: any = {}
    if (title !== undefined && title !== banner.title) changes.title = { from: banner.title, to: title }
    if (isActive !== undefined && isActive !== banner.isActive) changes.isActive = { from: banner.isActive, to: isActive }

    // Update fields
    if (title !== undefined) banner.title = title
    if (description !== undefined) banner.description = description
    if (image !== undefined) banner.image = image
    if (mobileImage !== undefined) banner.mobileImage = mobileImage
    if (link !== undefined) banner.link = link
    if (linkText !== undefined) banner.linkText = linkText
    if (position !== undefined) banner.position = position
    if (isActive !== undefined) banner.isActive = isActive
    if (sortOrder !== undefined) banner.sortOrder = sortOrder
    if (startDate !== undefined) banner.startDate = startDate
    if (endDate !== undefined) banner.endDate = endDate

    await banner.save()
    await banner.populate('createdBy', 'name email')

    // Log activity
    await ActivityLog.create({
      user: session.user.id,
      action: 'UPDATE',
      entity: 'Banner',
      entityId: banner._id,
      description: `Updated banner: ${banner.title}`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      changes
    })

    return NextResponse.json({
      success: true,
      message: 'Banner updated successfully',
      data: {
        ...banner.toObject(),
        createdBy: (banner as any).createdBy?.name || 'Unknown'
      }
    })

  } catch (error: any) {
    console.error('Error updating banner:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update banner' },
      { status: 500 }
    )
  }
}

// DELETE - Delete banner
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

    const banner = await Banner.findById(params.id)

    if (!banner) {
      return NextResponse.json(
        { success: false, message: 'Banner not found' },
        { status: 404 }
      )
    }

    const bannerTitle = banner.title

    await Banner.findByIdAndDelete(params.id)

    // Log activity
    await ActivityLog.create({
      user: session.user.id,
      action: 'DELETE',
      entity: 'Banner',
      entityId: params.id,
      description: `Deleted banner: ${bannerTitle}`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({
      success: true,
      message: 'Banner deleted successfully'
    })

  } catch (error: any) {
    console.error('Error deleting banner:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete banner' },
      { status: 500 }
    )
  }
}

// PATCH - Toggle banner status
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

    const banner = await Banner.findById(params.id)

    if (!banner) {
      return NextResponse.json(
        { success: false, message: 'Banner not found' },
        { status: 404 }
      )
    }

    banner.isActive = !banner.isActive
    await banner.save()

    // Log activity
    await ActivityLog.create({
      user: session.user.id,
      action: 'UPDATE',
      entity: 'Banner',
      entityId: banner._id,
      description: `${banner.isActive ? 'Activated' : 'Deactivated'} banner: ${banner.title}`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      changes: {
        isActive: { from: !banner.isActive, to: banner.isActive }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Banner ${banner.isActive ? 'activated' : 'deactivated'} successfully`,
      data: banner
    })

  } catch (error: any) {
    console.error('Error toggling banner:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to toggle banner' },
      { status: 500 }
    )
  }
}

