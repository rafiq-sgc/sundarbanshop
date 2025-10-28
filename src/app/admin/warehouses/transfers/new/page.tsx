'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { stockTransferSchema, type StockTransferFormData } from '@/lib/validations/warehouse'
import { ArrowLeft, Save, Plus, Trash2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import { stockTransferService, warehouseService, type Warehouse } from '@/services/warehouse'

interface Product {
  _id: string
  name: string
  sku: string
  images?: string[]
}

export default function NewStockTransferPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [productSearch, setProductSearch] = useState('')

  const form = useForm<StockTransferFormData>({
    resolver: zodResolver(stockTransferSchema) as any,
    defaultValues: {
      fromWarehouse: '',
      toWarehouse: '',
      items: [{ product: '', quantity: 1, notes: '' }],
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
      fetchData()
    }
  }, [session, status, router])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch warehouses using service
      const warehousesData = await warehouseService.getAll({ limit: 100 })
      setWarehouses(warehousesData.warehouses)

      // Fetch products
      const productsRes = await fetch('/api/admin/products?limit=100')
      const productsData = await productsRes.json()
      if (productsRes.ok) {
        setProducts(productsData.products || productsData)
      }
    } catch (error: any) {
      console.error('Error fetching data:', error)
      toast.error(error.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: StockTransferFormData) => {
    setSaving(true)
    try {
      await stockTransferService.create(data)
      toast.success('Stock transfer created successfully!')
      router.push('/admin/warehouses/transfers')
    } catch (error: any) {
      console.error('Error creating transfer:', error)
      toast.error(error.message || 'Failed to create transfer')
    } finally {
      setSaving(false)
    }
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase())
  )

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
        <div>
          <Link href="/admin/warehouses/transfers">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Transfers
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">New Stock Transfer</h1>
          <p className="text-gray-600 mt-1">Transfer stock between warehouses</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Warehouses */}
            <Card>
              <CardHeader>
                <CardTitle>Warehouse Selection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="fromWarehouse"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From Warehouse *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select source warehouse" />
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
                    name="toWarehouse"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>To Warehouse *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select destination warehouse" />
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
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Items to Transfer</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ product: '', quantity: 1, notes: '' })}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Item {index + 1}</h4>
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`items.${index}.product`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <div className="p-2">
                                  <Input
                                    placeholder="Search products..."
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    className="mb-2"
                                  />
                                </div>
                                {filteredProducts.slice(0, 20).map((product) => (
                                  <SelectItem key={product._id} value={product._id}>
                                    {product.name} (SKU: {product.sku})
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
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.notes`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Input placeholder="Optional notes" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Optional transfer notes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Link href="/admin/warehouses/transfers">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Creating...' : 'Create Transfer'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  )
}
