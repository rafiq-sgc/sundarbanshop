'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import AdminLayout from '@/components/admin/AdminLayout'
import { DataTable } from '@/components/admin/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import {
  Package,
  TrendingUp,
  TrendingDown,
  Eye,
  ShoppingCart,
  DollarSign,
  Star,
  BarChart3,
  Download
} from 'lucide-react'
import Image from 'next/image'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'

interface ProductPerformance {
  _id: string
  name: string
  image: string
  category: string
  sku: string
  views: number
  orders: number
  revenue: number
  stock: number
  rating: number
  conversionRate: number
  trend: 'up' | 'down'
  trendValue: number
}

export default function ProductReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<ProductPerformance[]>([])
  const [sortBy, setSortBy] = useState('revenue')
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'admin') {
      router.push('/auth/signin')
    } else {
      fetchReports()
    }
  }, [session, status, router])

  const fetchReports = () => {
    setLoading(true)

    // Mock product performance data
    const mockProducts: ProductPerformance[] = [
      {
        _id: '1',
        name: 'Organic Fresh Milk',
        image: '/images/products/product-1.jpg',
        category: 'Dairy',
        sku: 'MIL-001',
        views: 2345,
        orders: 1234,
        revenue: 6170.00,
        stock: 150,
        rating: 4.8,
        conversionRate: 52.6,
        trend: 'up',
        trendValue: 12.5
      },
      {
        _id: '2',
        name: 'Premium Coffee Beans',
        image: '/images/products/product-4.jpg',
        category: 'Beverages',
        sku: 'COF-004',
        views: 1987,
        orders: 734,
        revenue: 18334.00,
        stock: 89,
        rating: 4.9,
        conversionRate: 36.9,
        trend: 'up',
        trendValue: 8.3
      },
      {
        _id: '3',
        name: 'Organic Vegetables Pack',
        image: '/images/products/product-3.jpg',
        category: 'Vegetables',
        sku: 'VEG-003',
        views: 1756,
        orders: 856,
        revenue: 17112.00,
        stock: 45,
        rating: 4.7,
        conversionRate: 48.7,
        trend: 'up',
        trendValue: 15.2
      },
      {
        _id: '4',
        name: 'Free Range Eggs',
        image: '/images/products/product-2.jpg',
        category: 'Dairy',
        sku: 'EGG-002',
        views: 1654,
        orders: 987,
        revenue: 3939.00,
        stock: 234,
        rating: 4.6,
        conversionRate: 59.7,
        trend: 'down',
        trendValue: 3.2
      },
      {
        _id: '5',
        name: 'Whole Wheat Bread',
        image: '/images/products/product-5.jpg',
        category: 'Bakery',
        sku: 'BRD-005',
        views: 1432,
        orders: 623,
        revenue: 3115.00,
        stock: 78,
        rating: 4.5,
        conversionRate: 43.5,
        trend: 'up',
        trendValue: 6.8
      }
    ]

    setProducts(mockProducts)
    setLoading(false)
  }

  const columns: ColumnDef<ProductPerformance>[] = [
    {
      accessorKey: 'name',
      header: 'Product',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Image
            src={row.original.image}
            alt={row.original.name}
            width={48}
            height={48}
            className="rounded-lg object-cover"
          />
          <div>
            <p className="font-medium text-gray-900">{row.original.name}</p>
            <p className="text-sm text-gray-500">{row.original.sku}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
          {row.original.category}
        </span>
      ),
    },
    {
      accessorKey: 'views',
      header: 'Views',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-gray-900">{row.original.views.toLocaleString()}</span>
        </div>
      ),
    },
    {
      accessorKey: 'orders',
      header: 'Orders',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-green-600" />
          <span className="font-semibold text-gray-900">{row.original.orders.toLocaleString()}</span>
        </div>
      ),
    },
    {
      accessorKey: 'revenue',
      header: 'Revenue',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-600" />
          <span className="font-semibold text-gray-900">${row.original.revenue.toFixed(2)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'conversionRate',
      header: 'Conversion',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-gray-900">{row.original.conversionRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${row.original.conversionRate}%` }}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'rating',
      header: 'Rating',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-400 fill-current" />
          <span className="font-semibold text-gray-900">{row.original.rating}</span>
        </div>
      ),
    },
    {
      accessorKey: 'trend',
      header: 'Trend',
      cell: ({ row }) => (
        <div className={`flex items-center gap-1 ${row.original.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {row.original.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span className="font-semibold">{row.original.trendValue}%</span>
        </div>
      ),
    },
  ]

  const totalViews = products.reduce((sum, p) => sum + p.views, 0)
  const totalOrders = products.reduce((sum, p) => sum + p.orders, 0)
  const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0)
  const avgConversion = products.reduce((sum, p) => sum + p.conversionRate, 0) / products.length

  // Data for charts
  const topProductsChart = products.slice(0, 5).map(p => ({
    name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
    revenue: p.revenue,
    orders: p.orders
  }))

  if (loading || status === 'loading') {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Product Performance Report</h1>
            <p className="text-gray-600 mt-1">Track and analyze product performance metrics</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="w-5 h-5" />
              Export
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="revenue">Revenue</option>
                <option value="orders">Orders</option>
                <option value="views">Views</option>
                <option value="conversion">Conversion Rate</option>
                <option value="rating">Rating</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="dairy">Dairy</option>
                <option value="vegetables">Vegetables</option>
                <option value="beverages">Beverages</option>
                <option value="bakery">Bakery</option>
                <option value="snacks">Snacks</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="p-3 bg-blue-100 rounded-lg w-fit mb-3">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Views</h3>
            <p className="text-3xl font-bold text-gray-900">{totalViews.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="p-3 bg-green-100 rounded-lg w-fit mb-3">
              <ShoppingCart className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Orders</h3>
            <p className="text-3xl font-bold text-gray-900">{totalOrders.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="p-3 bg-purple-100 rounded-lg w-fit mb-3">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Revenue</h3>
            <p className="text-3xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="p-3 bg-orange-100 rounded-lg w-fit mb-3">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Avg Conversion</h3>
            <p className="text-3xl font-bold text-gray-900">{avgConversion.toFixed(1)}%</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products by Revenue */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Top Products by Revenue</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProductsChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#10b981" name="Revenue ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Orders Comparison */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Orders Comparison</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={topProductsChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">All Products Performance</h2>
          <DataTable
            columns={columns}
            data={products}
            searchPlaceholder="Search products by name or SKU..."
          />
        </div>

        {/* Product Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-2">🏆 Best Performer</h3>
            <p className="text-sm text-green-700 mb-3">Highest conversion rate</p>
            <div className="bg-white rounded-lg p-4">
              <p className="font-semibold text-gray-900">{products[0]?.name}</p>
              <p className="text-sm text-gray-600">Conversion: {products[0]?.conversionRate}%</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">👁️ Most Viewed</h3>
            <p className="text-sm text-blue-700 mb-3">Highest product views</p>
            <div className="bg-white rounded-lg p-4">
              <p className="font-semibold text-gray-900">{products[0]?.name}</p>
              <p className="text-sm text-gray-600">Views: {products[0]?.views.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 p-6">
            <h3 className="text-lg font-semibold text-purple-900 mb-2">⭐ Highest Rated</h3>
            <p className="text-sm text-purple-700 mb-3">Best customer rating</p>
            <div className="bg-white rounded-lg p-4">
              <p className="font-semibold text-gray-900">{products[1]?.name}</p>
              <p className="text-sm text-gray-600">Rating: {products[1]?.rating}/5.0</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
