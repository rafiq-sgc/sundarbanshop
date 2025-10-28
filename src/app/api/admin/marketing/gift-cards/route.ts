import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import GiftCard from '@/models/GiftCard'
import ActivityLog from '@/models/ActivityLog'

// GET - Get all gift cards with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    // Build query
    const query: any = {}

    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { recipientEmail: { $regex: search, $options: 'i' } },
        { recipientName: { $regex: search, $options: 'i' } }
      ]
    }

    if (status) {
      query.status = status
    }

    const giftCards = await GiftCard.find(query)
      .populate('createdBy', 'name email')
      .populate('purchasedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean()

    // Calculate stats
    const allCards = await GiftCard.find().lean()
    const stats = {
      total: allCards.length,
      active: allCards.filter(c => c.status === 'active').length,
      used: allCards.filter(c => c.status === 'used').length,
      expired: allCards.filter(c => c.status === 'expired').length,
      cancelled: allCards.filter(c => c.status === 'cancelled').length,
      totalValue: allCards.reduce((sum: number, card) => sum + card.initialAmount, 0),
      remainingValue: allCards.reduce((sum: number, card) => sum + card.currentBalance, 0),
      usedValue: allCards.reduce((sum: number, card) => sum + (card.initialAmount - card.currentBalance), 0)
    }

    return NextResponse.json({
      success: true,
      data: {
        giftCards,
        stats
      }
    })

  } catch (error: any) {
    console.error('Error fetching gift cards:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch gift cards' },
      { status: 500 }
    )
  }
}

// POST - Create new gift card
export async function POST(request: NextRequest) {
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
    const { initialAmount, recipientEmail, recipientName, message, expiryDate, count } = body

    // Validate amount
    if (!initialAmount || initialAmount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Valid initial amount is required' },
        { status: 400 }
      )
    }

    // Helper function to generate unique gift card code
    const generateGiftCardCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let code = ''
      for (let i = 0; i < 12; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return code
    }

    // Create multiple gift cards if count is specified
    const cardsToCreate = count || 1
    const createdCards = []

    for (let i = 0; i < cardsToCreate; i++) {
      const giftCard = await GiftCard.create({
        code: generateGiftCardCode(),
        initialAmount,
        currentBalance: initialAmount,
        currency: 'BDT',
        recipientEmail: cardsToCreate === 1 ? recipientEmail : undefined,
        recipientName: cardsToCreate === 1 ? recipientName : undefined,
        message: cardsToCreate === 1 ? message : undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        status: 'active',
        transactions: [],
        createdBy: session.user.id
      })

      createdCards.push(giftCard)

      // Log activity
      await ActivityLog.create({
        user: session.user.id,
        action: 'CREATE',
        entity: 'GiftCard',
        entityId: giftCard._id,
        description: `Created gift card: ${giftCard.code} (৳${initialAmount})`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        metadata: {
          giftCardCode: giftCard.code,
          initialAmount,
          recipientEmail
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: cardsToCreate > 1 ? createdCards : createdCards[0],
      message: `${cardsToCreate} gift card(s) created successfully`
    })

  } catch (error: any) {
    console.error('Error creating gift card:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create gift card' },
      { status: 500 }
    )
  }
}

