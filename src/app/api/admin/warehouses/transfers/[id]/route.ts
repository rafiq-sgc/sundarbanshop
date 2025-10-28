import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import StockTransfer from '@/models/StockTransfer'
import Warehouse from '@/models/Warehouse'
import Product from '@/models/Product'

// GET /api/admin/warehouses/transfers/[id] - Get transfer by ID
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

    const transfer = await StockTransfer.findById(params.id)
      .populate('fromWarehouse', 'name code address')
      .populate('toWarehouse', 'name code address')
      .populate('requestedBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('completedBy', 'name email')
      .populate('items.product', 'name sku images price')
      .lean()

    if (!transfer) {
      return NextResponse.json(
        { error: 'Transfer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ transfer })
  } catch (error: any) {
    console.error('Get transfer error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch transfer' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/warehouses/transfers/[id] - Update transfer status
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
    const { action } = body // approve, complete, cancel

    const transfer = await StockTransfer.findById(params.id)
    if (!transfer) {
      return NextResponse.json(
        { error: 'Transfer not found' },
        { status: 404 }
      )
    }

    const fromWarehouse = await Warehouse.findById((transfer as any).fromWarehouse)
    const toWarehouse = await Warehouse.findById((transfer as any).toWarehouse)

    if (!fromWarehouse || !toWarehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      )
    }

    if (action === 'approve' && (transfer as any).status === 'pending') {
      (transfer as any).status = 'in_transit';
      (transfer as any).approvedBy = session.user.id;
      (transfer as any).approvedDate = new Date()
    } 
    else if (action === 'complete' && (transfer as any).status === 'in_transit') {
      // Unreserve and subtract from source warehouse
      for (const item of (transfer as any).items) {
        const sourceItem = (fromWarehouse as any).inventory.find(
          (inv: any) => inv.product.toString() === item.product.toString()
        )
        if (sourceItem) {
          sourceItem.reserved -= item.quantity
          sourceItem.quantity -= item.quantity
        }

        // Add to destination warehouse
        await toWarehouse.updateStock(item.product.toString(), item.quantity, 'add')
      }

      await fromWarehouse.save()

      transfer.status = 'completed';
      transfer.completedBy = session.user.id;
      transfer.completedDate = new Date()
    } 
    else if (action === 'cancel' && ['pending', 'in_transit'].includes((transfer as any).status)) {
      // Unreserve stock in source warehouse
      for (const item of (transfer as any).items) {
        const sourceItem = (fromWarehouse as any).inventory.find(
          (inv: any) => inv.product.toString() === item.product.toString()
        )
        if (sourceItem) {
          sourceItem.reserved -= item.quantity
        }
      }
      await fromWarehouse.save()

      transfer.status = 'cancelled'
    } 
    else {
      return NextResponse.json(
        { error: 'Invalid action or status transition' },
        { status: 400 }
      )
    }

    await transfer.save()

    // Populate for response
    await transfer.populate('fromWarehouse', 'name code')
    await transfer.populate('toWarehouse', 'name code')
    await transfer.populate('requestedBy', 'name email')
    await transfer.populate('approvedBy', 'name email')
    await transfer.populate('completedBy', 'name email')

    return NextResponse.json({
      message: `Transfer ${action}d successfully`,
      transfer,
    })
  } catch (error: any) {
    console.error('Update transfer error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update transfer' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/warehouses/transfers/[id] - Delete transfer
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

    const transfer = await StockTransfer.findById(params.id)
    if (!transfer) {
      return NextResponse.json(
        { error: 'Transfer not found' },
        { status: 404 }
      )
    }

    // Only allow deletion of pending or cancelled transfers
    if (!['pending', 'cancelled'].includes((transfer as any).status)) {
      return NextResponse.json(
        { error: 'Cannot delete transfer in current status' },
        { status: 400 }
      )
    }

    // If pending, unreserve stock
    if ((transfer as any).status === 'pending') {
      const fromWarehouse = await Warehouse.findById((transfer as any).fromWarehouse)
      if (fromWarehouse) {
        for (const item of (transfer as any).items) {
          const sourceItem = (fromWarehouse as any).inventory.find(
            (inv: any) => inv.product.toString() === item.product.toString()
          )
          if (sourceItem) {
            sourceItem.reserved -= item.quantity
          }
        }
        await fromWarehouse.save()
      }
    }

    await transfer.deleteOne()

    return NextResponse.json({
      message: 'Transfer deleted successfully',
    })
  } catch (error: any) {
    console.error('Delete transfer error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete transfer' },
      { status: 500 }
    )
  }
}

