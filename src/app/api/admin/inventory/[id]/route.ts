import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
// Import Category model to ensure it's registered
import '@/models/Category'
import ActivityLog from '@/models/ActivityLog'

// GET /api/admin/inventory/[id] - Get single inventory item details
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

    const product = await Product.findById(params.id)
      .populate('category', 'name')
      .lean()

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      )
    }

    // Get recent activity logs for this product
    const activityLogs = await ActivityLog.find({
      targetType: 'Product',
      targetId: params.id
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name email')
      .lean()

    const currentStock = (product as any).stock || 0
    const minStock = (product as any).lowStockThreshold || 0
    const reorderLevel = (product as any).reorderLevel || minStock
    const maxStock = (product as any).maxStock || minStock * 5

    let status: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock'
    if (currentStock === 0) {
      status = 'out_of_stock'
    } else if (currentStock <= minStock) {
      status = 'low_stock'
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: (product as any)._id,
        productName: (product as any).name,
        sku: (product as any).sku,
        image: (product as any).images?.[0] || '/images/products/placeholder.jpg',
        images: (product as any).images || [],
        currentStock,
        minStock,
        maxStock,
        reorderLevel,
        status,
        price: (product as any).price,
        category: (product as any).category,
        lastRestocked: (product as any).lastRestockedAt || (product as any).createdAt,
        stockValue: currentStock * (product as any).price,
        activityLogs
      }
    })

  } catch (error: any) {
    console.error('Error fetching inventory item:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch inventory item' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/inventory/[id] - Update inventory item
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
    const { stock, lowStockThreshold, reorderLevel, maxStock, reason } = body

    const product = await Product.findById(params.id)

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      )
    }

    const previousStock = product.stock || 0

    // Update fields
    if (typeof stock === 'number') {
      product.stock = stock
      product.lastRestockedAt = new Date()
    }
    if (typeof lowStockThreshold === 'number') {
      product.lowStockThreshold = lowStockThreshold
    }
    if (typeof reorderLevel === 'number') {
      product.reorderLevel = reorderLevel
    }
    if (typeof maxStock === 'number') {
      product.maxStock = maxStock
    }

    await product.save()

    // Log activity
    if (stock !== undefined && stock !== previousStock) {
      await ActivityLog.create({
        user: session.user.id,
        action: 'UPDATE',
        entity: 'Product',
        entityId: params.id,
        description: `Stock adjusted from ${previousStock} to ${stock}. ${reason ? `Reason: ${reason}` : ''}`,
        changes: {
          before: { stock: previousStock },
          after: { stock: stock }
        },
        metadata: {
          previousStock,
          newStock: stock,
          difference: stock - previousStock,
          reason: reason || 'Manual adjustment'
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Inventory updated successfully',
      data: {
        _id: product._id,
        productName: product.name,
        sku: product.sku,
        currentStock: product.stock,
        minStock: product.lowStockThreshold,
        maxStock: product.maxStock,
        reorderLevel: product.reorderLevel
      }
    })

  } catch (error: any) {
    console.error('Error updating inventory:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update inventory' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/inventory/[id]/adjust - Adjust stock (add/subtract)
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
    const { operation, quantity, reason } = body

    if (!operation || typeof quantity !== 'number') {
      return NextResponse.json(
        { success: false, message: 'Operation and quantity are required' },
        { status: 400 }
      )
    }

    const product = await Product.findById(params.id)

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      )
    }

    const previousStock = product.stock || 0
    let newStock = previousStock

    switch (operation) {
      case 'add':
        newStock = previousStock + quantity
        break
      case 'subtract':
        newStock = Math.max(0, previousStock - quantity)
        break
      case 'set':
        newStock = quantity
        break
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid operation. Use add, subtract, or set.' },
          { status: 400 }
        )
    }

    product.stock = newStock
    product.lastRestockedAt = new Date()
    await product.save()

    // Log activity
    await ActivityLog.create({
      user: session.user.id,
      action: 'UPDATE',
      entity: 'Product',
      entityId: params.id,
      description: `Stock ${operation}: ${quantity} units. From ${previousStock} to ${newStock}. ${reason ? `Reason: ${reason}` : ''}`,
      changes: {
        before: { stock: previousStock },
        after: { stock: newStock }
      },
      metadata: {
        operation,
        quantity,
        previousStock,
        newStock,
        difference: newStock - previousStock,
        reason: reason || `Stock ${operation} operation`
      }
    })

    return NextResponse.json({
      success: true,
      message: `Stock ${operation} successfully`,
      data: {
        _id: product._id,
        productName: product.name,
        sku: product.sku,
        previousStock,
        currentStock: newStock,
        difference: newStock - previousStock
      }
    })

  } catch (error: any) {
    console.error('Error adjusting stock:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to adjust stock' },
      { status: 500 }
    )
  }
}

