import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { bulkOrderUpdateSchema, ZodError } from '@/lib/validations/order'

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate request body
    try {
      const validatedData = bulkOrderUpdateSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json({
          success: false,
          message: 'Validation failed',
          errors: error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        }, { status: 400 })
      }
      throw error
    }

    const { orderIds, action, orderStatus, paymentStatus } = body

    await connectDB()

    let result
    let message

    switch (action) {
      case 'updateStatus':
        if (!orderStatus) {
          return NextResponse.json({
            success: false,
            message: 'Order status is required for status update'
          }, { status: 400 })
        }

        result = await Order.updateMany(
          { _id: { $in: orderIds } },
          { 
            $set: { 
              orderStatus,
              updatedAt: new Date()
            }
          }
        )

        message = `Updated status to ${orderStatus} for ${result.modifiedCount} orders`
        break

      case 'updatePaymentStatus':
        if (!paymentStatus) {
          return NextResponse.json({
            success: false,
            message: 'Payment status is required for payment status update'
          }, { status: 400 })
        }

        result = await Order.updateMany(
          { _id: { $in: orderIds } },
          { 
            $set: { 
              paymentStatus,
              updatedAt: new Date()
            }
          }
        )

        message = `Updated payment status to ${paymentStatus} for ${result.modifiedCount} orders`
        break

      case 'delete':
        result = await Order.deleteMany({ _id: { $in: orderIds } })
        message = `Deleted ${result.deletedCount} orders`
        break

      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid action'
        }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message,
      data: {
        affectedCount: (result as any).modifiedCount || (result as any).deletedCount,
        orderIds
      }
    })

  } catch (error) {
    console.error('Bulk order update error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
