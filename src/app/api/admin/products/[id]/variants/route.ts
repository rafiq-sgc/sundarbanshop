import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Product from '@/models/Product'
import { z } from 'zod'

const variantSchema = z.object({
  name: z.string().min(1, 'Variant name is required'),
  sku: z.string().min(1, 'SKU is required'),
  price: z.number().min(0, 'Price must be non-negative'),
  comparePrice: z.number().min(0).optional(),
  stock: z.number().int().min(0, 'Stock must be non-negative'),
  attributes: z.record(z.string(), z.string()),
  image: z.string().optional(),
  isActive: z.boolean().default(true)
})

// GET /api/admin/products/[id]/variants - Get all variants for a product
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

    const product = await Product.findById(params.id)

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        variants: product.variants || [],
        attributes: product.attributes || []
      }
    })
  } catch (error: any) {
    console.error('Error fetching variants:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch variants' },
      { status: 500 }
    )
  }
}

// POST /api/admin/products/[id]/variants - Add a new variant
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
    const validatedData = variantSchema.parse(body)

    const product = await Product.findById(params.id)

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if SKU already exists in variants
    const skuExists = product.variants?.some((v: any) => v.sku === validatedData.sku)
    if (skuExists) {
      return NextResponse.json(
        { success: false, message: 'SKU already exists in product variants' },
        { status: 400 }
      )
    }

    // Add variant
    if (!product.variants) {
      product.variants = []
    }

    product.variants.push(validatedData as any)
    await product.save()

    return NextResponse.json({
      success: true,
      message: 'Variant added successfully',
      data: product.variants[product.variants.length - 1]
    })
  } catch (error: any) {
    console.error('Error adding variant:', error)
    
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
      { success: false, message: error.message || 'Failed to add variant' },
      { status: 500 }
    )
  }
}

