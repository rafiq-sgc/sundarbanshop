'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { couponService, type Coupon, type CouponStats } from '@/services/coupon.service'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Plus, 
  Edit, 
  Trash2,
  Copy,
  Tag,
  Percent,
  Calendar,
  Users,
  Loader2,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'

// Zod schemas
const couponSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').max(50).toUpperCase(),
  description: z.string().max(500).optional().or(z.literal('')),
  type: z.enum(['percentage', 'fixed']),
  value: z.number().min(0.01, 'Value must be greater than 0'),
  minimumPurchase: z.number().min(0).default(0),
  maximumDiscount: z.number().min(0).optional(),
  usageLimit: z.number().min(1).optional(),
  perUserLimit: z.number().min(1).optional(),
  isActive: z.boolean().default(true),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
})

type CouponFormData = z.infer<typeof couponSchema>

export default function CouponsPage() {
  const { isAuthorized, loading: authLoading } = useAdminAuth()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [stats, setStats] = useState<CouponStats>({ total: 0, active: 0, expired: 0, percentage: 0, fixed: 0 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const form = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema) as any,
    defaultValues: {
      code: '',
      description: '',
      type: 'percentage',
      value: 0,
      minimumPurchase: 0,
      maximumDiscount: undefined,
      usageLimit: undefined,
      perUserLimit: undefined,
      isActive: true,
      startDate: '',
      endDate: '',
    },
  })

  useEffect(() => {
    if (isAuthorized) {
      fetchCoupons()
    }
  }, [isAuthorized, typeFilter, statusFilter])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (isAuthorized) {
        fetchCoupons()
      }
    }, 500)
    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm])

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      const result = await couponService.getCoupons({
        search: searchTerm || undefined,
        type: typeFilter || undefined,
        status: statusFilter || undefined
      })

      if (result.success && result.data) {
        setCoupons(result.data.coupons)
        setStats(result.data.stats)
      } else {
        toast.error(result.message || 'Failed to load coupons')
      }
    } catch (error) {
      console.error('Error fetching coupons:', error)
      toast.error('Failed to load coupons')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: CouponFormData) => {
    try {
      let result
      
      if (selectedCoupon) {
        result = await couponService.updateCoupon(selectedCoupon._id, data)
      } else {
        result = await couponService.createCoupon(data)
      }

      if (result.success) {
        toast.success(selectedCoupon ? 'Coupon updated successfully!' : 'Coupon created successfully!')
        setShowCreateDialog(false)
        setShowEditDialog(false)
        form.reset()
        setSelectedCoupon(null)
        fetchCoupons()
      } else {
        toast.error(result.message || 'Failed to save coupon')
      }
    } catch (error) {
      console.error('Error saving coupon:', error)
      toast.error('Failed to save coupon')
    }
  }

  const handleEdit = (coupon: Coupon) => {
    setSelectedCoupon(coupon)
    form.reset({
      code: coupon.code,
      description: coupon.description || '',
      type: coupon.type,
      value: coupon.value,
      minimumPurchase: coupon.minimumPurchase,
      maximumDiscount: coupon.maximumDiscount,
      usageLimit: coupon.usageLimit,
      perUserLimit: coupon.perUserLimit,
      isActive: coupon.isActive,
      startDate: coupon.startDate ? format(new Date(coupon.startDate), 'yyyy-MM-dd') : '',
      endDate: coupon.endDate ? format(new Date(coupon.endDate), 'yyyy-MM-dd') : '',
    })
    setShowEditDialog(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const result = await couponService.deleteCoupon(id)

      if (result.success) {
        toast.success('Coupon deleted successfully!')
        setDeleteId(null)
        fetchCoupons()
      } else {
        toast.error(result.message || 'Failed to delete coupon')
      }
    } catch (error) {
      console.error('Error deleting coupon:', error)
      toast.error('Failed to delete coupon')
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const result = await couponService.toggleActive(id, !isActive)

      if (result.success) {
        toast.success(`Coupon ${!isActive ? 'activated' : 'deactivated'} successfully!`)
        fetchCoupons()
      } else {
        toast.error(result.message || 'Failed to toggle coupon')
      }
    } catch (error) {
      console.error('Error toggling coupon:', error)
      toast.error('Failed to toggle coupon')
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success(`Coupon code "${code}" copied to clipboard!`)
  }

  const getStatusBadge = (coupon: Coupon) => {
    const status = couponService.getCouponStatus(coupon)
    
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>
      case 'expired':
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Expired</Badge>
      case 'upcoming':
        return <Badge className="bg-blue-600"><Clock className="w-3 h-3 mr-1" />Upcoming</Badge>
      case 'inactive':
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Inactive</Badge>
    }
  }

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading coupons...</p>
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
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
              <p className="text-muted-foreground mt-2">
                Create and manage discount coupons for customers
              </p>
            </div>
            <Button onClick={() => {
              form.reset()
              setSelectedCoupon(null)
              setShowCreateDialog(true)
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Coupon
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Expired</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-400">{stats.expired}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Percentage</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{stats.percentage}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Fixed Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-600">{stats.fixed}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search coupons by code or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={typeFilter || 'all'} onValueChange={(value) => setTypeFilter(value === 'all' ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-48">
                <Select value={statusFilter || 'all'} onValueChange={(value) => setStatusFilter(value === 'all' ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={fetchCoupons} variant="outline">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Coupons List */}
        {coupons.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Tag className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No coupons found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  {searchTerm || typeFilter || statusFilter
                    ? 'Try adjusting your filters'
                    : 'Get started by creating your first coupon'}
                </p>
                {!searchTerm && !typeFilter && !statusFilter && (
                  <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Coupon
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map((coupon) => (
              <Card key={coupon._id}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Coupon Code */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Tag className="w-5 h-5 text-green-600" />
                          <h3 className="text-xl font-bold font-mono">{coupon.code}</h3>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyCode(coupon.code)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-sm text-gray-600">{coupon.description}</p>
                      </div>
                    </div>

                    {/* Discount Value */}
                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                      <div className="flex items-center justify-center gap-2">
                        <Percent className="w-6 h-6 text-green-600" />
                        <p className="text-3xl font-bold text-green-600">
                          {couponService.formatDiscount(coupon)}
                        </p>
                      </div>
                      {coupon.minimumPurchase > 0 && (
                        <p className="text-xs text-center text-gray-600 mt-2">
                          Min purchase: ৳{coupon.minimumPurchase.toLocaleString()}
                        </p>
                      )}
                      {coupon.maximumDiscount && (
                        <p className="text-xs text-center text-gray-600">
                          Max discount: ৳{coupon.maximumDiscount.toLocaleString()}
                        </p>
                      )}
                    </div>

                    {/* Status & Dates */}
                    <div className="flex items-center gap-2">
                      {getStatusBadge(coupon)}
                      {coupon.type === 'percentage' ? (
                        <Badge variant="outline">Percentage</Badge>
                      ) : (
                        <Badge variant="outline">Fixed</Badge>
                      )}
                    </div>

                    {/* Usage Stats */}
                    {coupon.usageLimit && (
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-600">Usage</span>
                          <span className="font-medium">
                            {coupon.usageCount} / {coupon.usageLimit}
                          </span>
                        </div>
                        <Progress value={couponService.getUsagePercentage(coupon)} className="h-2" />
                      </div>
                    )}

                    {/* Dates */}
                    <div className="text-xs text-gray-500 space-y-1">
                      {coupon.startDate && (
                        <p className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Start: {format(new Date(coupon.startDate), 'MMM dd, yyyy')}
                        </p>
                      )}
                      {coupon.endDate && (
                        <p className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Expires: {format(new Date(coupon.endDate), 'MMM dd, yyyy')}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(coupon)}
                        className="flex-1"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(coupon._id, coupon.isActive)}
                        className="flex-1"
                      >
                        {coupon.isActive ? (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
                      <AlertDialog open={deleteId === coupon._id} onOpenChange={(open) => !open && setDeleteId(null)}>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeleteId(coupon._id)}
                          >
                            <Trash2 className="w-3 h-3 text-red-600" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete coupon?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{coupon.code}"? This action cannot be undone.
                              {coupon.usageCount > 0 && (
                                <p className="mt-2 text-orange-600">
                                  Warning: This coupon has been used {coupon.usageCount} times.
                                </p>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(coupon._id)}>
                              Delete Coupon
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
          setShowCreateDialog(open)
          setShowEditDialog(open)
          if (!open) {
            form.reset()
            setSelectedCoupon(null)
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedCoupon ? 'Edit Coupon' : 'Create New Coupon'}
              </DialogTitle>
              <DialogDescription>
                {selectedCoupon ? 'Update coupon details' : 'Create a new discount coupon for customers'}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Coupon Code *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., SAVE20" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        </FormControl>
                        <FormDescription>Unique code (auto-capitalized)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                            <SelectItem value="fixed">Fixed Amount (৳)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Value *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder={form.watch('type') === 'percentage' ? '20' : '100'}
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          {form.watch('type') === 'percentage' ? 'Percentage (0-100)' : 'Amount in BDT (৳)'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="minimumPurchase"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Purchase</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>Minimum order amount (৳)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch('type') === 'percentage' && (
                    <FormField
                      control={form.control}
                      name="maximumDiscount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Discount</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Optional"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormDescription>Max discount cap (৳)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="usageLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Usage Limit</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Unlimited"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormDescription>Max total uses (optional)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="perUserLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Per User Limit</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Unlimited"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormDescription>Uses per customer (optional)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>When coupon becomes valid</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>When coupon expires</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., 20% off on all products"
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Customer-facing description (max 500 chars)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                        <FormDescription>
                          Make this coupon available for use
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateDialog(false)
                      setShowEditDialog(false)
                      form.reset()
                      setSelectedCoupon(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {selectedCoupon ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        {selectedCoupon ? (
                          <>
                            <Edit className="w-4 h-4 mr-2" />
                            Update Coupon
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Coupon
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
