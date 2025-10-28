import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import GiftCard from '@/models/GiftCard'
import ActivityLog from '@/models/ActivityLog'

// GET - Get single gift card
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

    const giftCard = await GiftCard.findById(params.id)
      .populate('createdBy', 'name email')
      .populate('purchasedBy', 'name email')
      .populate('transactions.order', 'orderNumber')
      .lean()

    if (!giftCard) {
      return NextResponse.json(
        { success: false, message: 'Gift card not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: giftCard
    })

  } catch (error: any) {
    console.error('Error fetching gift card:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch gift card' },
      { status: 500 }
    )
  }
}

// PUT - Update gift card
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
    const oldCard = await GiftCard.findById(params.id).lean()

    if (!oldCard) {
      return NextResponse.json(
        { success: false, message: 'Gift card not found' },
        { status: 404 }
      )
    }

    const giftCard = await GiftCard.findByIdAndUpdate(
      params.id,
      body,
      { new: true, runValidators: true }
    )

    // Log activity
    await ActivityLog.create({
      user: session.user.id,
      action: 'UPDATE',
      entity: 'GiftCard',
      entityId: params.id,
      description: `Updated gift card: ${(oldCard as any).code}`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      changes: {
        before: {
          status: (oldCard as any).status,
          currentBalance: (oldCard as any).currentBalance
        },
        after: {
          status: giftCard?.status,
          currentBalance: giftCard?.currentBalance
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: giftCard,
      message: 'Gift card updated successfully'
    })

  } catch (error: any) {
    console.error('Error updating gift card:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update gift card' },
      { status: 500 }
    )
  }
}

// DELETE - Delete gift card
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

    const giftCard = await GiftCard.findById(params.id).lean()

    if (!giftCard) {
      return NextResponse.json(
        { success: false, message: 'Gift card not found' },
        { status: 404 }
      )
    }

    // Don't allow deletion of used gift cards
    if ((giftCard as any).transactions.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete gift card with transaction history. Consider cancelling it instead.' },
        { status: 400 }
      )
    }

    await GiftCard.findByIdAndDelete(params.id)

    // Log activity
    await ActivityLog.create({
      user: session.user.id,
      action: 'DELETE',
      entity: 'GiftCard',
      entityId: params.id,
      description: `Deleted gift card: ${(giftCard as any).code}`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      metadata: {
        deletedCode: (giftCard as any).code,
        hadTransactions: (giftCard as any).transactions.length > 0
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Gift card deleted successfully'
    })

  } catch (error: any) {
    console.error('Error deleting gift card:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete gift card' },
      { status: 500 }
    )
  }
}

// PATCH - Cancel gift card or adjust balance
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
    const { action, amount, description } = body

    const giftCard = await GiftCard.findById(params.id)

    if (!giftCard) {
      return NextResponse.json(
        { success: false, message: 'Gift card not found' },
        { status: 404 }
      )
    }

    if (action === 'cancel') {
      giftCard.status = 'cancelled'
      await giftCard.save()

      // Log activity
      await ActivityLog.create({
        user: session.user.id,
        action: 'UPDATE',
        entity: 'GiftCard',
        entityId: params.id,
        description: `Cancelled gift card: ${giftCard.code}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      })

      return NextResponse.json({
        success: true,
        data: giftCard,
        message: 'Gift card cancelled successfully'
      })
    } else if (action === 'adjustBalance') {
      if (!amount || !description) {
        return NextResponse.json(
          { success: false, message: 'Amount and description are required' },
          { status: 400 }
        )
      }

      if (amount > 0) {
        await giftCard.credit(amount, description)
      } else if (amount < 0) {
        await giftCard.debit(Math.abs(amount), '', description)
      }

      // Log activity
      await ActivityLog.create({
        user: session.user.id,
        action: 'UPDATE',
        entity: 'GiftCard',
        entityId: params.id,
        description: `Adjusted gift card balance: ${giftCard.code} (${amount > 0 ? '+' : ''}৳${amount})`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        metadata: {
          adjustment: amount,
          description
        }
      })

      return NextResponse.json({
        success: true,
        data: giftCard,
        message: 'Gift card balance adjusted successfully'
      })
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    )

  } catch (error: any) {
    console.error('Error updating gift card:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update gift card' },
      { status: 500 }
    )
  }
}

