'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  ClipboardList,
  Bell,
  ShoppingBagIcon,
  PackageX
} from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'admin') {
      router.push('/auth/signin')
    } else {
      setLoading(false)
    }
  }, [session, status, router])

  // Mock data - replace with actual API calls
  const stats = {
    revenue: {
      total: 45678.90,
      change: 12.5,
      trend: 'up'
    },
    orders: {
      total: 89,
      change: 8.2,
      trend: 'up',
      pending: 8,
      processing: 15,
      completed: 66
    },
    customers: {
      total: 1247,
      change: 15.3,
      trend: 'up',
      new: 45
    },
    products: {
      total: 156,
      change: -2.4,
      trend: 'down',
      outOfStock: 12
    }
  }

  const recentOrders = [
    {
      id: 'ORD-001',
      customer: 'John Doe',
      amount: 89.99,
      status: 'completed',
      date: '2 min ago'
    },
    {
      id: 'ORD-002',
      customer: 'Jane Smith',
      amount: 45.50,
      status: 'processing',
      date: '15 min ago'
    },
    {
      id: 'ORD-003',
      customer: 'Bob Johnson',
      amount: 123.75,
      status: 'pending',
      date: '1 hour ago'
    },
    {
      id: 'ORD-004',
      customer: 'Alice Williams',
      amount: 67.20,
      status: 'completed',
      date: '2 hours ago'
    },
    {
      id: 'ORD-005',
      customer: 'Charlie Brown',
      amount: 199.99,
      status: 'shipped',
      date: '3 hours ago'
    }
  ]

  const tasks = [
    { id: '1', title: 'Review pending orders', priority: 'high', dueDate: 'Today', completed: false },
    { id: '2', title: 'Update product inventory', priority: 'medium', dueDate: 'Tomorrow', completed: false },
    { id: '3', title: 'Respond to customer tickets', priority: 'high', dueDate: 'Today', completed: false },
    { id: '4', title: 'Process refund requests', priority: 'medium', dueDate: 'This week', completed: true }
  ]

  const alerts = [
    { type: 'warning', message: '12 products low in stock', link: '/admin/inventory' },
    { type: 'info', message: '8 pending return requests', link: '/admin/orders/refunds' },
    { type: 'success', message: '3 new product reviews', link: '/admin/reviews' }
  ]

  const abandonedCarts = {
    total: 34,
    value: 2845.50,
    recoverable: 18
  }

  const topProducts = [
    { name: 'Organic Fresh Milk', sales: 145, revenue: 724.55, trend: 'up' },
    { name: 'Free Range Eggs', sales: 128, revenue: 511.62, trend: 'up' },
    { name: 'Grass-Fed Beef', sales: 95, revenue: 1424.75, trend: 'down' },
    { name: 'Organic Vegetables Pack', sales: 87, revenue: 434.13, trend: 'up' },
    { name: 'Fresh Fruits Basket', sales: 76, revenue: 379.24, trend: 'up' }
  ]

  const lowStockProducts = [
    { name: 'Organic Honey', stock: 5, minStock: 20 },
    { name: 'Coconut Oil', stock: 8, minStock: 25 },
    { name: 'Green Tea', stock: 12, minStock: 30 },
    { name: 'Almond Butter', stock: 7, minStock: 15 }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'processing':
        return 'bg-blue-100 text-blue-700'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'shipped':
        return 'bg-purple-100 text-purple-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!session || session.user.role !== 'admin') {
    return null
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">Welcome back, {session.user.name}!</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Revenue Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <span className={`flex items-center text-sm font-semibold ${
                stats.revenue.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stats.revenue.trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                {stats.revenue.change}%
              </span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Revenue</h3>
            <p className="text-3xl font-bold text-gray-900">${stats.revenue.total.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-2">+${(stats.revenue.total * 0.125).toFixed(2)} from last month</p>
          </div>

          {/* Orders Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <span className={`flex items-center text-sm font-semibold ${
                stats.orders.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stats.orders.trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                {stats.orders.change}%
              </span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Orders</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.orders.total}</p>
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-xs text-yellow-600 font-medium">{stats.orders.pending} Pending</span>
              <span className="text-xs text-blue-600 font-medium">{stats.orders.processing} Processing</span>
            </div>
          </div>

          {/* Customers Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <span className={`flex items-center text-sm font-semibold ${
                stats.customers.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stats.customers.trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                {stats.customers.change}%
              </span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Customers</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.customers.total.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-2">+{stats.customers.new} new this week</p>
          </div>

          {/* Products Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
              <span className={`flex items-center text-sm font-semibold ${
                stats.products.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stats.products.trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                {Math.abs(stats.products.change)}%
              </span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Products</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.products.total}</p>
            <p className="text-xs text-red-600 mt-2 font-medium">{stats.products.outOfStock} out of stock</p>
          </div>
        </div>

        {/* Charts and Recent Activity Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                <p className="text-sm text-gray-500 mt-1">Latest customer orders</p>
              </div>
              <Link
                href="/admin/orders"
                className="text-sm font-medium text-green-600 hover:text-green-700"
              >
                View All →
              </Link>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Order ID</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Customer</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Amount</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <span className="font-medium text-gray-900">{order.id}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-700">{order.customer}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-semibold text-gray-900">${order.amount.toFixed(2)}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-500 flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {order.date}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h2 className="text-lg font-semibold text-gray-900">Low Stock Alert</h2>
              </div>
              <p className="text-sm text-gray-500 mt-1">{lowStockProducts.length} products need attention</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {lowStockProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between pb-4 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>Stock: {product.stock}</span>
                          <span>Min: {product.minStock}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: `${(product.stock / product.minStock) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/admin/inventory/alerts"
                className="mt-4 block text-center text-sm font-medium text-green-600 hover:text-green-700"
              >
                View All Alerts →
              </Link>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Top Selling Products</h2>
              <p className="text-sm text-gray-500 mt-1">Best performing products this month</p>
            </div>
            <Link
              href="/admin/reports/products"
              className="text-sm font-medium text-green-600 hover:text-green-700"
            >
              View Report →
            </Link>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {topProducts.map((product, index) => (
                <div key={index} className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                    <span className={`${product.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {product.trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm">{product.name}</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Sales:</span>
                      <span className="font-semibold text-gray-900">{product.sales}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Revenue:</span>
                      <span className="font-semibold text-green-600">${product.revenue.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Widgets Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Task Manager Widget */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <ClipboardList className="w-5 h-5 mr-2 text-blue-600" />
                My Tasks
              </h3>
              <span className="text-xs text-gray-500">{tasks.filter(t => !t.completed).length} pending</span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {tasks.map(task => (
                <div key={task.id} className={`p-3 rounded-lg border ${
                  task.completed ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      readOnly
                    />
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          task.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {task.priority}
                        </span>
                        <span className="text-xs text-gray-500">{task.dueDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full py-2 text-sm text-primary-600 hover:text-primary-700 font-medium">
              View All Tasks →
            </button>
          </div>

          {/* Alerts Widget */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Bell className="w-5 h-5 mr-2 text-orange-600" />
                Alerts & Notifications
              </h3>
            </div>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <Link
                  key={index}
                  href={alert.link}
                  className={`block p-3 rounded-lg border transition-colors ${
                    alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100' :
                    alert.type === 'info' ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' :
                    'bg-green-50 border-green-200 hover:bg-green-100'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {alert.type === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />}
                    {alert.type === 'info' && <PackageX className="w-5 h-5 text-blue-600 mt-0.5" />}
                    {alert.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />}
                    <p className="text-sm text-gray-900 flex-1">{alert.message}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Abandoned Carts Widget */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2 text-purple-600" />
                Abandoned Carts
              </h3>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-gray-600 mb-1">Total Carts</p>
                <p className="text-3xl font-bold text-purple-600">{abandonedCarts.total}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600 mb-1">Potential Revenue</p>
                <p className="text-2xl font-bold text-green-600">${abandonedCarts.value.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600 mb-1">Recoverable</p>
                <p className="text-2xl font-bold text-blue-600">{abandonedCarts.recoverable}</p>
                <p className="text-xs text-gray-500 mt-1">With email contact</p>
              </div>
            </div>
            <Link
              href="/admin/abandoned-carts"
              className="mt-4 block w-full py-2 text-center text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Recover Carts →
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/admin/products/new" className="group bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg hover:shadow-xl transition-all p-6 text-white">
            <Package className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-semibold mb-1">Add New Product</h3>
            <p className="text-sm text-green-100">Create a new product listing</p>
          </Link>

          <Link href="/admin/orders?status=pending" className="group bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg hover:shadow-xl transition-all p-6 text-white">
            <ShoppingCart className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-semibold mb-1">Process Orders</h3>
            <p className="text-sm text-blue-100">{stats.orders.pending} pending orders</p>
          </Link>

          <Link href="/admin/marketing/campaigns" className="group bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg hover:shadow-xl transition-all p-6 text-white">
            <TrendingUp className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-semibold mb-1">Marketing Campaign</h3>
            <p className="text-sm text-purple-100">Create new campaign</p>
          </Link>

          <Link href="/admin/reports/sales" className="group bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg hover:shadow-xl transition-all p-6 text-white">
            <DollarSign className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-semibold mb-1">Sales Report</h3>
            <p className="text-sm text-orange-100">View detailed analytics</p>
          </Link>
        </div>
      </div>
    </AdminLayout>
  )
}