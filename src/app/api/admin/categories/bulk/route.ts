import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Category from '@/models/Category'
import Product from '@/models/Product'
import ActivityLog from '@/models/ActivityLog'
import { categoryBulkUpdateSchema } from '@/lib/validations/product'
import { ZodError } from 'zod'
import mongoose from 'mongoose'

// PATCH /api/admin/categories/bulk - Bulk operations
export async function PATCH(request: NextRequest) {
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

    // Validate with Zod
    try {
      categoryBulkUpdateSchema.parse(body)
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

    const { action, categoryIds } = body

    // Validate all IDs
    const invalidIds = categoryIds.filter((id: string) => !mongoose.Types.ObjectId.isValid(id))
    if (invalidIds.length > 0) {
      return NextResponse.json(
        { success: false, message: 'One or more invalid category IDs' },
        { status: 400 }
      )
    }

    let result: any
    let logDescription = ''

    switch (action) {
      case 'activate':
        result = await Category.updateMany(
          { _id: { $in: categoryIds } },
          { $set: { isActive: true } }
        )
        logDescription = `Activated ${result.modifiedCount} categories`
        break

      case 'deactivate':
        result = await Category.updateMany(
          { _id: { $in: categoryIds } },
          { $set: { isActive: false } }
        )
        logDescription = `Deactivated ${result.modifiedCount} categories`
        break

      case 'delete':
        // Check for products in these categories
        const productCount = await Product.countDocuments({ 
          category: { $in: categoryIds } 
        })
        
        if (productCount > 0) {
          return NextResponse.json(
            { 
              success: false, 
              message: `Cannot delete ${productCount} product(s) are assigned to these categories` 
            },
            { status: 400 }
          )
        }

        // Check for subcategories
        const subcategoryCount = await Category.countDocuments({ 
          parent: { $in: categoryIds } 
        })
        
        if (subcategoryCount > 0) {
          return NextResponse.json(
            { 
              success: false, 
              message: `Cannot delete. ${subcategoryCount} subcategory(ies) found. Delete or reassign them first.` 
            },
            { status: 400 }
          )
        }

        result = await Category.deleteMany({ _id: { $in: categoryIds } })
        logDescription = `Deleted ${result.deletedCount} categories`
        break

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid bulk action' },
          { status: 400 }
        )
    }

    // Log bulk activity
    await ActivityLog.create({
      user: session.user.id,
      action: action.toUpperCase(),
      entity: 'Category',
      description: logDescription,
      metadata: {
        action,
        categoryCount: categoryIds.length,
        modifiedCount: result.modifiedCount || result.deletedCount
      }
    })

    return NextResponse.json({
      success: true,
      message: logDescription,
      modifiedCount: result.modifiedCount || result.deletedCount || 0
    })

  } catch (error: any) {
    console.error('Error in bulk operation:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Bulk operation failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

