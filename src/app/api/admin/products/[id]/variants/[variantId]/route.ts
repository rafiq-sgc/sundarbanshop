import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Product from '@/models/Product'
import { z } from 'zod'

const variantUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  sku: z.string().min(1).optional(),
  price: z.number().min(0).optional(),
  comparePrice: z.number().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  attributes: z.record(z.string(), z.string()).optional(),
  image: z.string().optional(),
  isActive: z.boolean().optional()
})

// PUT /api/admin/products/[id]/variants/[variantId] - Update a variant
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; variantId: string } }
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
    const validatedData = variantUpdateSchema.parse(body)

    const product = await Product.findById(params.id)

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      )
    }

    // Find variant index
    const variantIndex = product.variants?.findIndex(
      (v: any) => v._id?.toString() === params.variantId
    )

    if (variantIndex === undefined || variantIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Variant not found' },
        { status: 404 }
      )
    }

    // Check if SKU is being changed and if it conflicts
    if (validatedData.sku && validatedData.sku !== product.variants![variantIndex].sku) {
      const skuExists = product.variants?.some(
        (v: any, idx: number) => idx !== variantIndex && v.sku === validatedData.sku
      )
      
      if (skuExists) {
        return NextResponse.json(
          { success: false, message: 'SKU already exists in product variants' },
          { status: 400 }
        )
      }
    }

    // Update variant fields
    Object.keys(validatedData).forEach(key => {
      if (validatedData[key as keyof typeof validatedData] !== undefined) {
        (product.variants![variantIndex] as any)[key] = validatedData[key as keyof typeof validatedData]
      }
    })

    await product.save()

    return NextResponse.json({
      success: true,
      message: 'Variant updated successfully',
      data: product.variants![variantIndex]
    })
  } catch (error: any) {
    console.error('Error updating variant:', error)
    
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
      { success: false, message: error.message || 'Failed to update variant' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/products/[id]/variants/[variantId] - Delete a variant
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; variantId: string } }
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

    const product = await Product.findById(params.id)

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      )
    }

    // Remove variant
    const variantIndex = product.variants?.findIndex(
      (v: any) => v._id?.toString() === params.variantId
    )

    if (variantIndex === undefined || variantIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Variant not found' },
        { status: 404 }
      )
    }

    product.variants!.splice(variantIndex, 1)
    await product.save()

    return NextResponse.json({
      success: true,
      message: 'Variant deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting variant:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete variant' },
      { status: 500 }
    )
  }
}

