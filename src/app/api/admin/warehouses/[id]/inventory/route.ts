import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Warehouse from '@/models/Warehouse'
import Product from '@/models/Product'

// GET /api/admin/warehouses/[id]/inventory - Get warehouse inventory
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

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const lowStock = searchParams.get('lowStock') === 'true'

    const warehouse = await Warehouse.findById(params.id)
      .populate({
        path: 'inventory.product',
        select: 'name sku images price stock lowStockThreshold'
      })
      .lean()

    if (!warehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      )
    }

    let inventory = (warehouse as any).inventory || []

    // Filter by search
    if (search) {
      inventory = inventory.filter((item: any) => {
        const product = item.product
        return (
          product.name.toLowerCase().includes(search.toLowerCase()) ||
          product.sku.toLowerCase().includes(search.toLowerCase())
        )
      })
    }

    // Filter by low stock
    if (lowStock) {
      inventory = inventory.filter((item: any) => {
        const available = item.quantity - item.reserved
        const threshold = item.product.lowStockThreshold || 10
        return available <= threshold
      })
    }

    // Add calculated fields
    inventory = inventory.map((item: any) => ({
      ...item,
      available: item.quantity - item.reserved,
      lowStockThreshold: item.product.lowStockThreshold || 10,
      isLowStock: (item.quantity - item.reserved) <= (item.product.lowStockThreshold || 10)
    }))

    // Calculate summary stats
    const stats = {
      totalItems: inventory.length,
      totalQuantity: inventory.reduce((sum: number, item: any) => sum + item.quantity, 0),
      totalReserved: inventory.reduce((sum: number, item: any) => sum + item.reserved, 0),
      totalAvailable: inventory.reduce((sum: number, item: any) => sum + (item.quantity - item.reserved), 0),
      lowStockCount: inventory.filter((item: any) => item.isLowStock).length,
    }

    return NextResponse.json({
      inventory,
      stats,
    })
  } catch (error: any) {
    console.error('Get inventory error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}

// POST /api/admin/warehouses/[id]/inventory - Add/Update product in warehouse
export async function POST(
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
    const { productId, quantity, operation } = body // operation: 'add' or 'set'

    if (!productId || quantity === undefined) {
      return NextResponse.json(
        { error: 'Product ID and quantity are required' },
        { status: 400 }
      )
    }

    const warehouse = await Warehouse.findById(params.id)
    if (!warehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      )
    }

    // Verify product exists
    const product = await Product.findById(productId)
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const inventoryItem = (warehouse as any).inventory.find(
      (inv: any) => inv.product.toString() === productId
    )

    if (operation === 'set') {
      if (inventoryItem) {
        inventoryItem.quantity = quantity
      } else {
        (warehouse as any).inventory.push({
          product: productId,
          quantity,
          reserved: 0
        })
      }
    } else if (operation === 'add') {
      if (inventoryItem) {
        inventoryItem.quantity += quantity
      } else {
        (warehouse as any).inventory.push({
          product: productId,
          quantity,
          reserved: 0
        })
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid operation' },
        { status: 400 }
      )
    }

    await warehouse.save()

    return NextResponse.json({
      message: 'Inventory updated successfully',
      warehouse,
    })
  } catch (error: any) {
    console.error('Update inventory error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update inventory' },
      { status: 500 }
    )
  }
}

