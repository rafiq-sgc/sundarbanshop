import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import MediaAsset from '@/models/MediaAsset'
import ActivityLog from '@/models/ActivityLog'
import '@/models/User'

// GET - Get single media asset
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

    const asset = await MediaAsset.findById(params.id)
      .populate('uploadedBy', 'name email')
      .lean()

    if (!asset) {
      return NextResponse.json(
        { success: false, message: 'Media asset not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...asset,
        uploadedBy: (asset as any).uploadedBy?.name || 'Unknown'
      }
    })

  } catch (error: any) {
    console.error('Error fetching media asset:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch media asset' },
      { status: 500 }
    )
  }
}

// PUT - Update media asset
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
    const { name, folder, tags, altText } = body

    const asset = await MediaAsset.findById(params.id)

    if (!asset) {
      return NextResponse.json(
        { success: false, message: 'Media asset not found' },
        { status: 404 }
      )
    }

    // Track changes
    const changes: any = {}
    if (name !== undefined && name !== asset.name) changes.name = { from: asset.name, to: name }
    if (folder !== undefined && folder !== asset.folder) changes.folder = { from: asset.folder, to: folder }

    // Update fields
    if (name !== undefined) asset.name = name
    if (folder !== undefined) asset.folder = folder
    if (tags !== undefined) asset.tags = tags
    if (altText !== undefined) asset.altText = altText

    await asset.save()
    await asset.populate('uploadedBy', 'name email')

    // Log activity
    await ActivityLog.create({
      user: session.user.id,
      action: 'UPDATE',
      entity: 'MediaAsset',
      entityId: asset._id,
      description: `Updated media asset: ${asset.name}`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      changes
    })

    return NextResponse.json({
      success: true,
      message: 'Media asset updated successfully',
      data: {
        ...asset.toObject(),
        uploadedBy: (asset as any).uploadedBy?.name || 'Unknown'
      }
    })

  } catch (error: any) {
    console.error('Error updating media asset:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update media asset' },
      { status: 500 }
    )
  }
}

// DELETE - Delete media asset
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

    const asset = await MediaAsset.findById(params.id)

    if (!asset) {
      return NextResponse.json(
        { success: false, message: 'Media asset not found' },
        { status: 404 }
      )
    }

    // Check if asset is being used
    if (asset.usedIn && asset.usedIn.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Cannot delete: This media is used in ${asset.usedIn.length} place(s)` 
        },
        { status: 400 }
      )
    }

    const assetName = asset.name

    await MediaAsset.findByIdAndDelete(params.id)

    // Log activity
    await ActivityLog.create({
      user: session.user.id,
      action: 'DELETE',
      entity: 'MediaAsset',
      entityId: params.id,
      description: `Deleted media asset: ${assetName}`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({
      success: true,
      message: 'Media asset deleted successfully'
    })

  } catch (error: any) {
    console.error('Error deleting media asset:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete media asset' },
      { status: 500 }
    )
  }
}

