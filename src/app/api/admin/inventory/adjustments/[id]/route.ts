import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import InventoryAdjustment from '@/models/InventoryAdjustment'
import Warehouse from '@/models/Warehouse'
import Product from '@/models/Product'

// GET /api/admin/inventory/adjustments/[id] - Get adjustment by ID
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

    const adjustment = await InventoryAdjustment.findById(params.id)
      .populate('warehouse', 'name code address')
      .populate('adjustedBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('items.product', 'name sku images price')
      .lean()

    if (!adjustment) {
      return NextResponse.json(
        { error: 'Adjustment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ adjustment })
  } catch (error: any) {
    console.error('Get adjustment error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch adjustment' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/inventory/adjustments/[id] - Approve/Reject adjustment
export async function PATCH(
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
    const { action } = body // approve, reject

    const adjustment = await InventoryAdjustment.findById(params.id)
    if (!adjustment) {
      return NextResponse.json(
        { error: 'Adjustment not found' },
        { status: 404 }
      )
    }

    if ((adjustment as any).status !== 'pending') {
      return NextResponse.json(
        { error: 'Adjustment has already been processed' },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      const warehouse = await Warehouse.findById((adjustment as any).warehouse)
      if (!warehouse) {
        return NextResponse.json(
          { error: 'Warehouse not found' },
          { status: 404 }
        )
      }

      // Apply adjustments to warehouse inventory
      for (const item of (adjustment as any).items) {
        const inventoryItem = (warehouse as any).inventory.find(
          (inv: any) => inv.product.toString() === item.product.toString()
        )

        if (inventoryItem) {
          // Update existing item
          inventoryItem.quantity = item.newQuantity
        } else if (item.newQuantity > 0) {
          // Add new item if quantity is positive
          (warehouse as any).inventory.push({
            product: item.product,
            quantity: item.newQuantity,
            reserved: 0
          })
        }
      }

      await warehouse.save()

      adjustment.status = 'approved';
      adjustment.approvedBy = session.user.id
    } 
    else if (action === 'reject') {
      adjustment.status = 'rejected';
      adjustment.approvedBy = session.user.id
    } 
    else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    await adjustment.save()

    // Populate for response
    await adjustment.populate('warehouse', 'name code')
    await adjustment.populate('adjustedBy', 'name email')
    await adjustment.populate('approvedBy', 'name email')

    return NextResponse.json({
      message: `Adjustment ${action}d successfully`,
      adjustment,
    })
  } catch (error: any) {
    console.error('Update adjustment error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update adjustment' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/inventory/adjustments/[id] - Delete adjustment
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

    const adjustment = await InventoryAdjustment.findById(params.id)
    if (!adjustment) {
      return NextResponse.json(
        { error: 'Adjustment not found' },
        { status: 404 }
      )
    }

    // Only allow deletion of pending or rejected adjustments
    if (!['pending', 'rejected'].includes((adjustment as any).status)) {
      return NextResponse.json(
        { error: 'Cannot delete approved adjustment' },
        { status: 400 }
      )
    }

    await adjustment.deleteOne()

    return NextResponse.json({
      message: 'Adjustment deleted successfully',
    })
  } catch (error: any) {
    console.error('Delete adjustment error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete adjustment' },
      { status: 500 }
    )
  }
}

