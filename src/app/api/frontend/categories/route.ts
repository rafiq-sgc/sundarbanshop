export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Category from '@/models/Category'

// GET - Get all active categories (PUBLIC - No authentication required)
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const parent = searchParams.get('parent') // 'root' for top-level categories

    // Build query
    const query: any = { isActive: true }

    if (parent === 'root') {
      query.parent = null
    } else if (parent) {
      query.parent = parent
    }

    const categories = await Category.find(query)
      .populate('parent', 'name slug')
      .sort({ sortOrder: 1, name: 1 })
      .select('-__v')
      .lean()

    return NextResponse.json({
      success: true,
      data: categories
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
