import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import MediaAsset from '@/models/MediaAsset'
import ActivityLog from '@/models/ActivityLog'
import '@/models/User'

// GET - Get all media assets
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
    const folder = searchParams.get('folder') || ''
    const type = searchParams.get('type') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build query
    const query: any = {}

    if (folder && folder !== 'all') {
      query.folder = folder
    }

    if (type && type !== 'all') {
      query.mimeType = { $regex: `^${type}/`, $options: 'i' }
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { filename: { $regex: search, $options: 'i' } },
        { altText: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ]
    }

    // Get media assets
    const assets = await MediaAsset.find(query)
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const total = await MediaAsset.countDocuments(query)

    // Get statistics
    const stats = {
      total: await MediaAsset.countDocuments(),
      images: await MediaAsset.countDocuments({ mimeType: { $regex: '^image/' } }),
      videos: await MediaAsset.countDocuments({ mimeType: { $regex: '^video/' } }),
      documents: await MediaAsset.countDocuments({ mimeType: { $regex: '^application/' } }),
      totalSize: await MediaAsset.aggregate([
        { $group: { _id: null, total: { $sum: '$size' } } }
      ]).then(result => result[0]?.total || 0)
    }

    // Get folders
    const folders = await MediaAsset.distinct('folder').then(f => f.filter(Boolean))

    return NextResponse.json({
      success: true,
      data: {
        assets: assets.map(asset => ({
          ...asset,
          uploadedBy: (asset as any).uploadedBy?.name || 'Unknown'
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        stats,
        folders
      }
    })

  } catch (error: any) {
    console.error('Error fetching media assets:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch media assets' },
      { status: 500 }
    )
  }
}

// POST - Upload media asset
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
    const {
      name,
      filename,
      url,
      thumbnailUrl,
      mimeType,
      size,
      width,
      height,
      folder,
      tags,
      altText
    } = body

    // Validate required fields
    if (!name || !filename || !url || !mimeType || size === undefined) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create media asset
    const asset = await MediaAsset.create({
      name,
      filename,
      url,
      thumbnailUrl,
      mimeType,
      size,
      width,
      height,
      folder: folder || 'uncategorized',
      tags: tags || [],
      altText,
      uploadedBy: session.user.id,
      usedIn: []
    })

    // Populate uploader
    await asset.populate('uploadedBy', 'name email')

    // Log activity
    await ActivityLog.create({
      user: session.user.id,
      action: 'CREATE',
      entity: 'MediaAsset',
      entityId: asset._id,
      description: `Uploaded media: ${name}`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      metadata: {
        filename,
        mimeType,
        size,
        folder
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Media asset uploaded successfully',
      data: {
        ...asset.toObject(),
        uploadedBy: (asset as any).uploadedBy?.name || 'Unknown'
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error uploading media asset:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to upload media asset' },
      { status: 500 }
    )
  }
}

