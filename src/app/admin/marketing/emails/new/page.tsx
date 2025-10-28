'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { ArrowLeft, Save, Mail, Users, Send } from 'lucide-react'
import Link from 'next/link'

export default function NewEmailCampaignPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    preheader: '',
    content: '',
    audience: 'all' as 'all' | 'vip' | 'new' | 'dormant',
    scheduleType: 'now' as 'now' | 'scheduled',
    scheduledAt: '',
    status: 'draft' as 'draft' | 'scheduled' | 'sent'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      router.push('/admin/marketing/emails')
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <Link href="/admin/marketing/emails" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Email Campaigns
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create Email Campaign</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Campaign Details</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Summer Sale 2024" className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Subject *</label>
                <input type="text" required value={formData.subject} onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))} placeholder="🌞 Summer Sale - Up to 50% Off!" className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preheader Text</label>
                <input type="text" value={formData.preheader} onChange={(e) => setFormData(prev => ({ ...prev, preheader: e.target.value }))} placeholder="Don't miss out on our biggest sale of the year" className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
                <p className="text-xs text-gray-500 mt-1">Preview text shown in email clients</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Content *</label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={12}
                  placeholder="Write your email content here..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-600" />
                Audience
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Send To</label>
                <select value={formData.audience} onChange={(e) => setFormData(prev => ({ ...prev, audience: e.target.value as any }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg">
                  <option value="all">All Customers</option>
                  <option value="vip">VIP Customers</option>
                  <option value="new">New Customers</option>
                  <option value="dormant">Dormant Customers</option>
                </select>
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Estimated Recipients:</strong> {
                    formData.audience === 'all' ? '1,247' :
                    formData.audience === 'vip' ? '145' :
                    formData.audience === 'new' ? '234' : '89'
                  } customers
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Schedule</h2>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center mb-3">
                    <input type="radio" checked={formData.scheduleType === 'now'} onChange={() => setFormData(prev => ({ ...prev, scheduleType: 'now' }))} className="w-4 h-4 text-primary-600" />
                    <span className="ml-2 text-sm text-gray-700">Send Now</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" checked={formData.scheduleType === 'scheduled'} onChange={() => setFormData(prev => ({ ...prev, scheduleType: 'scheduled' }))} className="w-4 h-4 text-primary-600" />
                    <span className="ml-2 text-sm text-gray-700">Schedule for Later</span>
                  </label>
                </div>

                {formData.scheduleType === 'scheduled' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Send Date & Time</label>
                    <input type="datetime-local" value={formData.scheduledAt} onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4">
            <button type="button" onClick={() => router.push('/admin/marketing/emails')} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center">
              {saving ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>Saving...</> : <><Send className="w-4 h-4 mr-2" />{formData.scheduleType === 'now' ? 'Send Campaign' : 'Schedule Campaign'}</>}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}

