'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import AdminLayout from '@/components/admin/AdminLayout'
import { DataTable } from '@/components/admin/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  MessageSquare,
  Clock
} from 'lucide-react'
import { format } from 'date-fns'
import Image from 'next/image'

interface Review {
  _id: string
  product: {
    name: string
    image: string
  }
  customer: {
    name: string
    email: string
  }
  rating: number
  title: string
  comment: string
  isApproved: boolean
  helpful: number
  notHelpful: number
  createdAt: string
}

export default function ReviewsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'admin') {
      router.push('/auth/signin')
    } else {
      fetchReviews()
    }
  }, [session, status, router])

  const fetchReviews = async () => {
    setLoading(true)
    try {
      // Mock reviews data
      const mockReviews: Review[] = [
        {
          _id: '1',
          product: {
            name: 'Organic Fresh Milk',
            image: '/images/products/product-1.jpg'
          },
          customer: {
            name: 'John Doe',
            email: 'john@example.com'
          },
          rating: 5,
          title: 'Excellent product!',
          comment: 'Very fresh and high quality. Will buy again!',
          isApproved: true,
          helpful: 12,
          notHelpful: 1,
          createdAt: new Date().toISOString()
        },
        {
          _id: '2',
          product: {
            name: 'Free Range Eggs',
            image: '/images/products/product-2.jpg'
          },
          customer: {
            name: 'Jane Smith',
            email: 'jane@example.com'
          },
          rating: 4,
          title: 'Good quality',
          comment: 'Fresh eggs, delivered quickly. One egg was broken though.',
          isApproved: false,
          helpful: 5,
          notHelpful: 2,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        }
      ]

      setReviews(mockReviews)
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const approveReview = (reviewId: string) => {
    setReviews(reviews.map(r => 
      r._id === reviewId ? { ...r, isApproved: true } : r
    ))
  }

  const deleteReview = (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return
    setReviews(reviews.filter(r => r._id !== reviewId))
  }

  const columns: ColumnDef<Review>[] = [
    {
      id: 'product',
      header: 'Product',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Image
            src={row.original.product.image}
            alt={row.original.product.name}
            width={40}
            height={40}
            className="rounded-lg"
          />
          <p className="font-medium text-gray-900 text-sm">{row.original.product.name}</p>
        </div>
      ),
    },
    {
      accessorKey: 'customer',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-gray-900 text-sm">{row.original.customer.name}</p>
          <p className="text-xs text-gray-500">{row.original.customer.email}</p>
        </div>
      ),
    },
    {
      accessorKey: 'rating',
      header: 'Rating',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < row.original.rating
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          ))}
          <span className="ml-1 text-sm font-medium text-gray-900">{row.original.rating}.0</span>
        </div>
      ),
    },
    {
      accessorKey: 'comment',
      header: 'Review',
      cell: ({ row }) => (
        <div className="max-w-md">
          <p className="font-medium text-gray-900 text-sm mb-1">{row.original.title}</p>
          <p className="text-sm text-gray-600 line-clamp-2">{row.original.comment}</p>
        </div>
      ),
    },
    {
      accessorKey: 'helpful',
      header: 'Helpful',
      cell: ({ row }) => (
        <div className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1 text-green-600">
            <ThumbsUp className="w-4 h-4" />
            {row.original.helpful}
          </span>
          <span className="flex items-center gap-1 text-red-600">
            <ThumbsDown className="w-4 h-4" />
            {row.original.notHelpful}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'isApproved',
      header: 'Status',
      cell: ({ row }) => (
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
          row.original.isApproved
            ? 'bg-green-100 text-green-700'
            : 'bg-yellow-100 text-yellow-700'
        }`}>
          {row.original.isApproved ? 'Approved' : 'Pending'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {!row.original.isApproved && (
            <button
              onClick={() => approveReview(row.original._id)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Approve"
            >
              <CheckCircle className="w-4 h-4 text-green-600" />
            </button>
          )}
          <button
            onClick={() => deleteReview(row.original._id)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      ),
    },
  ]

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
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Reviews</h1>
          <p className="text-gray-600 mt-1">Manage customer reviews and ratings</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="p-3 bg-blue-100 rounded-lg w-fit mb-3">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Reviews</h3>
            <p className="text-3xl font-bold text-gray-900">{reviews.length}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="p-3 bg-green-100 rounded-lg w-fit mb-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Approved</h3>
            <p className="text-3xl font-bold text-gray-900">
              {reviews.filter(r => r.isApproved).length}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="p-3 bg-yellow-100 rounded-lg w-fit mb-3">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Pending</h3>
            <p className="text-3xl font-bold text-gray-900">
              {reviews.filter(r => !r.isApproved).length}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="p-3 bg-purple-100 rounded-lg w-fit mb-3">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Avg Rating</h3>
            <p className="text-3xl font-bold text-gray-900">
              {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-wrap gap-4">
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
              <option value="">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>

            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>

            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Apply Filters
            </button>
          </div>
        </div>

        {/* Reviews Table */}
        <DataTable
          columns={columns}
          data={reviews}
          searchPlaceholder="Search reviews by product, customer, or content..."
        />
      </div>
    </AdminLayout>
  )
}
