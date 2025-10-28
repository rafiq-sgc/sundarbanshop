'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { ArrowLeft, Save, Upload, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function NewBannerPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [imagePreview, setImagePreview] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image: '',
    link: '',
    buttonText: '',
    position: 'hero' as 'hero' | 'middle' | 'bottom',
    device: 'all' as 'all' | 'desktop' | 'mobile' | 'tablet',
    order: 1,
    isActive: true,
    startDate: '',
    endDate: ''
  })

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
        setFormData(prev => ({ ...prev, image: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      router.push('/admin/content/banners')
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/admin/content/banners" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Banners
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create New Banner</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Banner Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                <input type="text" value={formData.subtitle} onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Link URL</label>
                <input type="url" value={formData.link} onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))} placeholder="/shop" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Button Text</label>
                <input type="text" value={formData.buttonText} onChange={(e) => setFormData(prev => ({ ...prev, buttonText: e.target.value }))} placeholder="Shop Now" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Banner Image *</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {imagePreview ? (
                  <div className="relative w-full h-64 rounded-lg overflow-hidden mb-3">
                    <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                  </div>
                ) : (
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                )}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="image-upload" />
                <label htmlFor="image-upload" className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  {imagePreview ? 'Change Image' : 'Upload Image'}
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Display Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                <select value={formData.position} onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value as any }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                  <option value="hero">Hero Section</option>
                  <option value="middle">Middle Section</option>
                  <option value="bottom">Bottom Section</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Device</label>
                <select value={formData.device} onChange={(e) => setFormData(prev => ({ ...prev, device: e.target.value as any }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                  <option value="all">All Devices</option>
                  <option value="desktop">Desktop Only</option>
                  <option value="mobile">Mobile Only</option>
                  <option value="tablet">Tablet Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                <input type="number" min="1" value={formData.order} onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4">
            <button type="button" onClick={() => router.push('/admin/content/banners')} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center">
              {saving ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>Saving...</> : <><Save className="w-4 h-4 mr-2" />Create Banner</>}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}

