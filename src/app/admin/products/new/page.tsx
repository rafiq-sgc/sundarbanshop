'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import AdminLayout from '@/components/admin/AdminLayout'
import ProductForm from '@/components/admin/ProductForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function AddProductPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (formData: any) => {
    setSaving(true)
    try {
      // ProductForm already handles all the mappings, just pass it through
      console.log('Creating product with data:', formData)

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success('Product created successfully!')
        
        // Redirect to edit page to add variants
        if (result.data && result.data._id) {
          toast.success('Redirecting to add variants...', { duration: 2000 })
          setTimeout(() => {
            router.push(`/admin/products/${result.data._id}/edit`)
          }, 1000)
        } else {
          router.push('/admin/products')
        }
      } else {
        toast.error(result.message || 'Failed to create product')
        if (result.errors) {
          result.errors.forEach((err: any) => {
            toast.error(`${err.field}: ${err.message}`)
          })
        }
      }
    } catch (error: any) {
      console.error('Error creating product:', error)
      toast.error(error.message || 'An error occurred while creating product')
    } finally {
      setSaving(false)
    }
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
              <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
              <p className="text-gray-600 mt-2">Create a new product listing for your store</p>
            </div>
          </div>
        </div>

        {/* Reusable Product Form */}
        <ProductForm
          mode="create"
          onSubmit={handleSubmit}
          isSubmitting={saving}
        />
      </div>
    </AdminLayout>
  )
}
