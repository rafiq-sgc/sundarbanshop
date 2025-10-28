'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import AdminLayout from '@/components/admin/AdminLayout'
import { DataTable } from '@/components/admin/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import {
  Package,
  AlertTriangle,
  TrendingDown,
  DollarSign,
  Download,
  BarChart3,
  Box
} from 'lucide-react'
import Image from 'next/image'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface InventoryItem {
  _id: string
  name: string
  image: string
  sku: string
  category: string
  currentStock: number
  minStock: number
  maxStock: number
  unitCost: number
  totalValue: number
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock'
  lastRestocked: string
  turnoverRate: number
}

export default function InventoryReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [inventory, setInventory] = useState<InventoryItem[]>([])

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

    // Mock inventory data
    const mockInventory: InventoryItem[] = [
      {
        _id: '1',
        name: 'Organic Fresh Milk',
        image: '/images/products/product-1.jpg',
        sku: 'MIL-001',
        category: 'Dairy',
        currentStock: 150,
        minStock: 50,
        maxStock: 300,
        unitCost: 4.00,
        totalValue: 600.00,
        status: 'in_stock',
        lastRestocked: '2025-09-25',
        turnoverRate: 8.5
      },
      {
        _id: '2',
        name: 'Premium Coffee Beans',
        image: '/images/products/product-4.jpg',
        sku: 'COF-004',
        category: 'Beverages',
        currentStock: 25,
        minStock: 30,
        maxStock: 200,
        unitCost: 20.00,
        totalValue: 500.00,
        status: 'low_stock',
        lastRestocked: '2025-09-20',
        turnoverRate: 12.3
      },
      {
        _id: '3',
        name: 'Organic Vegetables Pack',
        image: '/images/products/product-3.jpg',
        sku: 'VEG-003',
        category: 'Vegetables',
        currentStock: 0,
        minStock: 20,
        maxStock: 150,
        unitCost: 15.00,
        totalValue: 0.00,
        status: 'out_of_stock',
        lastRestocked: '2025-09-15',
        turnoverRate: 15.7
      },
      {
        _id: '4',
        name: 'Whole Wheat Bread',
        image: '/images/products/product-5.jpg',
        sku: 'BRD-005',
        category: 'Bakery',
        currentStock: 350,
        minStock: 50,
        maxStock: 200,
        unitCost: 3.50,
        totalValue: 1225.00,
        status: 'overstock',
        lastRestocked: '2025-09-28',
        turnoverRate: 6.2
      }
    ]

    setInventory(mockInventory)
    setLoading(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-green-100 text-green-700'
      case 'low_stock':
        return 'bg-yellow-100 text-yellow-700'
      case 'out_of_stock':
        return 'bg-red-100 text-red-700'
      case 'overstock':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStockPercentage = (item: InventoryItem) => {
    return (item.currentStock / item.maxStock) * 100
  }

  const columns: ColumnDef<InventoryItem>[] = [
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
      accessorKey: 'currentStock',
      header: 'Current Stock',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-gray-900">{row.original.currentStock} units</p>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
            <div
              className={`h-1.5 rounded-full ${
                row.original.status === 'out_of_stock'
                  ? 'bg-red-600'
                  : row.original.status === 'low_stock'
                  ? 'bg-yellow-600'
                  : row.original.status === 'overstock'
                  ? 'bg-blue-600'
                  : 'bg-green-600'
              }`}
              style={{ width: `${Math.min(getStockPercentage(row.original), 100)}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      id: 'stockRange',
      header: 'Min / Max',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {row.original.minStock} / {row.original.maxStock}
        </span>
      ),
    },
    {
      accessorKey: 'totalValue',
      header: 'Stock Value',
      cell: ({ row }) => (
        <span className="font-semibold text-green-600">${row.original.totalValue.toFixed(2)}</span>
      ),
    },
    {
      accessorKey: 'turnoverRate',
      header: 'Turnover',
      cell: ({ row }) => (
        <span className="font-semibold text-gray-900">{row.original.turnoverRate}x/mo</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(row.original.status)}`}>
          {row.original.status.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
        </span>
      ),
    },
  ]

  const totalItems = inventory.length
  const totalValue = inventory.reduce((sum, item) => sum + item.totalValue, 0)
  const lowStockItems = inventory.filter(item => item.status === 'low_stock' || item.status === 'out_of_stock').length
  const overstockItems = inventory.filter(item => item.status === 'overstock').length

  // Stock status distribution
  const statusData = [
    { name: 'In Stock', value: inventory.filter(i => i.status === 'in_stock').length, color: '#10b981' },
    { name: 'Low Stock', value: inventory.filter(i => i.status === 'low_stock').length, color: '#f59e0b' },
    { name: 'Out of Stock', value: inventory.filter(i => i.status === 'out_of_stock').length, color: '#ef4444' },
    { name: 'Overstock', value: inventory.filter(i => i.status === 'overstock').length, color: '#3b82f6' }
  ]

  // Stock value by category
  const categoryData = inventory.reduce((acc, item) => {
    const existing = acc.find(c => c.category === item.category)
    if (existing) {
      existing.value += item.totalValue
    } else {
      acc.push({ category: item.category, value: item.totalValue })
    }
    return acc
  }, [] as Array<{ category: string; value: number }>)

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
            <h1 className="text-2xl font-bold text-gray-900">Inventory Report</h1>
            <p className="text-gray-600 mt-1">Monitor stock levels and inventory health</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-5 h-5" />
            Export
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="p-3 bg-blue-100 rounded-lg w-fit mb-3">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Items</h3>
            <p className="text-3xl font-bold text-gray-900">{totalItems}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="p-3 bg-green-100 rounded-lg w-fit mb-3">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Stock Value</h3>
            <p className="text-3xl font-bold text-gray-900">${totalValue.toFixed(2)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="p-3 bg-yellow-100 rounded-lg w-fit mb-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Low/Out of Stock</h3>
            <p className="text-3xl font-bold text-gray-900">{lowStockItems}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="p-3 bg-purple-100 rounded-lg w-fit mb-3">
              <Box className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Overstock Items</h3>
            <p className="text-3xl font-bold text-gray-900">{overstockItems}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stock Status Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Stock Status Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Stock Value by Category */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Stock Value by Category</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#10b981" name="Value ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Critical Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Low Stock Alerts */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              <h3 className="text-lg font-semibold text-yellow-900">Low Stock Alerts</h3>
            </div>
            <div className="space-y-3">
              {inventory.filter(i => i.status === 'low_stock' || i.status === 'out_of_stock').map(item => (
                <div key={item._id} className="bg-white rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={40}
                      height={40}
                      className="rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.currentStock} units left</p>
                    </div>
                  </div>
                  <button className="px-3 py-1 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium">
                    Reorder
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Overstock Items */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-900">Overstock Items</h3>
            </div>
            <div className="space-y-3">
              {inventory.filter(i => i.status === 'overstock').map(item => (
                <div key={item._id} className="bg-white rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={40}
                      height={40}
                      className="rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.currentStock} units (Max: {item.maxStock})</p>
                    </div>
                  </div>
                  <button className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                    Promote
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">All Inventory Items</h2>
          <DataTable
            columns={columns}
            data={inventory}
            searchPlaceholder="Search inventory by name or SKU..."
          />
        </div>
      </div>
    </AdminLayout>
  )
}
