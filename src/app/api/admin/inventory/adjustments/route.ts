export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import InventoryAdjustment from '@/models/InventoryAdjustment'
import Warehouse from '@/models/Warehouse'
import Product from '@/models/Product'
import { z } from 'zod'

// Validation schema
const adjustmentItemSchema = z.object({
  product: z.string(),
  previousQuantity: z.number().min(0),
  newQuantity: z.number().min(0),
  difference: z.number(),
})

const inventoryAdjustmentSchema = z.object({
  warehouse: z.string(),
  items: z.array(adjustmentItemSchema).min(1, 'At least one item is required'),
  type: z.enum(['stock_count', 'damaged', 'lost', 'found', 'correction', 'other']),
  reason: z.string().min(1, 'Reason is required').max(500),
  notes: z.string().max(1000).optional(),
})

// GET /api/admin/inventory/adjustments - Get all adjustments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const warehouseId = searchParams.get('warehouseId')
    const type = searchParams.get('type')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build query
    const query: any = {}
    
    if (status) {
      query.status = status
    }

    if (warehouseId) {
      query.warehouse = warehouseId
    }

    if (type) {
      query.type = type
    }

    // Get adjustments with pagination
    const skip = (page - 1) * limit
    const adjustments = await InventoryAdjustment.find(query)
      .populate('warehouse', 'name code')
      .populate('adjustedBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('items.product', 'name sku images')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Get total count
    const total = await InventoryAdjustment.countDocuments(query)

    // Calculate stats
    const stats = {
      total: await InventoryAdjustment.countDocuments(),
      pending: await InventoryAdjustment.countDocuments({ status: 'pending' }),
      approved: await InventoryAdjustment.countDocuments({ status: 'approved' }),
      rejected: await InventoryAdjustment.countDocuments({ status: 'rejected' }),
    }

    return NextResponse.json({
      adjustments,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      stats,
    })
  } catch (error: any) {
    console.error('Get adjustments error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch adjustments' },
      { status: 500 }
    )
  }
}

// POST /api/admin/inventory/adjustments - Create new adjustment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const body = await request.json()
    const validatedData = inventoryAdjustmentSchema.parse(body)

    // Validate warehouse exists
    const warehouse = await Warehouse.findById(validatedData.warehouse)
    if (!warehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      )
    }

    // Verify quantities match actual inventory
    for (const item of validatedData.items) {
      const inventoryItem = (warehouse as any).inventory.find(
        (inv: any) => inv.product.toString() === item.product
      )
      const currentQuantity = inventoryItem ? inventoryItem.quantity : 0
      
      if (item.previousQuantity !== currentQuantity) {
        return NextResponse.json(
          { error: `Previous quantity mismatch for product ${item.product}` },
          { status: 400 }
        )
      }

      if (item.difference !== item.newQuantity - item.previousQuantity) {
        return NextResponse.json(
          { error: `Difference calculation error for product ${item.product}` },
          { status: 400 }
        )
      }
    }

    // Create adjustment
    const adjustment = new InventoryAdjustment({
      ...validatedData,
      adjustedBy: session.user.id,
    })
    await adjustment.save()

    // Populate for response
    await adjustment.populate('warehouse', 'name code')
    await adjustment.populate('adjustedBy', 'name email')
    await adjustment.populate('items.product', 'name sku')

    return NextResponse.json({
      message: 'Inventory adjustment created successfully',
      adjustment,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Create adjustment error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create adjustment' },
      { status: 500 }
    )
  }
}

