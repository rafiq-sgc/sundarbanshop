import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Banner from '@/models/Banner'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const position = searchParams.get('position')
    const status = searchParams.get('status')

    // Build query
    const query: any = {}
    
    if (position) {
      query.position = position
    }
    
    if (status) {
      query.isActive = status === 'active'
    }

    // Get banners
    const banners = await Banner.find(query)
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean()

    // Calculate stats
    const totalBanners = await Banner.countDocuments()
    const activeBanners = await Banner.countDocuments({ isActive: true })
    const inactiveBanners = totalBanners - activeBanners
    const heroBanners = await Banner.countDocuments({ position: 'hero' })
    const totalClicks = await Banner.aggregate([
      { $group: { _id: null, total: { $sum: '$clicks' } } }
    ])

    const stats = {
      total: totalBanners,
      active: activeBanners,
      inactive: inactiveBanners,
      hero: heroBanners,
      totalClicks: totalClicks[0]?.total || 0
    }

    return NextResponse.json({
      success: true,
      data: {
        banners,
        stats
      }
    })

  } catch (error) {
    console.error('Error fetching banners:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch banners' },
      { status: 500 }
    )
  }
}
