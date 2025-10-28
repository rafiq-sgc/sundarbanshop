import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import EmailTemplate from '@/models/EmailTemplate'

// GET - Get single template
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

    const template = await EmailTemplate.findById(params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .lean()

    if (!template) {
      return NextResponse.json(
        { success: false, message: 'Template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: template
    })

  } catch (error: any) {
    console.error('Error fetching template:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch template' },
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

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const body = await request.json()

    // Check if name changed and slug needs update
    if (body.name) {
      const slug = body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      
      // Check if new slug conflicts with another template
      const existing = await EmailTemplate.findOne({ 
        slug, 
        _id: { $ne: params.id } 
      })
      
      if (existing) {
        return NextResponse.json(
          { success: false, message: 'Template with this name already exists' },
          { status: 400 }
        )
      }
      
      body.slug = slug
    }

    const template = await EmailTemplate.findByIdAndUpdate(
      params.id,
      { ...body, updatedBy: session.user.id },
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
      data: template,
      message: 'Template updated successfully'
    })

  } catch (error: any) {
    console.error('Error updating template:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update template' },
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

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const template = await EmailTemplate.findById(params.id)

    if (!template) {
      return NextResponse.json(
        { success: false, message: 'Template not found' },
        { status: 404 }
      )
    }

    // Prevent deletion of default templates
    if (template.isDefault) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete default system templates' },
        { status: 400 }
      )
    }

    await EmailTemplate.findByIdAndDelete(params.id)

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    })

  } catch (error: any) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete template' },
      { status: 500 }
    )
  }
}

// PATCH - Update specific fields (toggle active, increment usage)
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

    let template

    switch (action) {
      case 'toggleActive':
        template = await EmailTemplate.findByIdAndUpdate(
          params.id,
          { $set: { isActive: body.isActive, updatedBy: session.user.id } },
          { new: true }
        )
        break

      case 'incrementUsage':
        template = await EmailTemplate.findByIdAndUpdate(
          params.id,
          { 
            $inc: { usageCount: 1 },
            $set: { lastUsed: new Date(), updatedBy: session.user.id }
          },
          { new: true }
        )
        break

      default:
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
      data: template,
      message: 'Template updated successfully'
    })

  } catch (error: any) {
    console.error('Error updating template:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update template' },
      { status: 500 }
    )
  }
}

