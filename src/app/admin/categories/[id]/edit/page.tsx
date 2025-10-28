'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import AdminLayout from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Save, Upload, Folder } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'react-hot-toast'

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  image: z.string().optional(),
  parent: z.string().optional(),
  sortOrder: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional()
})

type CategoryFormData = z.infer<typeof categorySchema>

export default function EditCategoryPage() {
  const router = useRouter()
  const params = useParams()
  const categoryId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [imagePreview, setImagePreview] = useState('')
  const [categories, setCategories] = useState<Array<{ _id: string; name: string }>>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema) as any,
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      image: '',
      parent: '',
      sortOrder: 0,
      isActive: true,
      metaTitle: '',
      metaDescription: ''
    }
  })

  const { control, handleSubmit, setValue, watch, reset, formState: { isSubmitting } } = form
  const formData = watch()

  useEffect(() => {
    fetchCategory()
    fetchCategories()
  }, [categoryId])

  const fetchCategory = async () => {
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`)
      const data = await response.json()
      
      if (data.success) {
        const category = data.data
        reset({
          name: category.name,
          slug: category.slug,
          description: category.description || '',
          image: category.image || '',
          parent: category.parent?._id || '',
          sortOrder: category.sortOrder || 0,
          isActive: category.isActive !== false,
          metaTitle: category.metaTitle || '',
          metaDescription: category.metaDescription || ''
        })
        
        if (category.image) {
          setImagePreview(category.image)
        }
      } else {
        toast.error('Failed to load category')
        router.push('/admin/categories')
      }
    } catch (error) {
      console.error('Error fetching category:', error)
      toast.error('Failed to load category')
      router.push('/admin/categories')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories?status=active')
      const data = await response.json()
      if (data.success) {
        setCategories(data.data.filter((cat: any) => cat._id !== categoryId))
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoadingCategories(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only images are allowed.')
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('File size too large. Maximum 5MB allowed.')
      return
    }

    try {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        setValue('image', result.data.url)
        toast.success('Image uploaded successfully!')
      } else {
        toast.error(result.message || 'Failed to upload image')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload image')
    }
  }

  const onSubmit = async (data: CategoryFormData) => {
    setSaving(true)

    try {
      const categoryData = {
        name: data.name,
        slug: data.slug,
        description: data.description || undefined,
        image: data.image || undefined,
        parent: data.parent || null,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
        metaTitle: data.metaTitle || undefined,
        metaDescription: data.metaDescription || undefined
      }

      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData)
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Category updated successfully!')
        router.push('/admin/categories')
      } else {
        toast.error(result.message || 'Failed to update category')
      }
    } catch (error) {
      console.error('Error updating category:', error)
      toast.error('An error occurred while updating category')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/categories">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Category</h1>
            <p className="text-gray-600">Update category information</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Category Details */}
            <Card>
              <CardHeader>
                <CardTitle>Category Details</CardTitle>
                <CardDescription>Basic information about the category</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category Name <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter category name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Slug <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="category-slug" className="font-mono text-sm" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          rows={3}
                          placeholder="Category description..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name="parent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Category</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value === 'none' ? '' : value)} 
                          value={field.value || 'none'} 
                          disabled={loadingCategories}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={loadingCategories ? 'Loading...' : 'None (Top Level)'} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None (Top Level)</SelectItem>
                            {categories.map((category) => (
                              <SelectItem key={category._id} value={category._id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="sortOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sort Order</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Active
                        </FormLabel>
                        <p className="text-sm text-gray-500">
                          Make this category visible in the store
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Category Image */}
            <Card>
              <CardHeader>
                <CardTitle>Category Image</CardTitle>
                <CardDescription>Upload an image for this category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {imagePreview ? (
                    <div className="relative w-32 h-32 mx-auto rounded-lg overflow-hidden mb-3">
                      <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                    </div>
                  ) : (
                    <Folder className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="image-upload" />
                  <Button type="button" variant="outline" asChild>
                    <label htmlFor="image-upload" className="cursor-pointer flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      {imagePreview ? 'Change Image' : 'Upload Image'}
                    </label>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* SEO Settings */}
            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
                <CardDescription>Optimize for search engines</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={control}
                  name="metaTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="SEO title (max 60 characters)" maxLength={60} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="metaDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Description</FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          rows={3}
                          placeholder="SEO description (max 160 characters)"
                          maxLength={160}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/categories">Cancel</Link>
              </Button>
              <Button
                type="submit"
                disabled={saving || isSubmitting}
                className="flex items-center gap-2"
              >
                {saving || isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Update Category
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  )
}
