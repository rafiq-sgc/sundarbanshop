export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Template from '@/models/Template'

// GET - List all templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is admin
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'all'
    const search = searchParams.get('search') || ''
    const onlyFavorites = searchParams.get('favorites') === 'true'

    // Build query
    const query: any = {}

    // Add category filter
    if (category !== 'all') {
      query.category = category
    }

    // Add favorites filter
    if (onlyFavorites) {
      query.isFavorite = true
    }

    // Add search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { shortcut: { $regex: search, $options: 'i' } }
      ]
    }

    // Fetch templates
    const templates = await Template.find(query)
      .populate('createdBy', 'name email')
      .sort({ isFavorite: -1, usageCount: -1, createdAt: -1 })
      .lean()

    // Calculate statistics
    const stats = {
      total: templates.length,
      favorites: templates.filter(t => t.isFavorite).length,
      totalUsage: templates.reduce((sum: number, t) => sum + t.usageCount, 0),
      avgUsage: templates.length > 0 
        ? Math.round(templates.reduce((sum: number, t) => sum + t.usageCount, 0) / templates.length)
        : 0,
      byCategory: {
        general: templates.filter(t => t.category === 'general').length,
        greeting: templates.filter(t => t.category === 'greeting').length,
        orders: templates.filter(t => t.category === 'orders').length,
        shipping: templates.filter(t => t.category === 'shipping').length,
        refunds: templates.filter(t => t.category === 'refunds').length,
        technical: templates.filter(t => t.category === 'technical').length,
        closing: templates.filter(t => t.category === 'closing').length
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        templates: templates.map((t: any) => ({
          id: t._id.toString(),
          title: t.title,
          content: t.content,
          category: t.category,
          shortcut: t.shortcut || '',
          variables: t.variables || [],
          usageCount: t.usageCount,
          isFavorite: t.isFavorite,
          createdBy: t.createdBy,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt
        })),
        stats
      }
    })

  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

// POST - Create new template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is admin
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const body = await request.json()
    const { title, content, category, shortcut, isFavorite } = body

    // Validate required fields
    if (!title || !content || !category) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Extract variables from content
    const variableRegex = /\{(\w+)\}/g
    const variables = Array.from(new Set(
      [...content.matchAll(variableRegex)].map(match => match[1])
    ))

    // Create template
    const template = await Template.create({
      title,
      content,
      category,
      shortcut: shortcut || undefined,
      variables,
      isFavorite: isFavorite || false,
      createdBy: session.user.id
    })

    return NextResponse.json({
      success: true,
      data: {
        id: template._id.toString(),
        title: template.title,
        content: template.content,
        category: template.category,
        shortcut: template.shortcut || '',
        variables: template.variables || [],
        usageCount: template.usageCount,
        isFavorite: template.isFavorite,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt
      },
      message: 'Template created successfully'
    })

  } catch (error: any) {
    console.error('Error creating template:', error)
    
    // Handle duplicate shortcut error
    if (error.code === 11000 && error.keyPattern?.shortcut) {
      return NextResponse.json(
        { success: false, message: 'Shortcut already exists' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Failed to create template' },
      { status: 500 }
    )
  }
}

