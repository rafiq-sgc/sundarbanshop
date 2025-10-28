import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Category from '@/models/Category'
import ActivityLog from '@/models/ActivityLog'
import { categorySchema } from '@/lib/validations/product'
import { ZodError } from 'zod'

// GET /api/admin/categories - List all categories with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const parentId = searchParams.get('parent')

    // Build filter
    const filter: any = {}

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ]
    }

    if (status === 'active') {
      filter.isActive = true
    } else if (status === 'inactive') {
      filter.isActive = false
    }

    if (parentId === 'root') {
      filter.parent = null
    } else if (parentId) {
      filter.parent = parentId
    }

    const skip = (page - 1) * limit

    const [categories, totalCount, activeCount, inactiveCount] = await Promise.all([
      Category.find(filter)
        .populate('parent', 'name slug')
        .sort({ sortOrder: 1, name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Category.countDocuments(filter),
      Category.countDocuments({ isActive: true }),
      Category.countDocuments({ isActive: false })
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      data: categories,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      stats: {
        total: totalCount,
        active: activeCount,
        inactive: inactiveCount
      }
    })

  } catch (error: any) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch categories',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// POST /api/admin/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    await connectDB()

    const body = await request.json()

    // Validate with Zod
    try {
      categorySchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))
        return NextResponse.json(
          { success: false, message: 'Validation failed', errors },
          { status: 400 }
        )
      }
    }

    // Check if slug already exists
    const existingSlug = await Category.findOne({ slug: body.slug })
    if (existingSlug) {
      return NextResponse.json(
        { success: false, message: 'Category with this slug already exists' },
        { status: 400 }
      )
    }

    // Verify parent category exists if provided
    if (body.parent) {
      const parentExists = await Category.findById(body.parent)
      if (!parentExists) {
        return NextResponse.json(
          { success: false, message: 'Parent category not found' },
          { status: 404 }
        )
      }
    }

    // Create category
    const category = await Category.create(body)
    await category.populate('parent', 'name slug')

    // Log activity
    await ActivityLog.create({
      user: session.user.id,
      action: 'CREATE',
      entity: 'Category',
      entityId: category._id,
      description: `Created category: ${category.name}`,
      metadata: {
        categoryName: category.name,
        slug: category.slug
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Category created successfully',
      data: category
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error creating category:', error)
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.issues).map((err: any) => err.message)
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create category',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

