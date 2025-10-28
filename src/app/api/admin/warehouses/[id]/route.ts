import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Warehouse from '@/models/Warehouse'
import Product from '@/models/Product'
import { z } from 'zod'

// Validation schema
const warehouseUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  code: z.string().min(2).max(10).toUpperCase().optional(),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zipCode: z.string().min(1),
    country: z.string().min(1),
  }).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  manager: z.string().optional(),
  isActive: z.boolean().optional(),
})

// GET /api/admin/warehouses/[id] - Get warehouse by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const warehouse = await Warehouse.findById(params.id)
      .populate('manager', 'name email')
      .populate('inventory.product', 'name sku images price')
      .lean()

    if (!warehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      )
    }

    // Calculate total inventory value and items
    const inventoryStats = {
      totalItems: (warehouse as any).inventory?.length || 0,
      totalQuantity: (warehouse as any).inventory?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0,
      totalReserved: (warehouse as any).inventory?.reduce((sum: number, item: any) => sum + item.reserved, 0) || 0,
      totalAvailable: (warehouse as any).inventory?.reduce((sum: number, item: any) => sum + (item.quantity - item.reserved), 0) || 0,
    }

    return NextResponse.json({
      warehouse,
      stats: inventoryStats,
    })
  } catch (error: any) {
    console.error('Get warehouse error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch warehouse' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/warehouses/[id] - Update warehouse
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const body = await request.json()
    const validatedData = warehouseUpdateSchema.parse(body)

    const warehouse = await Warehouse.findById(params.id)
    if (!warehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      )
    }

    // Check if code is being changed and if it already exists
    if (validatedData.code && validatedData.code !== (warehouse as any).code) {
      const existingWarehouse = await Warehouse.findOne({ code: validatedData.code })
      if (existingWarehouse) {
        return NextResponse.json(
          { error: 'Warehouse code already exists' },
          { status: 400 }
        )
      }
    }

    // Update warehouse
    Object.assign(warehouse, validatedData)
    await warehouse.save()

    return NextResponse.json({
      message: 'Warehouse updated successfully',
      warehouse,
    })
  } catch (error: any) {
    console.error('Update warehouse error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update warehouse' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/warehouses/[id] - Delete warehouse
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const warehouse = await Warehouse.findById(params.id)
    if (!warehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      )
    }

    // Check if warehouse has inventory
    if ((warehouse as any).inventory && (warehouse as any).inventory.length > 0) {
      const hasStock = (warehouse as any).inventory.some((item: any) => item.quantity > 0)
      if (hasStock) {
        return NextResponse.json(
          { error: 'Cannot delete warehouse with existing inventory' },
          { status: 400 }
        )
      }
    }

    await warehouse.deleteOne()

    return NextResponse.json({
      message: 'Warehouse deleted successfully',
    })
  } catch (error: any) {
    console.error('Delete warehouse error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete warehouse' },
      { status: 500 }
    )
  }
}

