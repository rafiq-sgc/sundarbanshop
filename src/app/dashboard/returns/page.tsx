'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { RotateCcw, Package, Upload } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function ReturnsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedOrder, setSelectedOrder] = useState('')
  const [returnReason, setReturnReason] = useState('')
  const [comments, setComments] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/dashboard/returns')
    }
  }, [status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    setTimeout(() => {
      toast.success('Return request submitted successfully!')
      setSelectedOrder('')
      setReturnReason('')
      setComments('')
      setLoading(false)
    }, 1000)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container py-8"><div className="animate-pulse h-96 bg-gray-200 rounded-lg"></div></div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container py-12">
        <nav className="mb-6 text-sm text-gray-600">
          <ol className="flex items-center space-x-2">
            <li><Link href="/" className="hover:text-green-600">Home</Link></li>
            <li>/</li>
            <li><Link href="/dashboard" className="hover:text-green-600">Dashboard</Link></li>
            <li>/</li>
            <li className="text-gray-900">Returns</li>
          </ol>
        </nav>

        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <RotateCcw className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Request a Return</h1>
            <p className="text-gray-600">We offer a 30-day return policy. Fill out the form below to initiate a return.</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Order *
                </label>
                <select
                  value={selectedOrder}
                  onChange={(e) => setSelectedOrder(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Choose an order...</option>
                  <option value="ORD-105">Order #ORD-105 - $89.99 (Sep 28, 2025)</option>
                  <option value="ORD-104">Order #ORD-104 - $45.50 (Sep 25, 2025)</option>
                  <option value="ORD-103">Order #ORD-103 - $123.00 (Sep 20, 2025)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Return *
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select a reason...</option>
                  <option value="defective">Defective or damaged product</option>
                  <option value="wrong">Wrong item received</option>
                  <option value="size">Size/color not as expected</option>
                  <option value="quality">Quality not as expected</option>
                  <option value="notneeded">No longer needed</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Comments
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                  placeholder="Tell us more about the issue..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Photos (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-1">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                  <input type="file" multiple accept="image/*" className="hidden" />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Return Process:</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Submit return request</li>
                  <li>Receive return label via email (1-2 business days)</li>
                  <li>Pack items securely</li>
                  <li>Ship using provided label</li>
                  <li>Refund processed within 5-7 days after receipt</li>
                </ol>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-4 rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Return Request'}
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
