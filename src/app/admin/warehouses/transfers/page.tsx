'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  Plus,
  ArrowRightLeft,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Eye,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { stockTransferService, type StockTransfer, type TransferStats } from '@/services/warehouse'

export default function StockTransfersPage() {
  const { isAuthorized, loading: authLoading } = useAdminAuth()
  const router = useRouter()
  const [transfers, setTransfers] = useState<StockTransfer[]>([])
  const [stats, setStats] = useState<TransferStats>({ total: 0, pending: 0, in_transit: 0, completed: 0, cancelled: 0 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    if (isAuthorized) {
      fetchTransfers()
    }
  }, [isAuthorized, statusFilter])

  const fetchTransfers = async () => {
    setLoading(true)
    try {
      const data = await stockTransferService.getAll(
        statusFilter !== 'all' ? { status: statusFilter } : undefined
      )
      setTransfers(data.transfers)
      setStats(data.stats)
    } catch (error: any) {
      console.error('Error fetching transfers:', error)
      toast.error(error.message || 'Failed to load transfers')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (transferId: string, action: 'approve' | 'complete' | 'cancel') => {
    const confirmMessage = `Are you sure you want to ${action} this transfer?`
    if (!confirm(confirmMessage)) return

    try {
      if (action === 'approve') {
        await stockTransferService.approve(transferId)
      } else if (action === 'complete') {
        await stockTransferService.complete(transferId)
      } else if (action === 'cancel') {
        await stockTransferService.cancel(transferId)
      }

      toast.success(`Transfer ${action}d successfully`)
      fetchTransfers()
    } catch (error: any) {
      console.error(`Error ${action}ing transfer:`, error)
      toast.error(error.message || `Failed to ${action} transfer`)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, icon: Clock, label: 'Pending' },
      in_transit: { variant: 'default' as const, icon: Truck, label: 'In Transit' },
      completed: { variant: 'default' as const, icon: CheckCircle, label: 'Completed' },
      cancelled: { variant: 'secondary' as const, icon: XCircle, label: 'Cancelled' },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className={status === 'completed' ? 'bg-green-600' : status === 'cancelled' ? 'bg-red-600' : ''}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const getTotalItems = (items: any[]) => {
    return items.reduce((sum, item) => sum + item.quantity, 0)
  }

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading transfers...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Stock Transfers</h1>
            <p className="text-gray-600 mt-1">Manage stock movements between warehouses</p>
          </div>
          <Link href="/admin/warehouses/transfers/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Transfer
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Transit</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.in_transit}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Filter by Status:</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transfers List */}
        {transfers.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <ArrowRightLeft className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No transfers found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Create a new stock transfer to move inventory between warehouses.
                </p>
                <Link href="/admin/warehouses/transfers/new">
                  <Button className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    New Transfer
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {transfers.map((transfer) => (
              <Card key={transfer._id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-blue-100 rounded-lg">
                            <ArrowRightLeft className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{transfer.transferNumber}</h3>
                            <p className="text-sm text-gray-500">
                              {format(new Date(transfer.requestedDate), 'MMM dd, yyyy HH:mm')}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(transfer.status)}
                      </div>

                      {/* Warehouse Info */}
                      <div className="flex items-center gap-4">
                        <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500">From</p>
                          <p className="font-medium text-gray-900">{transfer.fromWarehouse.name}</p>
                          <p className="text-sm text-gray-600">{transfer.fromWarehouse.code}</p>
                        </div>
                        <ArrowRightLeft className="w-5 h-5 text-gray-400" />
                        <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500">To</p>
                          <p className="font-medium text-gray-900">{transfer.toWarehouse.name}</p>
                          <p className="text-sm text-gray-600">{transfer.toWarehouse.code}</p>
                        </div>
                      </div>

                      {/* Items Summary */}
                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="text-gray-500">Items:</span>{' '}
                          <span className="font-medium">{transfer.items.length}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Total Quantity:</span>{' '}
                          <span className="font-medium">{getTotalItems(transfer.items)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Requested by:</span>{' '}
                          <span className="font-medium">{transfer.requestedBy.name}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-4 border-t">
                        <Link href={`/admin/warehouses/transfers/${transfer._id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
                        {transfer.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(transfer._id, 'approve')}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusUpdate(transfer._id, 'cancel')}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        {transfer.status === 'in_transit' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(transfer._id, 'complete')}
                          >
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
