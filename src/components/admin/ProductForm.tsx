'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { productSchema } from '@/lib/validations/product'
import RichTextEditor from '@/components/admin/RichTextEditor'
import VariantManager from '@/components/admin/VariantManager'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Save,
  Upload,
  X,
  Loader2,
  Package,
  DollarSign,
  Tags as TagsIcon,
  BarChart3,
  Image as ImageIcon,
  Settings,
  Layers
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import Image from 'next/image'

export interface ProductFormData {
  name: string
  slug: string
  description: string
  shortDescription?: string
  category: string
  price: number
  comparePrice?: number
  cost?: number
  salePrice?: number
  sku: string
  barcode?: string
  quantity: number
  lowStockThreshold?: number
  weight?: number
  length?: number
  width?: number
  height?: number
  isActive: boolean
  isFeatured: boolean
  isOnSale: boolean
  metaTitle?: string
  metaDescription?: string
  images?: string[]
  tags?: string[] | string // Support both array and comma-separated string
}

interface ProductFormProps {
  mode: 'create' | 'edit'
  productId?: string
  initialData?: Partial<ProductFormData>
  onSubmit: (data: any) => Promise<void>
  isSubmitting: boolean
}

export default function ProductForm({
  mode,
  productId,
  initialData,
  onSubmit,
  isSubmitting
}: ProductFormProps) {
  const [images, setImages] = useState<string[]>(initialData?.images || [])
  const [description, setDescription] = useState(initialData?.description || '')
  const [tags, setTags] = useState('')
  const [categories, setCategories] = useState<Array<{ _id: string; name: string }>>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [uploadingImages, setUploadingImages] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm({
    resolver: zodResolver(productSchema),
    mode: 'onSubmit',
    defaultValues: {
      name: initialData?.name || '',
      slug: initialData?.slug || '',
      description: initialData?.description || '',
      shortDescription: initialData?.shortDescription || '',
      price: initialData?.price || 0,
      comparePrice: initialData?.comparePrice || 0,
      cost: initialData?.cost || 0,
      salePrice: initialData?.salePrice || 0,
      sku: initialData?.sku || '',
      barcode: initialData?.barcode || '',
      quantity: initialData?.quantity || 0,
      lowStockThreshold: initialData?.lowStockThreshold || 10,
      images: [],
      category: initialData?.category || '',
      tags: [],
      isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
      isFeatured: initialData?.isFeatured || false,
      isOnSale: initialData?.isOnSale || false,
      weight: initialData?.weight || 0,
      length: initialData?.length || 0,
      width: initialData?.width || 0,
      height: initialData?.height || 0,
      metaTitle: initialData?.metaTitle || '',
      metaDescription: initialData?.metaDescription || ''
    }
  })

  const selectedCategory = watch('category')

  // Initialize tags from initialData in edit mode
  useEffect(() => {
    if (initialData && mode === 'edit') {
      console.log('Initializing form data from initialData:', initialData)
      
      // Set images
      if (initialData.images) {
        setImages(initialData.images)
        setValue('images', initialData.images)
      }
      
      // Set description
      if (initialData.description) {
        setDescription(initialData.description)
        setValue('description', initialData.description)
      }
      
      // Set tags - convert array to comma-separated string
      if (initialData.tags) {
        const tagsString = Array.isArray(initialData.tags) 
          ? initialData.tags.join(', ') 
          : String(initialData.tags || '')
        setTags(tagsString)
        console.log('Set tags to:', tagsString)
      }
    }
  }, [initialData, mode, setValue])

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories')
      const data = await response.json()
      if (data.success) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to load categories')
    } finally {
      setLoadingCategories(false)
    }
  }

  const handleFormSubmit = async (data: any) => {
    console.log('ProductForm handleFormSubmit called with:', data)
    console.log('Current images:', images)
    console.log('Current description:', description)
    console.log('Current tags:', tags)
    
    if (images.length === 0) {
      toast.error('Please upload at least one product image')
      return
    }

    // Process tags
    const tagsArray = tags
      ? tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag)
      : []

    console.log('Processed tags array:', tagsArray)

    // Prepare data with proper mappings - keep BOTH quantity and stock for compatibility
    const formData = {
      ...data,
      description: description || data.description,
      tags: tagsArray,
      images: images,
      quantity: Number(data.quantity) || 0, // Keep quantity for schema validation
      stock: Number(data.quantity) || 0, // Also add stock for database
      featured: data.isFeatured || false, // Map isFeatured to featured
      // Ensure all number fields are properly converted
      price: Number(data.price) || 0,
      comparePrice: data.comparePrice ? Number(data.comparePrice) : undefined,
      cost: data.cost ? Number(data.cost) : undefined,
      salePrice: data.salePrice ? Number(data.salePrice) : undefined,
      weight: data.weight ? Number(data.weight) : undefined,
      length: data.length ? Number(data.length) : undefined,
      width: data.width ? Number(data.width) : undefined,
      height: data.height ? Number(data.height) : undefined,
      lowStockThreshold: data.lowStockThreshold ? Number(data.lowStockThreshold) : undefined
    }

    console.log('Final formData being sent to onSubmit:', formData)

    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Error in onSubmit:', error)
      throw error
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      const maxSize = 5 * 1024 * 1024
      const validFiles = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        if (!allowedTypes.includes(file.type)) {
          toast.error(`${file.name} is not a valid image file`)
          continue
        }

        if (file.size > maxSize) {
          toast.error(`${file.name} is too large (max 5MB)`)
          continue
        }

        validFiles.push(file)
      }

      if (validFiles.length === 0) return

      setUploadingImages(true)
      toast.loading('Uploading images...', { id: 'upload' })

      const formData = new FormData()
      validFiles.forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch('/api/upload/multiple', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        const uploadedUrls = result.data.files.map((file: any) => file.url)
        const finalImages = [...images, ...uploadedUrls]
        setImages(finalImages)
        setValue('images', finalImages)
        toast.success(`${result.data.count} image(s) uploaded successfully!`, { id: 'upload' })
      } else {
        toast.error(result.message || 'Failed to upload images', { id: 'upload' })
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload images', { id: 'upload' })
    } finally {
      setUploadingImages(false)
    }
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
    setValue('images', newImages)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-12 bg-gray-100">
          <TabsTrigger value="basic" className="gap-2">
            <Package className="w-4 h-4" />
            Basic
          </TabsTrigger>
          <TabsTrigger value="pricing" className="gap-2">
            <DollarSign className="w-4 h-4" />
            Pricing
          </TabsTrigger>
          <TabsTrigger value="media" className="gap-2">
            <ImageIcon className="w-4 h-4" />
            Media
          </TabsTrigger>
          <TabsTrigger value="variants" className="gap-2" disabled={!productId}>
            <Layers className="w-4 h-4" />
            Variants {!productId && <Badge variant="secondary" className="ml-1 text-xs">Save First</Badge>}
          </TabsTrigger>
          <TabsTrigger value="advanced" className="gap-2">
            <Settings className="w-4 h-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Product Name */}
              <div>
                <Label>Product Name <span className="text-red-500">*</span></Label>
                <Input
                  {...register('name')}
                  placeholder="Enter product name"
                  className="mt-2"
                  onChange={(e) => {
                    const name = e.target.value
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                    setValue('name', name)
                    setValue('slug', slug)
                  }}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message as string}</p>
                )}
              </div>

              {/* Slug */}
              <div>
                <Label>URL Slug <span className="text-red-500">*</span></Label>
                <Input
                  {...register('slug')}
                  placeholder="product-url-slug"
                  className="mt-2 font-mono text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">Auto-generated from product name (editable)</p>
                {errors.slug && (
                  <p className="mt-1 text-sm text-red-600">{errors.slug.message as string}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <Label>Description <span className="text-red-500">*</span></Label>
                <div className="mt-2 border-2 border-gray-200 rounded-lg overflow-hidden">
                  <RichTextEditor
                    value={description}
                    onChange={(value) => {
                      setDescription(value)
                      setValue('description', value)
                    }}
                    placeholder="Enter detailed product description..."
                    height="300px"
                  />
                </div>
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message as string}</p>
                )}
              </div>

              {/* Short Description */}
              <div>
                <Label>Short Description</Label>
                <textarea
                  {...register('shortDescription')}
                  rows={3}
                  className="mt-2 w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  placeholder="Brief description for product listings (max 300 characters)"
                  maxLength={300}
                />
                <p className="mt-1 text-xs text-gray-500">Displayed in product cards and search results</p>
              </div>

              {/* Category */}
              <div>
                <Label>Category <span className="text-red-500">*</span></Label>
                <select
                  {...register('category')}
                  className="mt-2 w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={loadingCategories}
                >
                  <option value="">
                    {loadingCategories ? 'Loading categories...' : 'Select category'}
                  </option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category.message as string}</p>
                )}
              </div>

              {/* Tags */}
              <div>
                <Label>Product Tags</Label>
                <Input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="organic, fresh, healthy (comma-separated)"
                  className="mt-2"
                />
                <p className="mt-1 text-xs text-gray-500">Separate tags with commas for better searchability</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Pricing & Inventory
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Regular Price (৳) <span className="text-red-500">*</span></Label>
                  <Input
                    {...register('price', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="mt-2"
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600">{errors.price.message as string}</p>
                  )}
                </div>

                <div>
                  <Label>Compare Price (৳)</Label>
                  <Input
                    {...register('comparePrice', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="mt-2"
                  />
                  <p className="mt-1 text-xs text-gray-500">Original price to show discount</p>
                </div>

                <div>
                  <Label>Cost Price (৳)</Label>
                  <Input
                    {...register('cost', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="mt-2"
                  />
                  <p className="mt-1 text-xs text-gray-500">Your cost for profit calculation</p>
                </div>

                <div>
                  <Label>Sale Price (৳)</Label>
                  <Input
                    {...register('salePrice', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="mt-2"
                  />
                  <p className="mt-1 text-xs text-gray-500">Special promotional price</p>
                </div>
              </div>

              {/* Inventory */}
              <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Inventory Management
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>SKU <span className="text-red-500">*</span></Label>
                    <Input
                      {...register('sku')}
                      placeholder="PROD-001"
                      className="mt-2 font-mono"
                    />
                    {errors.sku && (
                      <p className="mt-1 text-sm text-red-600">{errors.sku.message as string}</p>
                    )}
                  </div>

                  <div>
                    <Label>Barcode</Label>
                    <Input
                      {...register('barcode')}
                      placeholder="123456789"
                      className="mt-2 font-mono"
                    />
                  </div>

                  <div>
                    <Label>Stock Quantity <span className="text-red-500">*</span></Label>
                    <Input
                      {...register('quantity', { valueAsNumber: true })}
                      type="number"
                      placeholder="0"
                      className="mt-2"
                    />
                    {errors.quantity && (
                      <p className="mt-1 text-sm text-red-600">{errors.quantity.message as string}</p>
                    )}
                  </div>

                  <div>
                    <Label>Low Stock Alert Threshold</Label>
                    <Input
                      {...register('lowStockThreshold', { valueAsNumber: true })}
                      type="number"
                      placeholder="10"
                      className="mt-2"
                    />
                    <p className="mt-1 text-xs text-gray-500">Get notified when stock falls below this</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Product Images
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Image Grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {images.map((img, index) => (
                    <div key={index} className="relative group">
                      <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100">
                        <Image
                          src={img}
                          alt={`Product ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        {index === 0 && (
                          <Badge className="absolute top-2 left-2 bg-green-600">
                            Primary
                          </Badge>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Area */}
              <div className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                images.length === 0
                  ? 'border-red-300 bg-red-50 hover:border-red-400'
                  : 'border-gray-300 bg-gray-50 hover:border-green-500 hover:bg-green-50'
              }`}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="product-images-upload"
                  disabled={uploadingImages}
                />
                <label htmlFor="product-images-upload" className="cursor-pointer">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 mx-auto ${
                    images.length === 0 ? 'bg-red-100' : 'bg-green-100'
                  }`}>
                    {uploadingImages ? (
                      <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
                    ) : (
                      <Upload className={`w-10 h-10 ${images.length === 0 ? 'text-red-600' : 'text-green-600'}`} />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {images.length === 0 ? 'Upload Product Images (Required)' : 'Upload More Images'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Click to browse or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, WEBP up to 5MB each • Multiple images supported
                  </p>
                </label>
              </div>

              {images.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-semibold text-green-900">
                      {images.length} image{images.length !== 1 ? 's' : ''} uploaded
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setImages([])
                      setValue('images', [])
                    }}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Variants Tab */}
        <TabsContent value="variants" className="mt-6">
          {productId ? (
            <VariantManager productId={productId} categoryId={selectedCategory} />
          ) : (
            <Card className="border-2 border-dashed border-blue-300 bg-blue-50">
              <CardContent className="py-16 text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Layers className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Create Product First to Add Variants
                </h3>
                <p className="text-gray-700 mb-4 max-w-md mx-auto">
                  Variants can only be added after the product is created. Don't worry, you'll be redirected automatically!
                </p>
                <div className="bg-white rounded-lg p-4 max-w-lg mx-auto border border-blue-200">
                  <h4 className="font-semibold text-sm text-gray-900 mb-3">How it works:</h4>
                  <ol className="text-sm text-left space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                      <span>Fill in basic product information in the other tabs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                      <span>Upload at least one product image</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                      <span>Click "Create Product" below</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                      <span>You'll be redirected to the edit page where you can add variants (Size, Color, etc.) and generate all combinations automatically!</span>
                    </li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Product Status */}
            <Card>
              <CardHeader>
                <CardTitle>Product Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    {...register('isActive')}
                    type="checkbox"
                    className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                      Active
                    </p>
                    <p className="text-xs text-gray-500">Product visible to customers</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    {...register('isFeatured')}
                    type="checkbox"
                    className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                      Featured Product
                    </p>
                    <p className="text-xs text-gray-500">Show in featured sections</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    {...register('isOnSale')}
                    type="checkbox"
                    className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                      On Sale
                    </p>
                    <p className="text-xs text-gray-500">Product is on special sale</p>
                  </div>
                </label>
              </CardContent>
            </Card>

            {/* Physical Attributes */}
            <Card>
              <CardHeader>
                <CardTitle>Physical Attributes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Weight (kg)</Label>
                  <Input
                    {...register('weight', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="mt-2"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Length (cm)</Label>
                    <Input
                      {...register('length', { valueAsNumber: true })}
                      type="number"
                      step="0.1"
                      placeholder="0"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Width (cm)</Label>
                    <Input
                      {...register('width', { valueAsNumber: true })}
                      type="number"
                      step="0.1"
                      placeholder="0"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Height (cm)</Label>
                    <Input
                      {...register('height', { valueAsNumber: true })}
                      type="number"
                      step="0.1"
                      placeholder="0"
                      className="mt-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SEO Settings */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Meta Title</Label>
                  <Input
                    {...register('metaTitle')}
                    placeholder="SEO title (max 60 characters)"
                    maxLength={60}
                    className="mt-2"
                  />
                  <p className="mt-1 text-xs text-gray-500">Appears in search engine results</p>
                </div>

                <div>
                  <Label>Meta Description</Label>
                  <textarea
                    {...register('metaDescription')}
                    rows={3}
                    className="mt-2 w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    placeholder="SEO description (max 160 characters)"
                    maxLength={160}
                  />
                  <p className="mt-1 text-xs text-gray-500">Brief description for search engines</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Sticky Footer Actions */}
      <div className="sticky bottom-0 z-10 bg-white border-t-2 border-gray-200 p-6 -mx-6 -mb-6 mt-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              images.length === 0 ? 'bg-red-100' : 'bg-green-100'
            }`}>
              {images.length === 0 ? (
                <X className="w-5 h-5 text-red-600" />
              ) : (
                <Package className="w-5 h-5 text-green-600" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {images.length === 0 ? 'Images required' : 'Ready to save'}
              </p>
              <p className="text-xs text-gray-500">
                {images.length === 0 
                  ? 'Upload at least one product image' 
                  : `${images.length} image(s) uploaded • All required fields filled`
                }
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link href="/admin/products">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting || images.length === 0}
              className="gap-2 w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {mode === 'create' ? 'Create Product' : 'Update Product'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}

