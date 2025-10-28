'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import AdminLayout from '@/components/admin/AdminLayout'
import { Award, Users, Star, Settings, Plus } from 'lucide-react'

export default function LoyaltyProgramPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'admin') {
      router.push('/auth/signin')
    } else {
      setLoading(false)
    }
  }, [session, status, router])

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Loyalty Program</h1>
            <p className="text-gray-600 mt-1">Manage rewards and customer loyalty</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Settings className="w-5 h-5" />
              Settings
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              <Plus className="w-5 h-5" />
              Add Member
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="p-3 bg-blue-100 rounded-lg w-fit mb-3">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Total Members</h3>
            <p className="text-3xl font-bold">4</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="p-3 bg-yellow-100 rounded-lg w-fit mb-3">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Total Points</h3>
            <p className="text-3xl font-bold">12,300</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="p-3 bg-purple-100 rounded-lg w-fit mb-3">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Active Tiers</h3>
            <p className="text-3xl font-bold">4</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="p-3 bg-green-100 rounded-lg w-fit mb-3">
              <Award className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Rewards Redeemed</h3>
            <p className="text-3xl font-bold">28</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border-2 border-orange-200 p-6">
            <h3 className="text-lg font-bold text-orange-900 mb-4">🥉 Bronze</h3>
            <div className="space-y-2 text-sm text-orange-700">
              <p>• 0-499 points</p>
              <p>• 10 pts per $1</p>
              <p>• Birthday: 50 pts</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-300 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">🥈 Silver</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>• 500-1,499 points</p>
              <p>• 12 pts per $1</p>
              <p>• 5% discount</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border-2 border-yellow-300 p-6">
            <h3 className="text-lg font-bold text-yellow-900 mb-4">🥇 Gold</h3>
            <div className="space-y-2 text-sm text-yellow-700">
              <p>• 1,500-4,999 points</p>
              <p>• 15 pts per $1</p>
              <p>• 10% discount</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-300 p-6">
            <h3 className="text-lg font-bold text-purple-900 mb-4">💎 Platinum</h3>
            <div className="space-y-2 text-sm text-purple-700">
              <p>• 5,000+ points</p>
              <p>• 20 pts per $1</p>
              <p>• 15% + VIP perks</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
