'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { bannerService, type Banner, type BannerStats } from '@/services/banner.service'
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Search,
  RefreshCcw,
  Loader2,
  ImageIcon,
  Calendar,
  MousePointer,
  TrendingUp,
  Monitor,
  Smartphone,
  X,
  Upload,
  Link as LinkIcon,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import Image from 'next/image'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
} from '@/components/ui/alert-dialog'

// Validation schema
const bannerSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  image: z.string().min(1, 'Image is required'),
  mobileImage: z.string().optional(),
  link: z.string().optional(),
  linkText: z.string()
    .max(50, 'Link text must be less than 50 characters')
    .optional(),
  position: z.enum(['hero', 'top', 'middle', 'bottom', 'sidebar']),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

type BannerFormData = z.infer<typeof bannerSchema>

export default function BannersPage() {
  const { isAuthorized, loading: authLoading } = useAdminAuth()
  const [banners, setBanners] = useState<Banner[]>([])
  const [stats, setStats] = useState<BannerStats>({
    total: 0,
    active: 0,
    inactive: 0,
    hero: 0,
    totalClicks: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [positionFilter, setPositionFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [mobileImagePreview, setMobileImagePreview] = useState<string>('')

  const form = useForm<BannerFormData>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: '',
      description: '',
      image: '',
      mobileImage: '',
      link: '',
      linkText: 'Learn More',
      position: 'hero',
      isActive: true,
      sortOrder: 0,
      startDate: '',
      endDate: ''
    }
  })

  useEffect(() => {
    if (isAuthorized) {
      fetchBanners()
    }
  }, [isAuthorized, positionFilter, statusFilter])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (isAuthorized) {
        fetchBanners()
      }
    }, 500)
    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm])

  const fetchBanners = async () => {
    try {
      setLoading(true)
      const result = await bannerService.getBanners({
        search: searchTerm || undefined,
        position: positionFilter !== 'all' ? positionFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      })

      if (result.success && result.data) {
        setBanners(result.data.banners)
        setStats(result.data.stats)
      } else {
        toast.error(result.message || 'Failed to load banners')
      }
    } catch (error) {
      console.error('Error fetching banners:', error)
      toast.error('Failed to load banners')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isMobile: boolean = false) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB')
        return
      }

      if (!file.type.startsWith('image/')) {
        toast.error('File must be an image')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        if (isMobile) {
          setMobileImagePreview(reader.result as string)
          form.setValue('mobileImage', reader.result as string)
        } else {
          setImagePreview(reader.result as string)
          form.setValue('image', reader.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCreate = async (data: BannerFormData) => {
    try {
      const result = await bannerService.createBanner(data)

      if (result.success) {
        toast.success('Banner created successfully!')
        setShowCreateDialog(false)
        form.reset()
        setImagePreview('')
        setMobileImagePreview('')
        fetchBanners()
      } else {
        toast.error(result.message || 'Failed to create banner')
      }
    } catch (error) {
      console.error('Error creating banner:', error)
      toast.error('Failed to create banner')
    }
  }

  const handleEdit = (banner: Banner) => {
    setSelectedBanner(banner)
    setImagePreview(banner.image)
    setMobileImagePreview(banner.mobileImage || '')
    form.reset({
      title: banner.title,
      description: banner.description || '',
      image: banner.image,
      mobileImage: banner.mobileImage || '',
      link: banner.link || '',
      linkText: banner.linkText || 'Learn More',
      position: banner.position,
      isActive: banner.isActive,
      sortOrder: banner.sortOrder,
      startDate: banner.startDate ? banner.startDate.split('T')[0] : '',
      endDate: banner.endDate ? banner.endDate.split('T')[0] : ''
    })
    setShowEditDialog(true)
  }

  const handleUpdate = async (data: BannerFormData) => {
    if (!selectedBanner) return

    try {
      const result = await bannerService.updateBanner(selectedBanner._id, data)

      if (result.success) {
        toast.success('Banner updated successfully!')
        setShowEditDialog(false)
        setSelectedBanner(null)
        form.reset()
        setImagePreview('')
        setMobileImagePreview('')
        fetchBanners()
      } else {
        toast.error(result.message || 'Failed to update banner')
      }
    } catch (error) {
      console.error('Error updating banner:', error)
      toast.error('Failed to update banner')
    }
  }

  const handleDelete = async () => {
    if (!selectedBanner) return

    try {
      const result = await bannerService.deleteBanner(selectedBanner._id)

      if (result.success) {
        toast.success('Banner deleted successfully!')
        setShowDeleteDialog(false)
        setSelectedBanner(null)
        fetchBanners()
      } else {
        toast.error(result.message || 'Failed to delete banner')
      }
    } catch (error) {
      console.error('Error deleting banner:', error)
      toast.error('Failed to delete banner')
    }
  }

  const handleToggleStatus = async (banner: Banner) => {
    try {
      const result = await bannerService.toggleBannerStatus(banner._id)

      if (result.success) {
        toast.success(`Banner ${!banner.isActive ? 'activated' : 'deactivated'}!`)
        fetchBanners()
      } else {
        toast.error(result.message || 'Failed to toggle banner')
      }
    } catch (error) {
      console.error('Error toggling banner:', error)
      toast.error('Failed to toggle banner')
    }
  }

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading banners...</p>
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
              <h1 className="text-3xl font-bold tracking-tight">Banners & Sliders</h1>
              <p className="text-muted-foreground mt-2">
                Manage promotional banners across your website
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={fetchBanners} variant="outline" size="icon">
                <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Banner
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Total Banners
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Inactive
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                Hero Banners
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-600">{stats.hero}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MousePointer className="w-4 h-4" />
                Total Clicks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">
                {stats.totalClicks.toLocaleString()}
              </p>
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
                    placeholder="Search by title or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={positionFilter} onValueChange={setPositionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Positions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Positions</SelectItem>
                    <SelectItem value="hero">Hero</SelectItem>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="middle">Middle</SelectItem>
                    <SelectItem value="bottom">Bottom</SelectItem>
                    <SelectItem value="sidebar">Sidebar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Banners List */}
        {loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading banners...</p>
              </div>
            </CardContent>
          </Card>
        ) : banners.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No banners found</h3>
                <p className="text-sm text-gray-500 mb-6">
                  {searchTerm || positionFilter !== 'all' || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Create your first banner to get started'}
                </p>
                {!searchTerm && positionFilter === 'all' && statusFilter === 'all' && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Banner
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {banners.map((banner) => {
              const status = bannerService.getBannerStatus(banner)
              
              return (
                <Card key={banner._id} className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    {/* Banner Preview */}
                    <div className="relative w-full md:w-80 h-48 bg-gray-100 flex-shrink-0">
                      <Image
                        src={banner.image}
                        alt={banner.title}
                        fill
                        className="object-cover"
                      />
                      {banner.mobileImage && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="text-xs">
                            <Smartphone className="w-3 h-3 mr-1" />
                            Mobile Version
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Banner Info */}
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold">{banner.title}</h3>
                            <Badge className={bannerService.getPositionColor(banner.position)}>
                              {bannerService.getPositionLabel(banner.position)}
                            </Badge>
                            <Badge className={bannerService.getStatusColor(status)}>
                              {status === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
                              {status === 'scheduled' && <Clock className="w-3 h-3 mr-1" />}
                              {status === 'expired' && <AlertTriangle className="w-3 h-3 mr-1" />}
                              {status === 'inactive' && <XCircle className="w-3 h-3 mr-1" />}
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Badge>
                          </div>
                          {banner.description && (
                            <p className="text-sm text-muted-foreground mb-3">{banner.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            {banner.link && (
                              <div className="flex items-center gap-1">
                                <LinkIcon className="w-3 h-3" />
                                <span className="truncate max-w-xs">{banner.link}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <MousePointer className="w-3 h-3" />
                              {banner.clicks} clicks
                            </div>
                            {banner.startDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Start: {format(new Date(banner.startDate), 'MMM dd, yyyy')}
                              </div>
                            )}
                            {banner.endDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                End: {format(new Date(banner.endDate), 'MMM dd, yyyy')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleStatus(banner)}
                        >
                          {banner.isActive ? (
                            <>
                              <EyeOff className="w-3 h-3 mr-1" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(banner)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedBanner(banner)
                            setShowDeleteDialog(true)
                          }}
                        >
                          <Trash2 className="w-3 h-3 mr-1 text-red-600" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog 
          open={showCreateDialog || showEditDialog} 
          onOpenChange={(open) => {
            if (!open) {
              setShowCreateDialog(false)
              setShowEditDialog(false)
              setSelectedBanner(null)
              form.reset()
              setImagePreview('')
              setMobileImagePreview('')
            }
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedBanner ? 'Edit Banner' : 'Create New Banner'}</DialogTitle>
              <DialogDescription>
                {selectedBanner ? 'Update banner information' : 'Add a new promotional banner'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={form.handleSubmit(selectedBanner ? handleUpdate : handleCreate)}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">
                      Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      {...form.register('title')}
                      placeholder="Enter banner title"
                      className={form.formState.errors.title ? 'border-red-500' : ''}
                    />
                    {form.formState.errors.title && (
                      <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      {...form.register('description')}
                      placeholder="Brief description or subtitle"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="link">Link URL</Label>
                    <Input
                      id="link"
                      {...form.register('link')}
                      placeholder="/shop?category=organic"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkText">Button Text</Label>
                    <Input
                      id="linkText"
                      {...form.register('linkText')}
                      placeholder="Shop Now"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="position">
                        Position <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        defaultValue={selectedBanner?.position || 'hero'}
                        onValueChange={(value) => form.setValue('position', value as any)}
                      >
                        <SelectTrigger id="position">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hero">Hero Banner</SelectItem>
                          <SelectItem value="top">Top Banner</SelectItem>
                          <SelectItem value="middle">Middle Banner</SelectItem>
                          <SelectItem value="bottom">Bottom Banner</SelectItem>
                          <SelectItem value="sidebar">Sidebar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sortOrder">Display Order</Label>
                      <Input
                        id="sortOrder"
                        type="number"
                        {...form.register('sortOrder', { valueAsNumber: true })}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        {...form.register('startDate')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        {...form.register('endDate')}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="isActive">Active Status</Label>
                      <p className="text-xs text-muted-foreground">
                        Show banner on website
                      </p>
                    </div>
                    <Switch
                      id="isActive"
                      defaultChecked={selectedBanner?.isActive ?? true}
                      onCheckedChange={(checked) => form.setValue('isActive', checked)}
                    />
                  </div>
                </div>

                {/* Right Column - Images */}
                <div className="space-y-4">
                  {/* Desktop Image */}
                  <div className="space-y-2">
                    <Label>
                      Desktop Image <span className="text-red-500">*</span>
                    </Label>
                    {imagePreview ? (
                      <div className="space-y-2">
                        <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                          <Image
                            src={imagePreview}
                            alt="Preview"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setImagePreview('')
                              form.setValue('image', '')
                            }}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Remove
                          </Button>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, false)}
                            className="hidden"
                            id="image-replace"
                          />
                          <Button type="button" variant="outline" size="sm" asChild>
                            <label htmlFor="image-replace" className="cursor-pointer">
                              <Upload className="w-4 h-4 mr-2" />
                              Replace
                            </label>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed rounded-lg p-6 text-center">
                        <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-3">
                          Recommended: 1920×600px (max 5MB)
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, false)}
                          className="hidden"
                          id="image-upload"
                        />
                        <Button type="button" variant="outline" size="sm" asChild>
                          <label htmlFor="image-upload" className="cursor-pointer">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Image
                          </label>
                        </Button>
                      </div>
                    )}
                    {form.formState.errors.image && (
                      <p className="text-sm text-red-500">{form.formState.errors.image.message}</p>
                    )}
                  </div>

                  {/* Mobile Image */}
                  <div className="space-y-2">
                    <Label>Mobile Image (Optional)</Label>
                    {mobileImagePreview ? (
                      <div className="space-y-2">
                        <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                          <Image
                            src={mobileImagePreview}
                            alt="Mobile Preview"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setMobileImagePreview('')
                              form.setValue('mobileImage', '')
                            }}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Remove
                          </Button>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, true)}
                            className="hidden"
                            id="mobile-image-replace"
                          />
                          <Button type="button" variant="outline" size="sm" asChild>
                            <label htmlFor="mobile-image-replace" className="cursor-pointer">
                              <Upload className="w-4 h-4 mr-2" />
                              Replace
                            </label>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed rounded-lg p-6 text-center">
                        <Smartphone className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-3">
                          Recommended: 800×600px
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, true)}
                          className="hidden"
                          id="mobile-image-upload"
                        />
                        <Button type="button" variant="outline" size="sm" asChild>
                          <label htmlFor="mobile-image-upload" className="cursor-pointer">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Mobile
                          </label>
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      💡 <strong>Tip:</strong> Upload a separate mobile-optimized image for better mobile experience. If not provided, desktop image will be used.
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false)
                    setShowEditDialog(false)
                    setSelectedBanner(null)
                    form.reset()
                    setImagePreview('')
                    setMobileImagePreview('')
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedBanner ? 'Update Banner' : 'Create Banner'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete banner?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedBanner?.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSelectedBanner(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Delete Banner
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  )
}
