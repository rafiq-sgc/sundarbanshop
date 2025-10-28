'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { DataTable } from '@/components/admin/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import {
  AlertTriangle,
  Package,
  TrendingDown,
  Bell,
  Mail,
  ShoppingCart,
  Eye,
  Loader2
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import inventoryService, { type LowStockAlert } from '@/services/inventory.service'
import { toast } from 'react-hot-toast'

export default function LowStockAlertsPage() {
  const { isAuthorized, loading: authLoading } = useAdminAuth()
  const router = useRouter()
  const [alerts, setAlerts] = useState<LowStockAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([])
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all')
  const [stats, setStats] = useState({
    critical: 0,
    high: 0,
    medium: 0,
    total: 0
  })

  useEffect(() => {
    if (isAuthorized) {
      fetchAlerts()
    }
  }, [isAuthorized, urgencyFilter])

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const result = await inventoryService.getAlerts(
        urgencyFilter !== 'all' ? urgencyFilter : undefined
      )

      setAlerts(result.alerts)
      setStats(result.stats)
    } catch (error: any) {
      console.error('Error fetching alerts:', error)
      toast.error(error.message || 'Failed to load alerts')
    } finally {
      setLoading(false)
    }
  }

  const getUrgencyVariant = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'secondary'
      case 'medium':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const handleBulkReorder = async () => {
    if (selectedAlerts.length === 0) {
      toast.error('Please select items to reorder')
      return
    }
    
    try {
      await inventoryService.bulkOperation({
        action: 'reorder',
        items: selectedAlerts.map(id => ({ productId: id }))
      })
      toast.success(`Reorder initiated for ${selectedAlerts.length} items`)
      setSelectedAlerts([])
      fetchAlerts()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create reorder requests')
    }
  }

  const handleBulkNotify = async () => {
    if (selectedAlerts.length === 0) {
      toast.error('Please select items to notify')
      return
    }
    
    try {
      await inventoryService.sendNotifications(selectedAlerts, 'email')
      toast.success(`Notifications sent for ${selectedAlerts.length} items`)
      setSelectedAlerts([])
      fetchAlerts()
    } catch (error: any) {
      toast.error(error.message || 'Failed to send notifications')
    }
  }

  const handleSelectAlert = (alertId: string, selected: boolean) => {
    if (selected) {
      setSelectedAlerts(prev => [...prev, alertId])
    } else {
      setSelectedAlerts(prev => prev.filter(id => id !== alertId))
    }
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedAlerts(alerts.map(a => a._id))
    } else {
      setSelectedAlerts([])
    }
  }

  const columns: ColumnDef<LowStockAlert>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={selectedAlerts.length === alerts.length && alerts.length > 0}
          onCheckedChange={(value) => handleSelectAll(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedAlerts.includes(row.original._id)}
          onCheckedChange={(value) => handleSelectAlert(row.original._id, !!value)}
        />
      ),
    },
    {
      id: 'product',
      header: 'Product',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={row.original.image}
              alt={row.original.productName}
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="font-medium text-gray-900">{row.original.productName}</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-gray-500">{row.original.sku}</p>
              <Badge variant="outline" className="text-xs">{row.original.category}</Badge>
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'currentStock',
      header: 'Current Stock',
      cell: ({ row }) => {
        const current = row.original.currentStock
        const min = row.original.minStock
        const percentage = min > 0 ? (current / min) * 100 : 0

        return (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-bold ${
                current === 0 ? 'text-red-600' :
                current < min / 2 ? 'text-red-600' :
                'text-yellow-600'
              }`}>
                {current}
              </span>
              <span className="text-gray-500">/ {min}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${
                  current === 0 ? 'bg-red-500' :
                  percentage < 50 ? 'bg-red-500' :
                  'bg-yellow-500'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'warehouse',
      header: 'Warehouse',
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">{row.original.warehouse}</span>
      ),
    },
    {
      accessorKey: 'urgency',
      header: 'Urgency',
      cell: ({ row }) => (
        <Badge variant={getUrgencyVariant(row.original.urgency)}>
          {row.original.urgency.charAt(0).toUpperCase() + row.original.urgency.slice(1)}
        </Badge>
      ),
    },
    {
      accessorKey: 'lastSold',
      header: 'Last Sold',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {format(new Date(row.original.lastSold), 'MMM dd, HH:mm')}
        </span>
      ),
    },
    {
      accessorKey: 'notified',
      header: 'Notified',
      cell: ({ row }) => (
        row.original.notified ? (
          <Badge variant="outline">
            <Bell className="w-3 h-3 mr-1" />
            Yes
          </Badge>
        ) : (
          <span className="text-xs text-gray-400">No</span>
        )
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={async () => {
              try {
                await inventoryService.bulkOperation({
                  action: 'reorder',
                  items: [{ productId: row.original._id }]
                })
                toast.success('Reorder request created')
                fetchAlerts()
              } catch (error: any) {
                toast.error(error.message || 'Failed to create reorder')
              }
            }}
          >
            <ShoppingCart className="w-4 h-4 mr-1" />
            Reorder
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link href={`/admin/products?search=${row.original.sku}`}>
              <Eye className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      ),
    },
  ]

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading alerts...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Low Stock Alerts</h1>
            <p className="text-gray-600 mt-1">Monitor and manage inventory items that need restocking</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBulkNotify} disabled={selectedAlerts.length === 0}>
              <Mail className="w-4 h-4 mr-2" />
              Notify Suppliers
            </Button>
            <Button onClick={handleBulkReorder} disabled={selectedAlerts.length === 0}>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Bulk Reorder
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
              <p className="text-xs text-gray-500 mt-1">Immediate action needed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.high}</div>
              <p className="text-xs text-gray-500 mt-1">Action required soon</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Medium Priority</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.medium}</div>
              <p className="text-xs text-gray-500 mt-1">Monitor closely</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Filter by Urgency:</label>
              <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Urgency</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        {selectedAlerts.length > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-900">
                  {selectedAlerts.length} item{selectedAlerts.length > 1 ? 's' : ''} selected
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleBulkNotify}>
                    <Mail className="w-4 h-4 mr-1" />
                    Notify Suppliers
                  </Button>
                  <Button size="sm" onClick={handleBulkReorder}>
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    Create Purchase Orders
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedAlerts([])}>
                    Clear Selection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alerts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No low stock alerts</h3>
                <p className="mt-2 text-sm text-gray-500">
                  All products are adequately stocked
                </p>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={alerts}
                searchPlaceholder="Search by product name or SKU..."
              />
            )}
          </CardContent>
        </Card>

        {/* Out of Stock Items */}
        {alerts.filter(a => a.currentStock === 0).length > 0 && (
          <Card className="border-red-200 bg-red-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                Out of Stock Items ({alerts.filter(a => a.currentStock === 0).length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.filter(a => a.currentStock === 0).map((item) => (
                  <div key={item._id} className="flex items-center justify-between p-4 bg-white border border-red-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={item.image}
                          alt={item.productName}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        <p className="text-sm text-gray-500">{item.sku} • {item.warehouse}</p>
                        {item.daysOutOfStock > 0 && (
                          <p className="text-xs text-red-600 mt-1">
                            Out of stock for {item.daysOutOfStock} days
                          </p>
                        )}
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      onClick={async () => {
                        try {
                          await inventoryService.bulkOperation({
                            action: 'reorder',
                            items: [{ productId: item._id }]
                          })
                          toast.success('Reorder request created')
                          fetchAlerts()
                        } catch (error: any) {
                          toast.error(error.message || 'Failed to create reorder')
                        }
                      }}
                    >
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      Reorder Now
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
