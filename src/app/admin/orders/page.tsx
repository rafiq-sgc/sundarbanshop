'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import AdminLayout from '@/components/admin/AdminLayout'
import { DataTable } from '@/components/admin/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Eye, 
  Download,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  Truck,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { toast } from 'react-hot-toast'

interface Order {
  _id: string
  orderNumber: string
  user: {
    name: string
    email: string
  }
  items: Array<{
    product: {
      name: string
      images: string[]
    }
    quantity: number
    price: number
  }>
  total: number
  orderStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  createdAt: string
  updatedAt: string
}

export default function OrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    revenue: 0
  })
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [showBulkMenu, setShowBulkMenu] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    paymentStatus: 'all',
    dateFrom: '',
    dateTo: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'admin') {
      router.push('/auth/signin')
    } else {
      fetchOrders()
      fetchStats()
    }
  }, [session, status, router])

  useEffect(() => {
    fetchOrders()
  }, [filters])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams()
      if (filters.search) queryParams.append('search', filters.search)
      if (filters.status !== 'all') queryParams.append('status', filters.status)
      if (filters.paymentStatus !== 'all') queryParams.append('paymentStatus', filters.paymentStatus)
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo)

      const response = await fetch(`/api/admin/orders?${queryParams.toString()}`)
      const data = await response.json()

      if (data.success) {
        setOrders(data.data)
      } else {
        toast.error(data.message || 'Failed to fetch orders')
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/orders/stats')
      const data = await response.json()

      if (data.success) {
        const { totalOrders, totalRevenue, statusStats } = data.data
        setStats({
          total: totalOrders,
          pending: statusStats.pending,
          processing: statusStats.processing,
          completed: statusStats.delivered,
          revenue: totalRevenue
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleDelete = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE'
      })
      const data = await response.json()

      if (data.success) {
        toast.success('Order deleted successfully')
        fetchOrders()
        fetchStats()
      } else {
        toast.error(data.message || 'Failed to delete order')
      }
    } catch (error) {
      console.error('Error deleting order:', error)
      toast.error('Failed to delete order')
    }
  }

  const handleBulkAction = async (action: string, value?: string) => {
    if (selectedOrders.length === 0) {
      toast.error('Please select orders first')
      return
    }

    try {
      const response = await fetch('/api/admin/orders/bulk', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderIds: selectedOrders,
          action,
          ...(action === 'updateStatus' && { orderStatus: value }),
          ...(action === 'updatePaymentStatus' && { paymentStatus: value })
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        setSelectedOrders([])
        setShowBulkMenu(false)
        fetchOrders()
        fetchStats()
      } else {
        toast.error(data.message || 'Failed to perform bulk action')
      }
    } catch (error) {
      console.error('Error performing bulk action:', error)
      toast.error('Failed to perform bulk action')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />
      case 'processing':
        return <Package className="w-4 h-4" />
      case 'shipped':
        return <Truck className="w-4 h-4" />
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />
      case 'cancelled':
        return <XCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'confirmed':
        return 'bg-blue-100 text-blue-700'
      case 'processing':
        return 'bg-purple-100 text-purple-700'
      case 'shipped':
        return 'bg-indigo-100 text-indigo-700'
      case 'delivered':
        return 'bg-green-100 text-green-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const columns: ColumnDef<Order>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(checked) => {
            table.toggleAllPageRowsSelected(!!checked)
            if (checked) {
              setSelectedOrders(orders.map(order => order._id))
            } else {
              setSelectedOrders([])
            }
          }}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedOrders.includes(row.original._id)}
          onCheckedChange={(checked) => {
            if (checked) {
              setSelectedOrders([...selectedOrders, row.original._id])
            } else {
              setSelectedOrders(selectedOrders.filter(id => id !== row.original._id))
            }
          }}
        />
      ),
    },
    {
      accessorKey: 'orderNumber',
      header: 'Order #',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-gray-900">{row.original.orderNumber}</p>
          <p className="text-xs text-gray-500">
            {format(new Date(row.original.createdAt), 'MMM dd, yyyy HH:mm')}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'user',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-gray-900">{row.original.user?.name || 'Unknown Customer'}</p>
          <p className="text-sm text-gray-500">{row.original.user?.email || 'No contact info'}</p>
        </div>
      ),
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => (
        <span className="font-semibold text-gray-900">
          ${row.original.total.toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: 'paymentStatus',
      header: 'Payment',
      cell: ({ row }) => {
        const status = row.original.paymentStatus
        return (
          <Badge variant={
            status === 'paid' ? 'default' :
            status === 'failed' ? 'destructive' :
            status === 'refunded' ? 'secondary' :
            'outline'
          }>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'orderStatus',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.orderStatus
        return (
          <Badge 
            variant={
              status === 'delivered' ? 'default' :
              status === 'cancelled' ? 'destructive' :
              'secondary'
            }
            className="inline-flex items-center gap-1"
          >
            {getStatusIcon(status)}
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/admin/orders/${row.original._id}`} className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/admin/orders/${row.original._id}/edit`} className="flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Edit Order
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleDelete(row.original._id)}
              className="text-red-600 focus:text-red-600 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Order
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-600 mt-1">Manage and track customer orders</p>
          </div>
          <div className="flex items-center gap-3">
            {selectedOrders.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm">
                  {selectedOrders.length} selected
                </Badge>
                <DropdownMenu open={showBulkMenu} onOpenChange={setShowBulkMenu}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <MoreHorizontal className="w-4 h-4" />
                      Bulk Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleBulkAction('updateStatus', 'confirmed')}>
                      Mark as Confirmed
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('updateStatus', 'processing')}>
                      Mark as Processing
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('updateStatus', 'shipped')}>
                      Mark as Shipped
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('updateStatus', 'delivered')}>
                      Mark as Delivered
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Payment</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleBulkAction('updatePaymentStatus', 'paid')}>
                      Mark as Paid
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleBulkAction('delete')}
                      className="text-red-600 focus:text-red-600"
                    >
                      Delete Selected
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            <Button asChild>
              <Link href="/admin/orders/new" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Order
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
              <Package className="w-5 h-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
              <Clock className="w-5 h-5 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Processing</CardTitle>
              <Truck className="w-5 h-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.processing}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.completed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Revenue</CardTitle>
              <DollarSign className="w-5 h-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">${stats.revenue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="w-48">
                <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Order Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-48">
                <Select value={filters.paymentStatus} onValueChange={(value) => setFilters({...filters, paymentStatus: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Payment Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payment Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                placeholder="From Date"
                className="w-40"
              />

              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                placeholder="To Date"
                className="w-40"
              />

              <Button 
                variant="outline"
                onClick={() => setFilters({
                  search: '',
                  status: 'all',
                  paymentStatus: 'all',
                  dateFrom: '',
                  dateTo: ''
                })}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <DataTable
          columns={columns}
          data={orders}
          searchPlaceholder="Search orders by number, customer name, or email..."
          onExport={() => {
            console.log('Exporting orders...')
          }}
        />
      </div>
    </AdminLayout>
  )
}