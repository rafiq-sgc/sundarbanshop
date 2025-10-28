import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import Product from '@/models/Product'

// GET /api/admin/products/[id] - Get single product
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

    const product = await Product.findById(params.id).populate('category', 'name')

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: product
    })
  } catch (error: any) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/products/[id] - Update product
export async function PUT(
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

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { success: false, message: 'Product name is required' },
        { status: 400 }
      )
    }

    if (!body.price || body.price <= 0) {
      return NextResponse.json(
        { success: false, message: 'Valid price is required' },
        { status: 400 }
      )
    }

    if (!body.category) {
      return NextResponse.json(
        { success: false, message: 'Category is required' },
        { status: 400 }
      )
    }

    if (!body.images || body.images.length === 0) {
      return NextResponse.json(
        { success: false, message: 'At least one product image is required' },
        { status: 400 }
      )
    }

    // Check if product exists
    const existingProduct = await Product.findById(params.id)
    if (!existingProduct) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if slug is unique (excluding current product)
    if (body.slug && body.slug !== existingProduct.slug) {
      const slugExists = await Product.findOne({ 
        slug: body.slug,
        _id: { $ne: params.id }
      })
      
      if (slugExists) {
        return NextResponse.json(
          { success: false, message: 'Slug already exists. Please use a different slug.' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: body.description,
      shortDescription: body.shortDescription,
      category: body.category,
      price: Number(body.price),
      stock: Number(body.stock) || 0,
      images: body.images,
      isActive: body.isActive !== undefined ? body.isActive : true,
      featured: body.featured !== undefined ? body.featured : false
    }

    // Optional fields
    if (body.comparePrice) updateData.comparePrice = Number(body.comparePrice)
    if (body.cost) updateData.cost = Number(body.cost)
    if (body.sku) updateData.sku = body.sku
    if (body.barcode) updateData.barcode = body.barcode
    if (body.weight) updateData.weight = Number(body.weight)
    if (body.dimensions) updateData.dimensions = body.dimensions
    if (body.tags) updateData.tags = Array.isArray(body.tags) ? body.tags : []
    if (body.isOnSale !== undefined) updateData.isOnSale = body.isOnSale
    if (body.metaTitle) updateData.metaTitle = body.metaTitle
    if (body.metaDescription) updateData.metaDescription = body.metaDescription

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name')

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    })
  } catch (error: any) {
    console.error('Error updating product:', error)
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.issues).map(key => ({
        field: key,
        message: error.issues[key].message
      }))
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation error',
          errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update product' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/products/[id] - Delete product
export async function DELETE(
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

    await Product.findByIdAndDelete(params.id)

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete product' },
      { status: 500 }
    )
  }
}
