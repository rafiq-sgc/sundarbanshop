'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { inventoryAdjustmentSchema, type InventoryAdjustmentFormData } from '@/lib/validations/warehouse'
import {
  Plus,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  Save
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { 
  inventoryAdjustmentService, 
  warehouseService,
  type InventoryAdjustment, 
  type AdjustmentStats,
  type Warehouse 
} from '@/services/warehouse'

interface Product {
  _id: string
  name: string
  sku: string
}

export default function InventoryAdjustmentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([])
  const [stats, setStats] = useState<AdjustmentStats>({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [saving, setSaving] = useState(false)

  const form = useForm<InventoryAdjustmentFormData>({
    resolver: zodResolver(inventoryAdjustmentSchema) as any,
    defaultValues: {
      warehouse: '',
      items: [{ product: '', previousQuantity: 0, newQuantity: 0, difference: 0 }],
      type: 'stock_count',
      reason: '',
      notes: '',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'admin') {
      router.push('/auth/signin')
    } else {
      fetchAdjustments()
      fetchData()
    }
  }, [session, status, router, statusFilter])

  const fetchAdjustments = async () => {
    setLoading(true)
    try {
      const data = await inventoryAdjustmentService.getAll(
        statusFilter !== 'all' ? { status: statusFilter } : undefined
      )
      setAdjustments(data.adjustments)
      setStats(data.stats)
    } catch (error: any) {
      console.error('Error fetching adjustments:', error)
      toast.error(error.message || 'Failed to load adjustments')
    } finally {
      setLoading(false)
    }
  }

  const fetchData = async () => {
    try {
      const warehousesData = await warehouseService.getAll({ limit: 100 })
      setWarehouses(warehousesData.warehouses)

      const productsRes = await fetch('/api/admin/products?limit=100')
      const productsData = await productsRes.json()
      if (productsRes.ok) {
        // Ensure we set an array
        const productsList = productsData.products || productsData.data?.products || productsData.data || []
        setProducts(Array.isArray(productsList) ? productsList : [])
      }
    } catch (error: any) {
      console.error('Error fetching data:', error)
      toast.error(error.message || 'Failed to load data')
    }
  }

  const handleStatusUpdate = async (adjustmentId: string, action: 'approve' | 'reject') => {
    if (!confirm(`Are you sure you want to ${action} this adjustment?`)) return

    try {
      if (action === 'approve') {
        await inventoryAdjustmentService.approve(adjustmentId)
      } else {
        await inventoryAdjustmentService.reject(adjustmentId)
      }

      toast.success(`Adjustment ${action}d successfully`)
      fetchAdjustments()
    } catch (error: any) {
      console.error(`Error ${action}ing adjustment:`, error)
      toast.error(error.message || `Failed to ${action} adjustment`)
    }
  }

  const onSubmit = async (data: InventoryAdjustmentFormData) => {
    setSaving(true)
    try {
      await inventoryAdjustmentService.create(data)
      toast.success('Inventory adjustment created successfully!')
      setShowModal(false)
      form.reset()
      fetchAdjustments()
    } catch (error: any) {
      console.error('Error creating adjustment:', error)
      toast.error(error.message || 'Failed to create adjustment')
    } finally {
      setSaving(false)
    }
  }

  const calculateDifference = (index: number) => {
    const previousQty = form.watch(`items.${index}.previousQuantity`)
    const newQty = form.watch(`items.${index}.newQuantity`)
    const difference = newQty - previousQty
    form.setValue(`items.${index}.difference`, difference)
  }

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { variant: 'secondary' as const, icon: Clock, label: 'Pending' },
      approved: { variant: 'default' as const, icon: CheckCircle, label: 'Approved' },
      rejected: { variant: 'secondary' as const, icon: XCircle, label: 'Rejected' },
    }

    const statusConfig = config[status as keyof typeof config] || config.pending
    const Icon = statusConfig.icon

    return (
      <Badge variant={statusConfig.variant} className={status === 'approved' ? 'bg-green-600' : status === 'rejected' ? 'bg-red-600' : ''}>
        <Icon className="w-3 h-3 mr-1" />
        {statusConfig.label}
      </Badge>
    )
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Inventory Adjustments</h1>
            <p className="text-gray-600 mt-1">Adjust inventory quantities and track changes</p>
          </div>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Adjustment
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
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
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
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
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Adjustments List */}
        {adjustments.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No adjustments found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Create a new inventory adjustment to update stock quantities.
                </p>
                <Button className="mt-4" onClick={() => setShowModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Adjustment
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {adjustments.map((adjustment) => (
              <Card key={adjustment._id}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{adjustment.adjustmentNumber}</h3>
                        <p className="text-sm text-gray-500">
                          {adjustment.warehouse.name} ({adjustment.warehouse.code}) •{' '}
                          {format(new Date(adjustment.createdAt), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                      {getStatusBadge(adjustment.status)}
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Type:</span>{' '}
                        <Badge variant="outline">{adjustment.type.replace('_', ' ')}</Badge>
                      </div>
                      <div>
                        <span className="text-gray-500">Items:</span>{' '}
                        <span className="font-medium">{adjustment.items.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Adjusted by:</span>{' '}
                        <span className="font-medium">{adjustment.adjustedBy.name}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">
                        <strong>Reason:</strong> {adjustment.reason}
                      </p>
                    </div>

                    {/* Actions */}
                    {adjustment.status === 'pending' && (
                      <div className="flex items-center gap-2 pt-4 border-t">
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(adjustment._id, 'approve')}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusUpdate(adjustment._id, 'reject')}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Create Inventory Adjustment</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Warehouse & Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="warehouse"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Warehouse *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select warehouse" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {warehouses.map((warehouse) => (
                                  <SelectItem key={warehouse._id} value={warehouse._id}>
                                    {warehouse.name} ({warehouse.code})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Adjustment Type *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="stock_count">Stock Count</SelectItem>
                                <SelectItem value="damaged">Damaged</SelectItem>
                                <SelectItem value="lost">Lost</SelectItem>
                                <SelectItem value="found">Found</SelectItem>
                                <SelectItem value="correction">Correction</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Reason */}
                    <FormField
                      control={form.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reason *</FormLabel>
                          <FormControl>
                            <Input placeholder="Explain the reason for adjustment" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Items */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Adjusted Items</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => append({ product: '', previousQuantity: 0, newQuantity: 0, difference: 0 })}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Item
                        </Button>
                      </div>

                      {fields.map((field, index) => (
                        <div key={field.id} className="p-4 border rounded-lg space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Item {index + 1}</span>
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(index)}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <FormField
                              control={form.control}
                              name={`items.${index}.product`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Product *</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {Array.isArray(products) && products.length > 0 ? (
                                        products.slice(0, 50).map((product) => (
                                          <SelectItem key={product._id} value={product._id}>
                                            {product.name}
                                          </SelectItem>
                                        ))
                                      ) : (
                                        <div className="px-2 py-3 text-sm text-gray-500 text-center">
                                          No products available
                                        </div>
                                      )}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`items.${index}.previousQuantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Previous Qty *</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="0"
                                      {...field}
                                      onChange={(e) => {
                                        field.onChange(parseInt(e.target.value))
                                        calculateDifference(index)
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`items.${index}.newQuantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>New Qty *</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="0"
                                      {...field}
                                      onChange={(e) => {
                                        field.onChange(parseInt(e.target.value))
                                        calculateDifference(index)
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`items.${index}.difference`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Difference</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      readOnly
                                      className="bg-gray-50"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Notes */}
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Notes</FormLabel>
                          <FormControl>
                            <Input placeholder="Optional notes" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Actions */}
                    <div className="flex justify-end gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowModal(false)
                          form.reset()
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={saving}>
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Creating...' : 'Create Adjustment'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
