'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import AdminLayout from '@/components/admin/AdminLayout'
import { DataTable } from '@/components/admin/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import {
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  RefreshCcw
} from 'lucide-react'
import { format } from 'date-fns'

interface Refund {
  _id: string
  orderNumber: string
  customer: {
    name: string
    email: string
  }
  amount: number
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'processed'
  requestedAt: string
  processedAt?: string
}

export default function RefundsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'admin') {
      router.push('/auth/signin')
    } else {
      fetchRefunds()
    }
  }, [session, status, router])

  const fetchRefunds = async () => {
    setLoading(true)
    try {
      // Mock refunds data
      const mockRefunds: Refund[] = [
        {
          _id: '1',
          orderNumber: 'ORD-045',
          customer: {
            name: 'John Doe',
            email: 'john@example.com'
          },
          amount: 45.99,
          reason: 'Damaged product',
          status: 'pending',
          requestedAt: new Date().toISOString()
        },
        {
          _id: '2',
          orderNumber: 'ORD-034',
          customer: {
            name: 'Jane Smith',
            email: 'jane@example.com'
          },
          amount: 89.50,
          reason: 'Wrong item delivered',
          status: 'approved',
          requestedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        }
      ]

      setRefunds(mockRefunds)
    } catch (error) {
      console.error('Error fetching refunds:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'approved':
        return 'bg-blue-100 text-blue-700'
      case 'processed':
        return 'bg-green-100 text-green-700'
      case 'rejected':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const columns: ColumnDef<Refund>[] = [
    {
      accessorKey: 'orderNumber',
      header: 'Order #',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-gray-900">{row.original.orderNumber}</p>
          <p className="text-xs text-gray-500">
            {format(new Date(row.original.requestedAt), 'MMM dd, yyyy')}
          </p>
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
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-600" />
          <span className="font-semibold text-gray-900">${row.original.amount.toFixed(2)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'reason',
      header: 'Reason',
      cell: ({ row }) => (
        <p className="text-sm text-gray-700 max-w-xs truncate">{row.original.reason}</p>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(row.original.status)}`}>
          {row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => console.log('View refund:', row.original._id)}
            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs"
          >
            View
          </button>
          {row.original.status === 'pending' && (
            <>
              <button
                onClick={() => console.log('Approve:', row.original._id)}
                className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs"
              >
                Approve
              </button>
              <button
                onClick={() => console.log('Reject:', row.original._id)}
                className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs"
              >
                Reject
              </button>
            </>
          )}
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
          <h1 className="text-2xl font-bold text-gray-900">Refund Management</h1>
          <p className="text-gray-600 mt-1">Process and track refund requests</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="p-3 bg-blue-100 rounded-lg w-fit mb-3">
              <RefreshCcw className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Refunds</h3>
            <p className="text-3xl font-bold text-gray-900">{refunds.length}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="p-3 bg-yellow-100 rounded-lg w-fit mb-3">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Pending</h3>
            <p className="text-3xl font-bold text-gray-900">
              {refunds.filter(r => r.status === 'pending').length}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="p-3 bg-green-100 rounded-lg w-fit mb-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Processed</h3>
            <p className="text-3xl font-bold text-gray-900">
              {refunds.filter(r => r.status === 'processed').length}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="p-3 bg-green-100 rounded-lg w-fit mb-3">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Amount</h3>
            <p className="text-3xl font-bold text-gray-900">
              ${refunds.reduce((sum, r) => sum + r.amount, 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-wrap gap-4">
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="processed">Processed</option>
              <option value="rejected">Rejected</option>
            </select>

            <input
              type="date"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />

            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Apply Filters
            </button>
          </div>
        </div>

        {/* Refunds Table */}
        <DataTable
          columns={columns}
          data={refunds}
          searchPlaceholder="Search refunds by order number or customer..."
        />
      </div>
    </AdminLayout>
  )
}
