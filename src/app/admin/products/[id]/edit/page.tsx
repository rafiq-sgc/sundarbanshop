'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import AdminLayout from '@/components/admin/AdminLayout'
import ProductForm, { type ProductFormData } from '@/components/admin/ProductForm'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function EditProductPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [initialData, setInitialData] = useState<Partial<ProductFormData> | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchProduct()
    }
  }, [params.id])

  const fetchProduct = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/products/${params.id}`)
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        toast.error(data.message || 'Failed to load product')
        router.push('/admin/products')
        return
      }

      const product = data.data
      
      // Prepare form data
      const formData: Partial<ProductFormData> = {
        name: product.name || '',
        slug: product.slug || '',
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        category: product.category?._id || product.category || '',
        price: product.price || 0,
        comparePrice: product.comparePrice || 0,
        cost: product.cost || 0,
        salePrice: product.salePrice || 0,
        quantity: product.stock || product.quantity || 0,
        sku: product.sku || '',
        barcode: product.barcode || '',
        weight: product.weight || 0,
        length: product.length || 0,
        width: product.width || 0,
        height: product.height || 0,
        isActive: product.isActive !== undefined ? product.isActive : true,
        isFeatured: product.featured || product.isFeatured || false,
        isOnSale: product.isOnSale || false,
        metaTitle: product.metaTitle || '',
        metaDescription: product.metaDescription || '',
        images: product.images || [],
        tags: product.tags || [] // Add tags
      }
      
      console.log('Prepared formData for ProductForm:', formData)
      
      setInitialData(formData)
    } catch (error) {
      console.error('Error fetching product:', error)
      toast.error('Failed to load product. Please try again.')
      router.push('/admin/products')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (formData: any) => {
    console.log('Edit page handleSubmit called!')
    console.log('FormData received:', formData)
    
    setSaving(true)
    try {
      // ProductForm already handles all the mappings, just pass it through
      console.log('Sending PUT request to:', `/api/admin/products/${params.id}`)
      console.log('Request body:', JSON.stringify(formData, null, 2))

      const response = await fetch(`/api/admin/products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      console.log('Response status:', response.status, response.ok)
      const result = await response.json()
      console.log('Response data:', result)

      if (response.ok && result.success) {
        toast.success('Product updated successfully!')
        // Stay on edit page instead of redirecting, so user can continue managing variants
        await fetchProduct() // Refresh data
      } else {
        toast.error(result.message || 'Failed to update product')
        if (result.errors) {
          result.errors.forEach((err: any) => {
            toast.error(`${err.field}: ${err.message}`)
          })
        }
      }
    } catch (error: any) {
      console.error('Error updating product:', error)
      toast.error(error.message || 'An error occurred while updating product')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading product...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/products"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
              <p className="text-gray-600 mt-2">Update product information and manage variants</p>
            </div>
          </div>
        </div>

        {/* Reusable Product Form */}
        {initialData && (
          <ProductForm
            mode="edit"
            productId={params.id as string}
            initialData={initialData}
            onSubmit={handleSubmit}
            isSubmitting={saving}
          />
        )}
      </div>
    </AdminLayout>
  )
}
