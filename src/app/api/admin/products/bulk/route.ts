import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import ActivityLog from '@/models/ActivityLog'
import { bulkUpdateSchema } from '@/lib/validations/product'
import { ZodError } from 'zod'
import mongoose from 'mongoose'

// PATCH /api/admin/products/bulk - Bulk operations
export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    await connectDB()

    const body = await request.json()

    // Validate with Zod schema
    try {
      bulkUpdateSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))
        return NextResponse.json(
          { 
            success: false, 
            message: 'Validation failed',
            errors 
          },
          { status: 400 }
        )
      }
    }

    const { action, productIds, data } = body

    // Validate all IDs
    const invalidIds = productIds.filter((id: string) => !mongoose.Types.ObjectId.isValid(id))
    if (invalidIds.length > 0) {
      return NextResponse.json(
        { success: false, message: 'One or more invalid product IDs' },
        { status: 400 }
      )
    }

    let result: any
    let logDescription = ''

    switch (action) {
      case 'activate':
        result = await Product.updateMany(
          { _id: { $in: productIds } },
          { $set: { isActive: true } }
        )
        logDescription = `Activated ${result.modifiedCount} products`
        break

      case 'deactivate':
        result = await Product.updateMany(
          { _id: { $in: productIds } },
          { $set: { isActive: false } }
        )
        logDescription = `Deactivated ${result.modifiedCount} products`
        break

      case 'feature':
        result = await Product.updateMany(
          { _id: { $in: productIds } },
          { $set: { isFeatured: true } }
        )
        logDescription = `Featured ${result.modifiedCount} products`
        break

      case 'unfeature':
        result = await Product.updateMany(
          { _id: { $in: productIds } },
          { $set: { isFeatured: false } }
        )
        logDescription = `Unfeatured ${result.modifiedCount} products`
        break

      case 'set-on-sale':
        if (!data?.salePrice) {
          return NextResponse.json(
            { success: false, message: 'Sale price is required' },
            { status: 400 }
          )
        }
        result = await Product.updateMany(
          { _id: { $in: productIds } },
          { 
            $set: { 
              isOnSale: true, 
              salePrice: data.salePrice,
              saleStartDate: data.saleStartDate || new Date(),
              saleEndDate: data.saleEndDate
            } 
          }
        )
        logDescription = `Set ${result.modifiedCount} products on sale`
        break

      case 'remove-sale':
        result = await Product.updateMany(
          { _id: { $in: productIds } },
          { 
            $set: { isOnSale: false },
            $unset: { salePrice: '', saleStartDate: '', saleEndDate: '' }
          }
        )
        logDescription = `Removed sale from ${result.modifiedCount} products`
        break

      case 'update-category':
        if (!data?.category || !mongoose.Types.ObjectId.isValid(data.category)) {
          return NextResponse.json(
            { success: false, message: 'Valid category ID is required' },
            { status: 400 }
          )
        }
        
        const Category = mongoose.model('Category')
        const categoryExists = await Category.findById(data.category)
        if (!categoryExists) {
          return NextResponse.json(
            { success: false, message: 'Category not found' },
            { status: 404 }
          )
        }
        
        result = await Product.updateMany(
          { _id: { $in: productIds } },
          { $set: { category: data.category } }
        )
        logDescription = `Updated category for ${result.modifiedCount} products`
        break

      case 'adjust-price':
        if (!data?.adjustment || !data?.type) {
          return NextResponse.json(
            { success: false, message: 'Adjustment value and type are required' },
            { status: 400 }
          )
        }

        const products = await Product.find({ _id: { $in: productIds } })
        const bulkOps = products.map(product => {
          let newPrice = product.price
          
          if (data.type === 'percentage') {
            newPrice = product.price * (1 + data.adjustment / 100)
          } else if (data.type === 'fixed') {
            newPrice = product.price + data.adjustment
          }
          
          // Ensure price doesn't go below 0
          newPrice = Math.max(0, Math.round(newPrice * 100) / 100)
          
          return {
            updateOne: {
              filter: { _id: product._id },
              update: { $set: { price: newPrice } }
            }
          }
        })

        result = await Product.bulkWrite(bulkOps)
        logDescription = `Adjusted prices for ${result.modifiedCount} products by ${data.adjustment}${data.type === 'percentage' ? '%' : ' USD'}`
        break

      case 'delete':
        // Check for active orders
        const Order = mongoose.model('Order')
        const productsInOrders = await Order.distinct('items.product', {
          'items.product': { $in: productIds },
          orderStatus: { $in: ['pending', 'confirmed', 'processing', 'shipped'] }
        })

        if (productsInOrders.length > 0) {
          return NextResponse.json(
            { 
              success: false, 
              message: `Cannot delete ${productsInOrders.length} product(s) that are in active orders` 
            },
            { status: 400 }
          )
        }

        result = await Product.deleteMany({ _id: { $in: productIds } })
        logDescription = `Deleted ${result.deletedCount} products`
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
      action: action.toUpperCase().replace('-', '_'),
      entity: 'Product',
      description: logDescription,
      metadata: {
        action,
        productCount: productIds.length,
        modifiedCount: result.modifiedCount || result.deletedCount,
        data
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

// POST /api/admin/products/bulk - Bulk import products
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    await connectDB()

    const body = await request.json()
    const { products } = body

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Products array is required' },
        { status: 400 }
      )
    }

    // Validate and process products
    const results = {
      success: [] as any[],
      failed: [] as any[]
    }

    for (let i = 0; i < products.length; i++) {
      const productData = products[i]
      
      try {
        // Check for required fields
        if (!productData.name || !productData.slug || !productData.sku) {
          results.failed.push({
            row: i + 1,
            data: productData,
            error: 'Missing required fields (name, slug, sku)'
          })
          continue
        }

        // Check for duplicates
        const existingProduct = await Product.findOne({
          $or: [
            { slug: productData.slug },
            { sku: productData.sku }
          ]
        })

        if (existingProduct) {
          results.failed.push({
            row: i + 1,
            data: productData,
            error: 'Duplicate slug or SKU'
          })
          continue
        }

        // Create product
        const newProduct = await Product.create({
          ...productData,
          rating: 0,
          reviewCount: 0
        })

        results.success.push({
          row: i + 1,
          productId: newProduct._id,
          name: newProduct.name,
          sku: newProduct.sku
        })

      } catch (error: any) {
        results.failed.push({
          row: i + 1,
          data: productData,
          error: error.message
        })
      }
    }

    // Log bulk import activity
    await ActivityLog.create({
      user: session.user.id,
      action: 'CREATE',
      entity: 'Product',
      description: `Bulk imported ${results.success.length} products (${results.failed.length} failed)`,
      metadata: {
        totalAttempted: products.length,
        successCount: results.success.length,
        failedCount: results.failed.length
      }
    })

    return NextResponse.json({
      success: true,
      message: `Imported ${results.success.length} products successfully`,
      results: {
        total: products.length,
        success: results.success.length,
        failed: results.failed.length,
        successDetails: results.success,
        failedDetails: results.failed
      }
    }, { status: results.success.length > 0 ? 201 : 400 })

  } catch (error: any) {
    console.error('Error in bulk import:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Bulk import failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

