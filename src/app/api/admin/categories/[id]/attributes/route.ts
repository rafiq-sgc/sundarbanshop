import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Category from '@/models/Category'
import { z } from 'zod'

const categoryAttributeSchema = z.object({
  name: z.string().min(1, 'Attribute name is required'),
  type: z.enum(['select', 'multiselect', 'text', 'number', 'color']),
  values: z.array(z.string()).optional(),
  isRequired: z.boolean().default(false),
  displayOrder: z.number().int().min(0).default(0)
})

// GET /api/admin/categories/[id]/attributes - Get category attribute templates
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    await connectDB()

    const category = await Category.findById(params.id)

    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: category.attributeTemplates || []
    })
  } catch (error: any) {
    console.error('Error fetching category attributes:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch attributes' },
      { status: 500 }
    )
  }
}

// POST /api/admin/categories/[id]/attributes - Update category attribute templates
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const attributes = z.array(categoryAttributeSchema).parse(body.attributes)

    const category = await Category.findById(params.id)

    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      )
    }

    category.attributeTemplates = attributes as any
    await category.save()

    return NextResponse.json({
      success: true,
      message: 'Category attribute templates updated successfully',
      data: category.attributeTemplates
    })
  } catch (error: any) {
    console.error('Error updating category attributes:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation error',
          errors: error.issues
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update attributes' },
      { status: 500 }
    )
  }
}

