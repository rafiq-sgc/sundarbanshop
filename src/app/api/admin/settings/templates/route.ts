export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import EmailTemplate from '@/models/EmailTemplate'

// GET - Get all email/SMS templates
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
    const type = searchParams.get('type') || '' // email, sms
    const category = searchParams.get('category') || '' // order, marketing, notification, support, account
    const isActive = searchParams.get('isActive') // true, false

    // Build query
    const query: any = {}

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ]
    }

    if (type) {
      query.type = type
    }

    if (category) {
      query.category = category
    }

    if (isActive) {
      query.isActive = isActive === 'true'
    }

    const templates = await EmailTemplate.find(query)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ category: 1, name: 1 })
      .lean()

    // Calculate stats
    const stats = {
      total: await EmailTemplate.countDocuments(),
      email: await EmailTemplate.countDocuments({ type: 'email' }),
      sms: await EmailTemplate.countDocuments({ type: 'sms' }),
      active: await EmailTemplate.countDocuments({ isActive: true }),
      inactive: await EmailTemplate.countDocuments({ isActive: false })
    }

    return NextResponse.json({
      success: true,
      data: {
        templates,
        stats
      }
    })

  } catch (error: any) {
    console.error('Error fetching email templates:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

// POST - Create new template
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

    // Generate slug from name
    const slug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Check if slug already exists
    const existing = await EmailTemplate.findOne({ slug })
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Template with this name already exists' },
        { status: 400 }
      )
    }

    const template = await EmailTemplate.create({
      ...body,
      slug,
      createdBy: session.user.id
    })

    return NextResponse.json({
      success: true,
      data: template,
      message: 'Template created successfully'
    })

  } catch (error: any) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create template' },
      { status: 500 }
    )
  }
}

