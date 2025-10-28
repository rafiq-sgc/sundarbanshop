'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import AdminLayout from '@/components/admin/AdminLayout'
import { DataTable } from '@/components/admin/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import {
  Users,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Heart,
  UserPlus,
  Download,
  Award
} from 'lucide-react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface CustomerSegment {
  _id: string
  name: string
  email: string
  totalOrders: number
  totalSpent: number
  avgOrderValue: number
  lastOrderDate: string
  segment: 'VIP' | 'Loyal' | 'Regular' | 'New'
  lifetimeValue: number
}

export default function CustomerReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<CustomerSegment[]>([])

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

    // Mock customer data
    const mockCustomers: CustomerSegment[] = [
      {
        _id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        totalOrders: 45,
        totalSpent: 5650.00,
        avgOrderValue: 125.56,
        lastOrderDate: '2025-09-28',
        segment: 'VIP',
        lifetimeValue: 6500.00
      },
      {
        _id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        totalOrders: 32,
        totalSpent: 3840.00,
        avgOrderValue: 120.00,
        lastOrderDate: '2025-09-25',
        segment: 'Loyal',
        lifetimeValue: 4200.00
      },
      {
        _id: '3',
        name: 'Bob Johnson',
        email: 'bob@example.com',
        totalOrders: 18,
        totalSpent: 2160.00,
        avgOrderValue: 120.00,
        lastOrderDate: '2025-09-20',
        segment: 'Regular',
        lifetimeValue: 2400.00
      },
      {
        _id: '4',
        name: 'Alice Brown',
        email: 'alice@example.com',
        totalOrders: 3,
        totalSpent: 285.00,
        avgOrderValue: 95.00,
        lastOrderDate: '2025-09-15',
        segment: 'New',
        lifetimeValue: 300.00
      }
    ]

    setCustomers(mockCustomers)
    setLoading(false)
  }

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'VIP':
        return 'bg-purple-100 text-purple-700'
      case 'Loyal':
        return 'bg-blue-100 text-blue-700'
      case 'Regular':
        return 'bg-green-100 text-green-700'
      case 'New':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const columns: ColumnDef<CustomerSegment>[] = [
    {
      accessorKey: 'name',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-gray-900">{row.original.name}</p>
          <p className="text-sm text-gray-500">{row.original.email}</p>
        </div>
      ),
    },
    {
      accessorKey: 'segment',
      header: 'Segment',
      cell: ({ row }) => (
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getSegmentColor(row.original.segment)}`}>
          {row.original.segment}
        </span>
      ),
    },
    {
      accessorKey: 'totalOrders',
      header: 'Orders',
      cell: ({ row }) => (
        <span className="font-semibold text-gray-900">{row.original.totalOrders}</span>
      ),
    },
    {
      accessorKey: 'totalSpent',
      header: 'Total Spent',
      cell: ({ row }) => (
        <span className="font-semibold text-green-600">${row.original.totalSpent.toFixed(2)}</span>
      ),
    },
    {
      accessorKey: 'avgOrderValue',
      header: 'Avg Order Value',
      cell: ({ row }) => (
        <span className="font-semibold text-gray-900">${row.original.avgOrderValue.toFixed(2)}</span>
      ),
    },
    {
      accessorKey: 'lifetimeValue',
      header: 'Lifetime Value',
      cell: ({ row }) => (
        <span className="font-semibold text-purple-600">${row.original.lifetimeValue.toFixed(2)}</span>
      ),
    },
  ]

  const totalCustomers = customers.length
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0)
  const avgLifetimeValue = customers.reduce((sum, c) => sum + c.lifetimeValue, 0) / customers.length
  const vipCustomers = customers.filter(c => c.segment === 'VIP').length

  // Segment distribution
  const segmentData = [
    { name: 'VIP', value: customers.filter(c => c.segment === 'VIP').length, color: '#8b5cf6' },
    { name: 'Loyal', value: customers.filter(c => c.segment === 'Loyal').length, color: '#3b82f6' },
    { name: 'Regular', value: customers.filter(c => c.segment === 'Regular').length, color: '#10b981' },
    { name: 'New', value: customers.filter(c => c.segment === 'New').length, color: '#6b7280' }
  ]

  // Customer acquisition trend (mock data)
  const acquisitionData = [
    { month: 'Jan', customers: 45 },
    { month: 'Feb', customers: 52 },
    { month: 'Mar', customers: 61 },
    { month: 'Apr', customers: 58 },
    { month: 'May', customers: 70 },
    { month: 'Jun', customers: 75 },
    { month: 'Jul', customers: 82 },
    { month: 'Aug', customers: 88 },
    { month: 'Sep', customers: 95 }
  ]

  // Top spenders
  const topSpenders = [...customers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5)

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
            <h1 className="text-2xl font-bold text-gray-900">Customer Analytics Report</h1>
            <p className="text-gray-600 mt-1">Analyze customer behavior and segments</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-5 h-5" />
            Export
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
                <TrendingUp className="w-4 h-4" />
                12.5%
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Customers</h3>
            <p className="text-3xl font-bold text-gray-900">{totalCustomers}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="p-3 bg-green-100 rounded-lg w-fit mb-3">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Revenue</h3>
            <p className="text-3xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="p-3 bg-purple-100 rounded-lg w-fit mb-3">
              <Heart className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Avg Lifetime Value</h3>
            <p className="text-3xl font-bold text-gray-900">${avgLifetimeValue.toFixed(2)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="p-3 bg-orange-100 rounded-lg w-fit mb-3">
              <Award className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">VIP Customers</h3>
            <p className="text-3xl font-bold text-gray-900">{vipCustomers}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Acquisition Trend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Customer Acquisition Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={acquisitionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="customers" stroke="#10b981" strokeWidth={2} name="New Customers" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Customer Segments */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Customer Segments</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={segmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {segmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Spenders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Top 5 Spenders</h2>
          <div className="space-y-4">
            {topSpenders.map((customer, index) => (
              <div key={customer._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-gray-600'
                  }`}>
                    #{index + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{customer.name}</h4>
                    <p className="text-sm text-gray-500">{customer.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Orders</p>
                    <p className="font-semibold text-gray-900">{customer.totalOrders}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total Spent</p>
                    <p className="font-semibold text-green-600">${customer.totalSpent.toFixed(2)}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getSegmentColor(customer.segment)}`}>
                    {customer.segment}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* All Customers Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">All Customers</h2>
          <DataTable
            columns={columns}
            data={customers}
            searchPlaceholder="Search customers by name or email..."
          />
        </div>

        {/* Customer Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 p-6">
            <h3 className="text-lg font-semibold text-purple-900 mb-2">🎯 Retention Rate</h3>
            <p className="text-4xl font-bold text-purple-900 mb-2">87.5%</p>
            <p className="text-sm text-purple-700">Customers who made repeat purchases</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">📈 Growth Rate</h3>
            <p className="text-4xl font-bold text-blue-900 mb-2">+12.5%</p>
            <p className="text-sm text-blue-700">Customer growth this month</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-2">💰 Revenue per Customer</h3>
            <p className="text-4xl font-bold text-green-900 mb-2">${(totalRevenue / totalCustomers).toFixed(2)}</p>
            <p className="text-sm text-green-700">Average revenue per customer</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
