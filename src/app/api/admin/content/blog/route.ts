import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import BlogPost from '@/models/BlogPost'
import ActivityLog from '@/models/ActivityLog'
import '@/models/User'

// GET - Get all blog posts
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
    const status = searchParams.get('status') || ''
    const category = searchParams.get('category') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build query
    const query: any = {}

    if (status && status !== 'all') {
      query.status = status
    }

    if (category && category !== 'all') {
      query.category = category
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ]
    }

    // Get posts
    const posts = await BlogPost.find(query)
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const total = await BlogPost.countDocuments(query)

    // Get statistics
    const stats = {
      total: await BlogPost.countDocuments(),
      published: await BlogPost.countDocuments({ status: 'published' }),
      draft: await BlogPost.countDocuments({ status: 'draft' }),
      archived: await BlogPost.countDocuments({ status: 'archived' }),
      totalViews: await BlogPost.aggregate([
        { $group: { _id: null, total: { $sum: '$views' } } }
      ]).then(result => result[0]?.total || 0)
    }

    // Get categories
    const categories = await BlogPost.distinct('category')

    return NextResponse.json({
      success: true,
      data: {
        posts: posts.map(post => ({
          ...post,
          author: (post as any).author?.name || 'Unknown'
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        stats,
        categories
      }
    })

  } catch (error: any) {
    console.error('Error fetching blog posts:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch blog posts' },
      { status: 500 }
    )
  }
}

// POST - Create blog post
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

    // Validate required fields
    if (!title || !excerpt || !content || !category) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    if (slug) {
      const existingPost = await BlogPost.findOne({ slug })
      if (existingPost) {
        return NextResponse.json(
          { success: false, message: 'A post with this slug already exists' },
          { status: 400 }
        )
      }
    }

    // Create post
    const post = await BlogPost.create({
      title,
      slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      excerpt,
      content,
      image,
      category,
      tags: tags || [],
      author: session.user.id,
      status: status || 'draft',
      featured: featured || false,
      metaTitle,
      metaDescription
    })

    // Populate author
    await post.populate('author', 'name email')

    // Log activity
    await ActivityLog.create({
      user: session.user.id,
      action: 'CREATE',
      entity: 'BlogPost',
      entityId: post._id,
      description: `Created blog post: ${title}`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      metadata: {
        title,
        status: post.status
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Blog post created successfully',
      data: {
        ...post.toObject(),
        author: (post as any).author?.name || 'Unknown'
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error creating blog post:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create blog post' },
      { status: 500 }
    )
  }
}

