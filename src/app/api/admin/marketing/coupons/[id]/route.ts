import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Coupon from '@/models/Coupon'
import ActivityLog from '@/models/ActivityLog'

// GET - Get single coupon
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

    const coupon = await Coupon.findById(params.id)
      .populate('createdBy', 'name email')
      .populate('applicableCategories', 'name')
      .populate('applicableProducts', 'name')
      .populate('excludedProducts', 'name')
      .lean()

    if (!coupon) {
      return NextResponse.json(
        { success: false, message: 'Coupon not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: coupon
    })

  } catch (error: any) {
    console.error('Error fetching coupon:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch coupon' },
      { status: 500 }
    )
  }
}

// PUT - Update coupon
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
    const oldCoupon = await Coupon.findById(params.id).lean()

    if (!oldCoupon) {
      return NextResponse.json(
        { success: false, message: 'Coupon not found' },
        { status: 404 }
      )
    }

    // Check code uniqueness if changed
    if (body.code && body.code.toUpperCase() !== (oldCoupon as any).code) {
      const existing = await Coupon.findOne({ 
        code: body.code.toUpperCase(),
        _id: { $ne: params.id }
      })
      if (existing) {
        return NextResponse.json(
          { success: false, message: 'Coupon code already exists' },
          { status: 400 }
        )
      }
    }

    const coupon = await Coupon.findByIdAndUpdate(
      params.id,
      { 
        ...body,
        code: body.code ? body.code.toUpperCase() : (oldCoupon as any).code
      },
      { new: true, runValidators: true }
    )

    // Log activity
    await ActivityLog.create({
      user: session.user.id,
      action: 'UPDATE',
      entity: 'Coupon',
      entityId: params.id,
      description: `Updated coupon: ${(oldCoupon as any).code}`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      changes: {
        before: {
          code: (oldCoupon as any).code,
          value: (oldCoupon as any).value,
          isActive: (oldCoupon as any).isActive
        },
        after: {
          code: coupon?.code,
          value: coupon?.value,
          isActive: coupon?.isActive
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: coupon,
      message: 'Coupon updated successfully'
    })

  } catch (error: any) {
    console.error('Error updating coupon:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update coupon' },
      { status: 500 }
    )
  }
}

// DELETE - Delete coupon
export async function DELETE(
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

    const coupon = await Coupon.findById(params.id).lean()

    if (!coupon) {
      return NextResponse.json(
        { success: false, message: 'Coupon not found' },
        { status: 404 }
      )
    }

    // Don't allow deletion if coupon has been used
    if ((coupon as any).usageCount > 0) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete coupon that has been used. Consider deactivating it instead.' },
        { status: 400 }
      )
    }

    await Coupon.findByIdAndDelete(params.id)

    // Log activity
    await ActivityLog.create({
      user: session.user.id,
      action: 'DELETE',
      entity: 'Coupon',
      entityId: params.id,
      description: `Deleted coupon: ${(coupon as any).code}`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      metadata: {
        deletedCode: (coupon as any).code,
        wasUsed: (coupon as any).usageCount > 0
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Coupon deleted successfully'
    })

  } catch (error: any) {
    console.error('Error deleting coupon:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete coupon' },
      { status: 500 }
    )
  }
}

// PATCH - Toggle coupon status or duplicate
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
    const { action, isActive } = body

    if (action === 'toggleActive') {
      const coupon = await Coupon.findByIdAndUpdate(
        params.id,
        { isActive },
        { new: true }
      )

      if (!coupon) {
        return NextResponse.json(
          { success: false, message: 'Coupon not found' },
          { status: 404 }
        )
      }

      // Log activity
      await ActivityLog.create({
        user: session.user.id,
        action: 'UPDATE',
        entity: 'Coupon',
        entityId: params.id,
        description: `${isActive ? 'Activated' : 'Deactivated'} coupon: ${coupon.code}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      })

      return NextResponse.json({
        success: true,
        data: coupon,
        message: `Coupon ${isActive ? 'activated' : 'deactivated'} successfully`
      })
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    )

  } catch (error: any) {
    console.error('Error updating coupon:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update coupon' },
      { status: 500 }
    )
  }
}

