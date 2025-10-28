'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import AdminLayout from '@/components/admin/AdminLayout'
import { DataTable } from '@/components/admin/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Download,
  Calendar,
  Filter,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { LineChart as RechartsLine, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface SalesData {
  date: string
  orders: number
  revenue: number
  customers: number
  avgOrderValue: number
}

interface TopProduct {
  name: string
  category: string
  unitsSold: number
  revenue: number
  image: string
}

interface CategoryPerformance {
  name: string
  revenue: number
  orders: number
  percentage: number
}

export default function SalesReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('7d')
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [chartType, setChartType] = useState<'line' | 'bar'>('line')

  // Mock data
  const [salesData, setSalesData] = useState<SalesData[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [categoryData, setCategoryData] = useState<CategoryPerformance[]>([])
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    totalCustomers: 0,
    revenueGrowth: 0,
    orderGrowth: 0
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'admin') {
      router.push('/auth/signin')
    } else {
      fetchReports()
    }
  }, [session, status, router, dateRange])

  const fetchReports = () => {
    setLoading(true)
    
    // Generate mock sales data
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365
    const mockSalesData: SalesData[] = []
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i)
      mockSalesData.push({
        date: format(date, 'MMM dd'),
        orders: Math.floor(Math.random() * 50) + 20,
        revenue: Math.floor(Math.random() * 5000) + 2000,
        customers: Math.floor(Math.random() * 40) + 15,
        avgOrderValue: 0
      })
    }
    
    mockSalesData.forEach(data => {
      data.avgOrderValue = data.revenue / data.orders
    })

    setSalesData(mockSalesData)

    // Mock top products
    setTopProducts([
      {
        name: 'Organic Fresh Milk',
        category: 'Dairy',
        unitsSold: 1234,
        revenue: 6170.00,
        image: '/images/products/product-1.jpg'
      },
      {
        name: 'Free Range Eggs',
        category: 'Dairy',
        unitsSold: 987,
        revenue: 3939.00,
        image: '/images/products/product-2.jpg'
      },
      {
        name: 'Organic Vegetables Pack',
        category: 'Vegetables',
        unitsSold: 856,
        revenue: 17112.00,
        image: '/images/products/product-3.jpg'
      },
      {
        name: 'Premium Coffee Beans',
        category: 'Beverages',
        unitsSold: 734,
        revenue: 18334.00,
        image: '/images/products/product-4.jpg'
      },
      {
        name: 'Whole Wheat Bread',
        category: 'Bakery',
        unitsSold: 623,
        revenue: 3115.00,
        image: '/images/products/product-5.jpg'
      }
    ])

    // Mock category performance
    setCategoryData([
      { name: 'Dairy', revenue: 45000, orders: 1234, percentage: 25 },
      { name: 'Vegetables', revenue: 38000, orders: 987, percentage: 21 },
      { name: 'Beverages', revenue: 32000, orders: 856, percentage: 18 },
      { name: 'Bakery', revenue: 28000, orders: 734, percentage: 16 },
      { name: 'Snacks', revenue: 22000, orders: 623, percentage: 12 },
      { name: 'Others', revenue: 15000, orders: 456, percentage: 8 }
    ])

    // Calculate stats
    const totalRevenue = mockSalesData.reduce((sum, data) => sum + data.revenue, 0)
    const totalOrders = mockSalesData.reduce((sum, data) => sum + data.orders, 0)
    const totalCustomers = mockSalesData.reduce((sum, data) => sum + data.customers, 0)

    setStats({
      totalRevenue,
      totalOrders,
      avgOrderValue: totalRevenue / totalOrders,
      totalCustomers,
      revenueGrowth: 12.5,
      orderGrowth: 8.3
    })

    setLoading(false)
  }

  const handleDateRangeChange = (range: string) => {
    setDateRange(range)
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365
    setStartDate(format(subDays(new Date(), days), 'yyyy-MM-dd'))
    setEndDate(format(new Date(), 'yyyy-MM-dd'))
  }

  const exportReport = (format: 'csv' | 'pdf' | 'excel') => {
    console.log(`Exporting report as ${format}`)
    // In production, implement actual export logic
  }

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280']

  const columns: ColumnDef<SalesData>[] = [
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => (
        <span className="font-medium text-gray-900">{row.original.date}</span>
      ),
    },
    {
      accessorKey: 'orders',
      header: 'Orders',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-gray-900">{row.original.orders}</span>
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
      accessorKey: 'customers',
      header: 'Customers',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-600" />
          <span className="font-semibold text-gray-900">{row.original.customers}</span>
        </div>
      ),
    },
    {
      accessorKey: 'avgOrderValue',
      header: 'Avg Order Value',
      cell: ({ row }) => (
        <span className="font-semibold text-gray-900">${row.original.avgOrderValue.toFixed(2)}</span>
      ),
    },
  ]

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
            <h1 className="text-2xl font-bold text-gray-900">Sales Reports</h1>
            <p className="text-gray-600 mt-1">Comprehensive sales analytics and insights</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => exportReport('csv')}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-5 h-5" />
              CSV
            </button>
            <button
              onClick={() => exportReport('excel')}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-5 h-5" />
              Excel
            </button>
            <button
              onClick={() => exportReport('pdf')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              PDF
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Date Range:</span>
            </div>
            
            <div className="flex gap-2">
              {['7d', '30d', '90d', '365d'].map((range) => (
                <button
                  key={range}
                  onClick={() => handleDateRangeChange(range)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    dateRange === range
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : range === '90d' ? 'Last 90 Days' : 'Last Year'}
                </button>
              ))}
            </div>

            <div className="flex-1" />

            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <span className="flex items-center text-gray-500">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-semibold ${stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.revenueGrowth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(stats.revenueGrowth)}%
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Revenue</h3>
            <p className="text-3xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-semibold ${stats.orderGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.orderGrowth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(stats.orderGrowth)}%
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Orders</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.totalOrders.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Customers</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.totalCustomers.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Avg Order Value</h3>
            <p className="text-3xl font-bold text-gray-900">${stats.avgOrderValue.toFixed(2)}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Revenue Trend</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setChartType('line')}
                  className={`p-2 rounded-lg transition-colors ${chartType === 'line' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}
                >
                  <LineChart className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`p-2 rounded-lg transition-colors ${chartType === 'bar' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}
                >
                  <BarChart3 className="w-5 h-5" />
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              {chartType === 'line' ? (
                <RechartsLine data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue ($)" />
                </RechartsLine>
              ) : (
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#10b981" name="Revenue ($)" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Category Performance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Sales by Category</h2>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPie>
                <Pie
                  data={categoryData as any}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Top Selling Products</h2>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-600 text-white rounded-lg flex items-center justify-center font-bold">
                    #{index + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{product.name}</h4>
                    <p className="text-sm text-gray-500">{product.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Units Sold</p>
                    <p className="font-semibold text-gray-900">{product.unitsSold.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Revenue</p>
                    <p className="font-semibold text-green-600">${product.revenue.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Sales Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Daily Sales Breakdown</h2>
          <DataTable
            columns={columns}
            data={salesData}
            searchPlaceholder="Search by date..."
          />
        </div>
      </div>
    </AdminLayout>
  )
}