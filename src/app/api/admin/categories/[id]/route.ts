import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Category from '@/models/Category'
import Product from '@/models/Product'
import ActivityLog from '@/models/ActivityLog'
import { categorySchema } from '@/lib/validations/product'
import { ZodError } from 'zod'
import mongoose from 'mongoose'

// GET /api/admin/categories/[id] - Get single category
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

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid category ID' },
        { status: 400 }
      )
    }

    await connectDB()

    const category = await Category.findById(params.id)
      .populate('parent', 'name slug')
      .lean()

    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      )
    }

    // Get product count for this category
    const productCount = await Product.countDocuments({ category: params.id })

    // Get subcategories
    const subcategories = await Category.find({ parent: params.id })
      .select('name slug isActive')
      .lean()

    return NextResponse.json({
      success: true,
      data: {
        ...category,
        productCount,
        subcategories
      }
    })

  } catch (error: any) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch category',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// PUT /api/admin/categories/[id] - Update category
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

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid category ID' },
        { status: 400 }
      )
    }

    await connectDB()

    const existingCategory = await Category.findById(params.id).lean()
    if (!existingCategory) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      )
    }

    const body = await request.json()

    // Validate with Zod (partial update)
    try {
      categorySchema.partial().parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))
        return NextResponse.json(
          { success: false, message: 'Validation failed', errors },
          { status: 400 }
        )
      }
    }

    // Check slug uniqueness if being updated
    if (body.slug && body.slug !== (existingCategory as any).slug) {
      const slugExists = await Category.findOne({ 
        slug: body.slug, 
        _id: { $ne: params.id } 
      })
      if (slugExists) {
        return NextResponse.json(
          { success: false, message: 'Category with this slug already exists' },
          { status: 400 }
        )
      }
    }

    // Verify parent exists if being updated
    if (body.parent) {
      // Prevent self-reference
      if (body.parent === params.id) {
        return NextResponse.json(
          { success: false, message: 'Category cannot be its own parent' },
          { status: 400 }
        )
      }

      const parentExists = await Category.findById(body.parent)
      if (!parentExists) {
        return NextResponse.json(
          { success: false, message: 'Parent category not found' },
          { status: 404 }
        )
      }

      // Check for circular reference
      let currentParent = parentExists
      while (currentParent.parent) {
        if (currentParent.parent.toString() === params.id) {
          return NextResponse.json(
            { success: false, message: 'Circular reference detected' },
            { status: 400 }
          )
        }
        currentParent = await Category.findById(currentParent.parent).lean()
        if (!currentParent) break
      }
    }

    // Update category
    const updatedCategory = await Category.findByIdAndUpdate(
      params.id,
      { $set: body },
      { new: true, runValidators: true }
    ).populate('parent', 'name slug')

    // Track changes
    const changes: any = {}
    const fieldsToTrack = ['name', 'slug', 'isActive', 'parent']
    fieldsToTrack.forEach(field => {
      if (body[field] !== undefined && (existingCategory as any)[field] !== body[field]) {
        if (!changes.before) changes.before = {}
        if (!changes.after) changes.after = {}
        changes.before[field] = (existingCategory as any)[field]
        changes.after[field] = body[field]
      }
    })

    // Log activity
    await ActivityLog.create({
      user: session.user.id,
      action: 'UPDATE',
      entity: 'Category',
      entityId: updatedCategory!._id,
      description: `Updated category: ${updatedCategory!.name}`,
      changes: Object.keys(changes).length > 0 ? changes : undefined,
      metadata: {
        categoryName: updatedCategory!.name,
        slug: updatedCategory!.slug
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    })

  } catch (error: any) {
    console.error('Error updating category:', error)
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.issues).map((err: any) => err.message)
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update category',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/categories/[id] - Delete category
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

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid category ID' },
        { status: 400 }
      )
    }

    await connectDB()

    const category = await Category.findById(params.id).lean()
    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      )
    }

    // Check if category has products
    const productCount = await Product.countDocuments({ category: params.id })
    if (productCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Cannot delete category. It has ${productCount} product(s). Reassign products first.` 
        },
        { status: 400 }
      )
    }

    // Check if category has subcategories
    const subcategoryCount = await Category.countDocuments({ parent: params.id })
    if (subcategoryCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Cannot delete category. It has ${subcategoryCount} subcategory(ies). Delete or reassign them first.` 
        },
        { status: 400 }
      )
    }

    const softDelete = request.nextUrl.searchParams.get('soft') !== 'false'

    if (softDelete) {
      // Soft delete
      await Category.findByIdAndUpdate(params.id, { isActive: false })

      await ActivityLog.create({
        user: session.user.id,
        action: 'DELETE',
        entity: 'Category',
        entityId: params.id,
        description: `Deactivated category: ${(category as any).name} (soft delete)`,
        metadata: {
          categoryName: (category as any).name,
          slug: (category as any).slug,
          deleteType: 'soft'
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Category deactivated successfully'
      })
    } else {
      // Hard delete
      await Category.findByIdAndDelete(params.id)

      await ActivityLog.create({
        user: session.user.id,
        action: 'DELETE',
        entity: 'Category',
        entityId: params.id,
        description: `Permanently deleted category: ${(category as any).name}`,
        metadata: {
          categoryName: (category as any).name,
          slug: (category as any).slug,
          deleteType: 'hard'
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Category deleted permanently'
      })
    }

  } catch (error: any) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete category',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

