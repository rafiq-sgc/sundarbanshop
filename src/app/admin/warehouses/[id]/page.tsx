'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  ArrowLeft,
  Edit,
  Package,
  TrendingUp,
  AlertTriangle,
  MapPin,
  Phone,
  Mail,
  User
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'
import Image from 'next/image'
import { warehouseService, type Warehouse, type WarehouseDetailResponse } from '@/services/warehouse'

export default function WarehouseDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null)
  const [stats, setStats] = useState<WarehouseDetailResponse['stats'] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'admin') {
      router.push('/auth/signin')
    } else {
      fetchWarehouse()
    }
  }, [session, status, router, params.id])

  const fetchWarehouse = async () => {
    setLoading(true)
    try {
      const data = await warehouseService.getById(params.id as string)
      setWarehouse(data.warehouse)
      setStats(data.stats)
    } catch (error: any) {
      console.error('Error fetching warehouse:', error)
      toast.error(error.message || 'Failed to load warehouse')
      router.push('/admin/warehouses')
    } finally {
      setLoading(false)
    }
  }

  if (loading || status === 'loading' || !warehouse) {
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
            <Link href="/admin/warehouses">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Warehouses
              </Button>
            </Link>
            <div className="flex items-center gap-3 mt-2">
              <h1 className="text-2xl font-bold text-gray-900">{warehouse.name}</h1>
              <Badge variant={warehouse.isActive ? 'default' : 'secondary'}>
                {warehouse.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-gray-600 mt-1">Code: {warehouse.code}</p>
          </div>
          <Button onClick={() => router.push(`/admin/warehouses/${warehouse._id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Warehouse
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalItems || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalQuantity || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reserved</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats?.totalReserved || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.totalAvailable || 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Warehouse Information */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Warehouse Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Address</p>
                    <p className="text-sm text-gray-600">{warehouse.address.street}</p>
                    <p className="text-sm text-gray-600">
                      {warehouse.address.city}, {warehouse.address.state} {warehouse.address.zipCode}
                    </p>
                    <p className="text-sm text-gray-600">{warehouse.address.country}</p>
                  </div>
                </div>

                {warehouse.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Phone</p>
                      <p className="text-sm text-gray-600">{warehouse.phone}</p>
                    </div>
                  </div>
                )}

                {warehouse.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email</p>
                      <p className="text-sm text-gray-600">{warehouse.email}</p>
                    </div>
                  </div>
                )}

                {warehouse.manager && (
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Manager</p>
                      <p className="text-sm text-gray-600">{warehouse.manager.name}</p>
                      <p className="text-xs text-gray-500">{warehouse.manager.email}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Inventory */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Inventory ({warehouse.inventory?.length || 0} items)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {warehouse.inventory && warehouse.inventory.length > 0 ? (
                    warehouse.inventory.map((item) => {
                      const available = item.quantity - item.reserved
                      return (
                        <div
                          key={typeof item.product === 'string' ? item.product : item.product._id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            {typeof item.product === 'object' && item.product.images && item.product.images[0] ? (
                              <Image
                                src={item.product.images[0]}
                                alt={item.product.name}
                                width={48}
                                height={48}
                                className="rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {typeof item.product === 'object' ? item.product.name : 'Product'}
                              </p>
                              <p className="text-sm text-gray-500">
                                SKU: {typeof item.product === 'object' ? item.product.sku : 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 text-sm">
                            <div className="text-center">
                              <p className="text-gray-500">Total</p>
                              <p className="font-semibold text-gray-900">{item.quantity}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-500">Reserved</p>
                              <p className="font-semibold text-orange-600">{item.reserved}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-500">Available</p>
                              <p className="font-semibold text-green-600">{available}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-12">
                      <Package className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-4 text-gray-500">No inventory items</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
