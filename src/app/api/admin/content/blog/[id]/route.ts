import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import BlogPost from '@/models/BlogPost'
import ActivityLog from '@/models/ActivityLog'
import '@/models/User'

// GET - Get single blog post
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

    const post = await BlogPost.findById(params.id)
      .populate('author', 'name email')
      .lean()

    if (!post) {
      return NextResponse.json(
        { success: false, message: 'Blog post not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...post,
        author: (post as any).author?.name || 'Unknown',
        authorEmail: (post as any).author?.email || ''
      }
    })

  } catch (error: any) {
    console.error('Error fetching blog post:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch blog post' },
      { status: 500 }
    )
  }
}

// PUT - Update blog post
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
      slug,
      excerpt,
      content,
      image,
      category,
      tags,
      status,
      featured,
      metaTitle,
      metaDescription
    } = body

    const post = await BlogPost.findById(params.id)

    if (!post) {
      return NextResponse.json(
        { success: false, message: 'Blog post not found' },
        { status: 404 }
      )
    }

    // Check if slug is being changed and if it already exists
    if (slug && slug !== post.slug) {
      const existingPost = await BlogPost.findOne({ slug, _id: { $ne: params.id } })
      if (existingPost) {
        return NextResponse.json(
          { success: false, message: 'A post with this slug already exists' },
          { status: 400 }
        )
      }
    }

    // Track changes for activity log
    const changes: any = {}
    if (title !== undefined && title !== post.title) changes.title = { from: post.title, to: title }
    if (status !== undefined && status !== post.status) changes.status = { from: post.status, to: status }

    // Update fields
    if (title !== undefined) post.title = title
    if (slug !== undefined) post.slug = slug
    if (excerpt !== undefined) post.excerpt = excerpt
    if (content !== undefined) post.content = content
    if (image !== undefined) post.image = image
    if (category !== undefined) post.category = category
    if (tags !== undefined) post.tags = tags
    if (status !== undefined) post.status = status
    if (featured !== undefined) post.featured = featured
    if (metaTitle !== undefined) post.metaTitle = metaTitle
    if (metaDescription !== undefined) post.metaDescription = metaDescription

    await post.save()
    await post.populate('author', 'name email')

    // Log activity
    await ActivityLog.create({
      user: session.user.id,
      action: 'UPDATE',
      entity: 'BlogPost',
      entityId: post._id,
      description: `Updated blog post: ${post.title}`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      changes
    })

    return NextResponse.json({
      success: true,
      message: 'Blog post updated successfully',
      data: {
        ...post.toObject(),
        author: (post as any).author?.name || 'Unknown'
      }
    })

  } catch (error: any) {
    console.error('Error updating blog post:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update blog post' },
      { status: 500 }
    )
  }
}

// DELETE - Delete blog post
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

    const post = await BlogPost.findById(params.id)

    if (!post) {
      return NextResponse.json(
        { success: false, message: 'Blog post not found' },
        { status: 404 }
      )
    }

    const postTitle = post.title

    await BlogPost.findByIdAndDelete(params.id)

    // Log activity
    await ActivityLog.create({
      user: session.user.id,
      action: 'DELETE',
      entity: 'BlogPost',
      entityId: params.id,
      description: `Deleted blog post: ${postTitle}`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({
      success: true,
      message: 'Blog post deleted successfully'
    })

  } catch (error: any) {
    console.error('Error deleting blog post:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete blog post' },
      { status: 500 }
    )
  }
}

