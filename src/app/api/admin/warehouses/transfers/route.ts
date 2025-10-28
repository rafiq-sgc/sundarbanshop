import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import StockTransfer from '@/models/StockTransfer'
import Warehouse from '@/models/Warehouse'
import Product from '@/models/Product'
import { z } from 'zod'

// Validation schema
const transferItemSchema = z.object({
  product: z.string(),
  quantity: z.number().min(1),
  notes: z.string().optional(),
})

const stockTransferSchema = z.object({
  fromWarehouse: z.string(),
  toWarehouse: z.string(),
  items: z.array(transferItemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional(),
})

// GET /api/admin/warehouses/transfers - Get all stock transfers
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
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build query
    const query: any = {}
    
    if (status) {
      query.status = status
    }

    if (warehouseId) {
      query.$or = [
        { fromWarehouse: warehouseId },
        { toWarehouse: warehouseId }
      ]
    }

    // Get transfers with pagination
    const skip = (page - 1) * limit
    const transfers = await StockTransfer.find(query)
      .populate('fromWarehouse', 'name code')
      .populate('toWarehouse', 'name code')
      .populate('requestedBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('completedBy', 'name email')
      .populate('items.product', 'name sku images')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Get total count
    const total = await StockTransfer.countDocuments(query)

    // Calculate stats
    const stats = {
      total: await StockTransfer.countDocuments(),
      pending: await StockTransfer.countDocuments({ status: 'pending' }),
      in_transit: await StockTransfer.countDocuments({ status: 'in_transit' }),
      completed: await StockTransfer.countDocuments({ status: 'completed' }),
      cancelled: await StockTransfer.countDocuments({ status: 'cancelled' }),
    }

    return NextResponse.json({
      transfers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      stats,
    })
  } catch (error: any) {
    console.error('Get transfers error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch transfers' },
      { status: 500 }
    )
  }
}

// POST /api/admin/warehouses/transfers - Create new stock transfer
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const body = await request.json()
    const validatedData = stockTransferSchema.parse(body)

    // Validate warehouses exist and are different
    if (validatedData.fromWarehouse === validatedData.toWarehouse) {
      return NextResponse.json(
        { error: 'Source and destination warehouses must be different' },
        { status: 400 }
      )
    }

    const fromWarehouse = await Warehouse.findById(validatedData.fromWarehouse)
    const toWarehouse = await Warehouse.findById(validatedData.toWarehouse)

    if (!fromWarehouse || !toWarehouse) {
      return NextResponse.json(
        { error: 'One or both warehouses not found' },
        { status: 404 }
      )
    }

    // Check stock availability
    for (const item of validatedData.items) {
      const availableStock = fromWarehouse.getAvailableStock(item.product)
      if (availableStock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for product ${item.product}` },
          { status: 400 }
        )
      }
    }

    // Reserve stock in source warehouse
    for (const item of validatedData.items) {
      const inventoryItem = (fromWarehouse as any).inventory.find(
        (inv: any) => inv.product.toString() === item.product
      )
      if (inventoryItem) {
        inventoryItem.reserved += item.quantity
      }
    }
    await fromWarehouse.save()

    // Create transfer
    const transfer = new StockTransfer({
      ...validatedData,
      requestedBy: session.user.id,
      requestedDate: new Date(),
    })
    await transfer.save()

    // Populate for response
    await transfer.populate('fromWarehouse', 'name code')
    await transfer.populate('toWarehouse', 'name code')
    await transfer.populate('requestedBy', 'name email')
    await transfer.populate('items.product', 'name sku')

    return NextResponse.json({
      message: 'Stock transfer created successfully',
      transfer,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Create transfer error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create transfer' },
      { status: 500 }
    )
  }
}

