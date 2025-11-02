export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
// Import Category model to ensure it's registered
import '@/models/Category'

// GET /api/admin/inventory/export - Export inventory to CSV or PDF
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
    const format = searchParams.get('format') || 'csv' // csv or pdf
    const status = searchParams.get('status') || 'all'

    // Build query
    const query: any = {}

    if (status === 'low_stock') {
      query.$expr = { $lte: ['$stock', '$lowStockThreshold'] }
    } else if (status === 'out_of_stock') {
      query.stock = 0
    } else if (status === 'in_stock') {
      query.$expr = { $gt: ['$stock', '$lowStockThreshold'] }
    }

    // Get all products (no pagination for export)
    const products = await Product.find(query)
      .select('name sku stock lowStockThreshold reorderLevel maxStock price category lastRestockedAt')
      .populate('category', 'name')
      .sort({ name: 1 })
      .lean()

    if (format === 'csv') {
      // Generate CSV
      const csv = generateCSV(products)
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="inventory-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    } else if (format === 'pdf') {
      // For PDF, return data that frontend will use to generate PDF
      return NextResponse.json({
        success: true,
        data: {
          inventory: products.map((product: any) => {
            const currentStock = product.stock || 0
            const minStock = product.lowStockThreshold || 0
            
            let itemStatus = 'In Stock'
            if (currentStock === 0) {
              itemStatus = 'Out of Stock'
            } else if (currentStock <= minStock) {
              itemStatus = 'Low Stock'
            }

            return {
              productName: product.name,
              sku: product.sku,
              category: product.category?.name || 'Uncategorized',
              currentStock,
              minStock,
              reorderLevel: product.reorderLevel || minStock,
              maxStock: product.maxStock || minStock * 5,
              price: product.price,
              stockValue: currentStock * product.price,
              status: itemStatus,
              lastRestocked: product.lastRestockedAt || product.createdAt
            }
          }),
          generatedAt: new Date().toISOString()
        }
      })
    }

    return NextResponse.json(
      { success: false, message: 'Invalid format. Use csv or pdf.' },
      { status: 400 }
    )

  } catch (error: any) {
    console.error('Error exporting inventory:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to export inventory' },
      { status: 500 }
    )
  }
}

// Helper function to generate CSV
function generateCSV(products: any[]): string {
  const headers = [
    'Product Name',
    'SKU',
    'Category',
    'Current Stock',
    'Min Stock',
    'Reorder Level',
    'Max Stock',
    'Unit Price',
    'Stock Value',
    'Status',
    'Last Restocked'
  ]

  const rows = products.map((product: any) => {
    const currentStock = product.stock || 0
    const minStock = product.lowStockThreshold || 0
    const reorderLevel = product.reorderLevel || minStock
    const maxStock = product.maxStock || minStock * 5
    const price = product.price || 0
    
    let status = 'In Stock'
    if (currentStock === 0) {
      status = 'Out of Stock'
    } else if (currentStock <= minStock) {
      status = 'Low Stock'
    }

    const stockValue = currentStock * price
    const lastRestocked = product.lastRestockedAt 
      ? new Date(product.lastRestockedAt).toLocaleDateString()
      : 'N/A'

    return [
      `"${product.name || 'N/A'}"`,
      product.sku || 'N/A',
      `"${product.category?.name || 'Uncategorized'}"`,
      currentStock,
      minStock,
      reorderLevel,
      maxStock,
      price.toFixed(2),
      stockValue.toFixed(2),
      status,
      lastRestocked
    ].join(',')
  })

  return [headers.join(','), ...rows].join('\n')
}

