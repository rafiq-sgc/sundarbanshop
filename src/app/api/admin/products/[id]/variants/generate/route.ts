import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Product from '@/models/Product'
import { z } from 'zod'

const attributeSchema = z.object({
  name: z.string(),
  values: z.array(z.string())
})

const generateVariantsSchema = z.object({
  attributes: z.array(attributeSchema).min(1, 'At least one attribute is required'),
  basePrice: z.number().min(0, 'Base price must be non-negative'),
  baseStock: z.number().int().min(0).default(0),
  skuPrefix: z.string().optional()
})

// POST /api/admin/products/[id]/variants/generate - Bulk generate variants
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
    const validatedData = generateVariantsSchema.parse(body)

    const product = await Product.findById(params.id)

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      )
    }

    // Generate all combinations
    const generateCombinations = (
      attributes: Array<{ name: string; values: string[] }>,
      current: { [key: string]: string } = {},
      index: number = 0
    ): Array<{ [key: string]: string }> => {
      if (index === attributes.length) {
        return [current]
      }

      const attribute = attributes[index]
      const combinations: Array<{ [key: string]: string }> = []

      for (const value of attribute.values) {
        const newCurrent = { ...current, [attribute.name]: value }
        combinations.push(...generateCombinations(attributes, newCurrent, index + 1))
      }

      return combinations
    }

    const combinations = generateCombinations(validatedData.attributes)

    // Create variants
    const newVariants = combinations.map((attrs, idx) => {
      const variantName = Object.values(attrs).join(' - ')
      const skuSuffix = Object.values(attrs)
        .map(v => v.substring(0, 1).toUpperCase())
        .join('')
      
      const sku = validatedData.skuPrefix 
        ? `${validatedData.skuPrefix}-${skuSuffix}-${idx + 1}`
        : `VAR-${params.id.substring(0, 6).toUpperCase()}-${skuSuffix}`

      return {
        name: variantName,
        sku: sku,
        price: validatedData.basePrice,
        stock: validatedData.baseStock,
        attributes: attrs,
        isActive: true
      }
    })

    // Set product attributes and variants
    product.attributes = validatedData.attributes.map(attr => ({
      name: attr.name,
      values: attr.values,
      isRequired: true
    })) as any

    product.variants = newVariants as any
    await product.save()

    return NextResponse.json({
      success: true,
      message: `${newVariants.length} variants generated successfully`,
      data: {
        variants: product.variants,
        attributes: product.attributes,
        count: newVariants.length
      }
    })
  } catch (error: any) {
    console.error('Error generating variants:', error)
    
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
      { success: false, message: error.message || 'Failed to generate variants' },
      { status: 500 }
    )
  }
}

