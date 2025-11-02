export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Cart from '@/models/Cart'
import User from '@/models/User'
import '@/models/Product'

// GET - Get abandoned carts
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
    const status = searchParams.get('status') || ''
    const search = searchParams.get('search') || ''

    // Calculate abandoned cart threshold (24 hours ago)
    const abandonedThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Build query for abandoned carts (carts older than 24 hours with items)
    const query: any = {
      'items.0': { $exists: true }, // Has at least one item
      updatedAt: { $lt: abandonedThreshold }
    }

    // Get all abandoned carts
    const carts = await Cart.find(query)
      .populate('userId', 'name email phone')
      .populate('items.product', 'name images price')
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean()

    // Transform carts to include customer info and cart details
    const abandonedCarts = carts
      .filter((cart: any) => {
        // Filter by search if provided
        if (search) {
          const userName = cart.userId?.name?.toLowerCase() || ''
          const userEmail = cart.userId?.email?.toLowerCase() || ''
          const searchLower = search.toLowerCase()
          return userName.includes(searchLower) || userEmail.includes(searchLower)
        }
        return true
      })
      .map((cart: any) => {
        const totalValue = cart.items.reduce(
          (sum: number, item: any) => sum + (item.price * item.quantity),
          0
        )

        // Calculate hours since abandoned
        const hoursSinceAbandoned = Math.floor(
          (Date.now() - new Date(cart.updatedAt).getTime()) / (1000 * 60 * 60)
        )

        // Determine recovery status based on time
        let recoveryStatus = 'pending'
        if (hoursSinceAbandoned > 168) { // 7 days
          recoveryStatus = 'lost'
        } else if (hoursSinceAbandoned > 48) { // 2 days
          recoveryStatus = 'follow-up'
        }

        return {
          _id: cart._id,
          userId: cart.userId?._id,
          customer: {
            name: cart.userId?.name || 'Guest User',
            email: cart.userId?.email || 'N/A',
            phone: cart.userId?.phone || 'N/A'
          },
          items: cart.items.map((item: any) => ({
            product: {
              _id: item.product?._id,
              name: item.product?.name || 'Unknown Product',
              image: item.product?.images?.[0] || '/placeholder.png',
              price: item.price
            },
            quantity: item.quantity
          })),
          totalValue,
          abandonedAt: cart.updatedAt,
          recoveryStatus,
          emailsSent: 0, // This would come from email tracking system
          hoursSinceAbandoned
        }
      })
      .filter((cart: any) => {
        // Filter by status if provided
        if (status && status !== 'all') {
          return cart.recoveryStatus === status
        }
        return true
      })

    // Calculate stats
    const stats = {
      total: abandonedCarts.length,
      totalValue: abandonedCarts.reduce((sum: number, cart: any) => sum + cart.totalValue, 0),
      pending: abandonedCarts.filter((c: any) => c.recoveryStatus === 'pending').length,
      followUp: abandonedCarts.filter((c: any) => c.recoveryStatus === 'follow-up').length,
      lost: abandonedCarts.filter((c: any) => c.recoveryStatus === 'lost').length,
      averageValue: abandonedCarts.length > 0
        ? abandonedCarts.reduce((sum: number, cart: any) => sum + cart.totalValue, 0) / abandonedCarts.length
        : 0
    }

    return NextResponse.json({
      success: true,
      data: {
        carts: abandonedCarts,
        stats
      }
    })

  } catch (error: any) {
    console.error('Error fetching abandoned carts:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch abandoned carts' },
      { status: 500 }
    )
  }
}

