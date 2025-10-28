import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Template from '@/models/Template'

// GET - Get single template
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const template = await Template.findById(params.id)
      .populate('createdBy', 'name email')
      .lean()

    if (!template) {
      return NextResponse.json(
        { success: false, message: 'Template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: (template as any)._id.toString(),
        title: (template as any).title,
        content: (template as any).content,
        category: (template as any).category,
        shortcut: (template as any).shortcut || '',
        variables: (template as any).variables || [],
        usageCount: (template as any).usageCount,
        isFavorite: (template as any).isFavorite,
        createdBy: (template as any).createdBy,
        createdAt: (template as any).createdAt,
        updatedAt: (template as any).updatedAt
      }
    })

  } catch (error) {
    console.error('Error fetching template:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch template' },
      { status: 500 }
    )
  }
}

// PUT - Update template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Update template
    const template = await Template.findByIdAndUpdate(
      params.id,
      {
        title,
        content,
        category,
        shortcut: shortcut || undefined,
        variables,
        isFavorite: isFavorite !== undefined ? isFavorite : undefined
      },
      { new: true, runValidators: true }
    )

    if (!template) {
      return NextResponse.json(
        { success: false, message: 'Template not found' },
        { status: 404 }
      )
    }

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
      message: 'Template updated successfully'
    })

  } catch (error: any) {
    console.error('Error updating template:', error)
    
    // Handle duplicate shortcut error
    if (error.code === 11000 && error.keyPattern?.shortcut) {
      return NextResponse.json(
        { success: false, message: 'Shortcut already exists' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Failed to update template' },
      { status: 500 }
    )
  }
}

// DELETE - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const template = await Template.findByIdAndDelete(params.id)

    if (!template) {
      return NextResponse.json(
        { success: false, message: 'Template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete template' },
      { status: 500 }
    )
  }
}

// PATCH - Toggle favorite or increment usage
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { action } = body

    let template

    if (action === 'toggleFavorite') {
      template = await Template.findById(params.id)
      if (!template) {
        return NextResponse.json(
          { success: false, message: 'Template not found' },
          { status: 404 }
        )
      }

      template.isFavorite = !template.isFavorite
      await template.save()
    } else if (action === 'incrementUsage') {
      template = await Template.findByIdAndUpdate(
        params.id,
        { $inc: { usageCount: 1 } },
        { new: true }
      )
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid action' },
        { status: 400 }
      )
    }

    if (!template) {
      return NextResponse.json(
        { success: false, message: 'Template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: template._id.toString(),
        isFavorite: template.isFavorite,
        usageCount: template.usageCount
      },
      message: action === 'toggleFavorite' ? 'Favorite toggled' : 'Usage incremented'
    })

  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update template' },
      { status: 500 }
    )
  }
}

