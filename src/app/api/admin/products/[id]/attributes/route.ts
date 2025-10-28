import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Product from '@/models/Product'
import { z } from 'zod'

const attributeSchema = z.object({
  name: z.string().min(1, 'Attribute name is required'),
  values: z.array(z.string()).min(1, 'At least one value is required'),
  isRequired: z.boolean().default(false)
})

// POST /api/admin/products/[id]/attributes - Add/Update product attributes
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
    const attributes = z.array(attributeSchema).parse(body.attributes)

    const product = await Product.findById(params.id)

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      )
    }

    // Update product attributes
    product.attributes = attributes as any
    await product.save()

    return NextResponse.json({
      success: true,
      message: 'Attributes updated successfully',
      data: product.attributes
    })
  } catch (error: any) {
    console.error('Error updating attributes:', error)
    
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

