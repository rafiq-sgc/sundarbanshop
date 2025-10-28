'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  Warehouse as WarehouseIcon,
  Plus,
  MapPin,
  Package,
  TrendingUp,
  Edit,
  Trash2,
  Search,
  Eye,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'react-hot-toast'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { warehouseService, type Warehouse, type WarehouseStats } from '@/services'

export default function WarehousesPage() {
  const { isAuthorized, loading: authLoading } = useAdminAuth()
  const router = useRouter()
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [stats, setStats] = useState<WarehouseStats>({ total: 0, active: 0, inactive: 0 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (isAuthorized) {
      fetchWarehouses()
    }
  }, [isAuthorized])

  const fetchWarehouses = async () => {
    setLoading(true)
    try {
      const data = await warehouseService.getWarehouses({ search: searchTerm })
      setWarehouses(data.warehouses)
      setStats(data.stats)
    } catch (error: any) {
      console.error('Error fetching warehouses:', error)
      toast.error(error.message || 'Failed to load warehouses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (isAuthorized) {
        fetchWarehouses()
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm, isAuthorized])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this warehouse?')) return

    try {
      await warehouseService.deleteWarehouse(id)
      toast.success('Warehouse deleted successfully')
      fetchWarehouses()
    } catch (error: any) {
      console.error('Error deleting warehouse:', error)
      toast.error(error.message || 'Failed to delete warehouse')
    }
  }

  const getWarehouseStats = (warehouse: Warehouse) => {
    const totalStock = warehouse.inventory?.reduce((sum, item) => sum + item.quantity, 0) || 0
    const totalReserved = warehouse.inventory?.reduce((sum, item) => sum + item.reserved, 0) || 0
    const totalAvailable = totalStock - totalReserved

    return {
      totalProducts: warehouse.inventory?.length || 0,
      totalStock,
      totalAvailable,
    }
  }

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading warehouses...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
            <p className="text-gray-600 mt-1">Manage your warehouse locations and inventory</p>
          </div>
          <Link href="/admin/warehouses/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Warehouse
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Warehouses</CardTitle>
              <WarehouseIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search warehouses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Warehouses Grid */}
        {warehouses.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <WarehouseIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No warehouses found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Get started by creating a new warehouse.
                </p>
                <Link href="/admin/warehouses/new">
                  <Button className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Warehouse
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {warehouses.map((warehouse) => {
              const warehouseStats = getWarehouseStats(warehouse)
              return (
                <Card key={warehouse._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <WarehouseIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                          <p className="text-sm text-gray-500">{warehouse.code}</p>
                        </div>
                      </div>
                      <Badge variant={warehouse.isActive ? 'default' : 'secondary'}>
                        {warehouse.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Address */}
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <p>{warehouse.address.street}</p>
                          <p>
                            {warehouse.address.city}, {warehouse.address.state}{' '}
                            {warehouse.address.zipCode}
                          </p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2 pt-4 border-t">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Products</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {warehouseStats.totalProducts}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Stock</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {warehouseStats.totalStock}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Available</p>
                          <p className="text-lg font-semibold text-green-600">
                            {warehouseStats.totalAvailable}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-4 border-t">
                        <Link href={`/admin/warehouses/${warehouse._id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/warehouses/${warehouse._id}/edit`)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(warehouse._id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
