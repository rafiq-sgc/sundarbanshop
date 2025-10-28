'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { ArrowLeft, Save, Gift, Mail, DollarSign } from 'lucide-react'
import Link from 'next/link'

export default function NewGiftCardPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    initialValue: '',
    issuedTo: '',
    expiresAt: '',
    autoGenerate: true
  })

  const generateCode = () => {
    const code = 'GIFT-' + new Date().getFullYear() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase()
    setFormData(prev => ({ ...prev, code }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (formData.autoGenerate && !formData.code) {
        generateCode()
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
      router.push('/admin/marketing/gift-cards')
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
          <Link href="/admin/marketing/gift-cards" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Gift Cards
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Issue New Gift Card</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Gift Card Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gift Card Value ($) *</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={formData.initialValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, initialValue: e.target.value }))}
                    className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={formData.issuedTo}
                    onChange={(e) => setFormData(prev => ({ ...prev, issuedTo: e.target.value }))}
                    placeholder="customer@example.com"
                    className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.autoGenerate}
                    onChange={(e) => setFormData(prev => ({ ...prev, autoGenerate: e.target.checked }))}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Auto-generate gift card code</span>
                </label>
              </div>

              {!formData.autoGenerate && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Custom Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="GIFT-CUSTOM-CODE"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono uppercase"
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date *</label>
                <input
                  type="date"
                  required
                  value={formData.expiresAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4">
            <button type="button" onClick={() => router.push('/admin/marketing/gift-cards')} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center">
              {saving ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>Issuing...</> : <><Gift className="w-4 h-4 mr-2" />Issue Gift Card</>}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}

