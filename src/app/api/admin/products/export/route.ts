import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import ActivityLog from '@/models/ActivityLog'

// GET /api/admin/products/export - Export products to CSV/JSON
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json' // json or csv
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    // Build filter
    const filter: any = {}
    if (category && category !== 'all') {
      filter.category = category
    }
    if (status === 'active') {
      filter.isActive = true
    } else if (status === 'inactive') {
      filter.isActive = false
    }

    // Fetch all products matching filter
    const products = await Product.find(filter)
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .lean()

    // Log export activity
    await ActivityLog.create({
      user: session.user.id,
      action: 'EXPORT',
      entity: 'Product',
      description: `Exported ${products.length} products as ${format.toUpperCase()}`,
      metadata: {
        format,
        count: products.length,
        filter
      }
    })

    if (format === 'csv') {
      // Convert to CSV
      const headers = [
        'ID', 'Name', 'Slug', 'SKU', 'Barcode', 'Price', 'Compare Price', 
        'Sale Price', 'Stock', 'Category', 'Tags', 'Active', 'Featured', 
        'On Sale', 'Created At'
      ]

      const csvRows = [headers.join(',')]
      
      products.forEach(product => {
        const row = [
          product._id,
          `"${product.name.replace(/"/g, '""')}"`,
          product.slug,
          product.sku,
          product.barcode || '',
          product.price,
          product.comparePrice || '',
          product.salePrice || '',
          product.stock,
          `"${(product.category as any)?.name || ''}"`,
          `"${product.tags?.join(', ') || ''}"`,
          product.isActive ? 'Yes' : 'No',
          product.isFeatured ? 'Yes' : 'No',
          product.isOnSale ? 'Yes' : 'No',
          new Date(product.createdAt).toISOString()
        ]
        csvRows.push(row.join(','))
      })

      const csv = csvRows.join('\n')

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="products-${Date.now()}.csv"`
        }
      })

    } else {
      // Return JSON
      return NextResponse.json({
        success: true,
        data: products,
        count: products.length,
        exportedAt: new Date().toISOString()
      })
    }

  } catch (error: any) {
    console.error('Error exporting products:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Export failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

