'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import AdminLayout from '@/components/admin/AdminLayout'
import { DataTable } from '@/components/admin/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import {
  Truck,
  Plus,
  Edit,
  Trash2,
  Save,
  Package
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ShippingMethod {
  _id: string
  name: string
  description: string
  cost: number
  estimatedDays: string
  isActive: boolean
  icon: string
}

export default function ShippingSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [methods, setMethods] = useState<ShippingMethod[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'admin') {
      router.push('/auth/signin')
    } else {
      fetchMethods()
    }
  }, [session, status, router])

  const fetchMethods = async () => {
    setLoading(true)
    try {
      // Mock shipping methods
      const mockMethods: ShippingMethod[] = [
        {
          _id: '1',
          name: 'Standard Shipping',
          description: 'Delivery within 5-7 business days',
          cost: 5.99,
          estimatedDays: '5-7 days',
          isActive: true,
          icon: 'truck'
        },
        {
          _id: '2',
          name: 'Express Shipping',
          description: 'Fast delivery within 2-3 business days',
          cost: 14.99,
          estimatedDays: '2-3 days',
          isActive: true,
          icon: 'zap'
        },
        {
          _id: '3',
          name: 'Free Shipping',
          description: 'Free delivery for orders over $50',
          cost: 0,
          estimatedDays: '7-10 days',
          isActive: true,
          icon: 'gift'
        }
      ]

      setMethods(mockMethods)
    } catch (error) {
      console.error('Error fetching shipping methods:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleMethod = (methodId: string) => {
    setMethods(methods.map(m => 
      m._id === methodId ? { ...m, isActive: !m.isActive } : m
    ))
    toast.success('Shipping method updated')
  }

  const deleteMethod = (methodId: string) => {
    if (!confirm('Are you sure you want to delete this shipping method?')) return
    setMethods(methods.filter(m => m._id !== methodId))
    toast.success('Shipping method deleted')
  }

  const columns: ColumnDef<ShippingMethod>[] = [
    {
      accessorKey: 'name',
      header: 'Method',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Truck className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{row.original.name}</p>
            <p className="text-sm text-gray-500">{row.original.description}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'cost',
      header: 'Cost',
      cell: ({ row }) => (
        <span className="font-semibold text-gray-900">
          {row.original.cost === 0 ? 'Free' : `$${row.original.cost.toFixed(2)}`}
        </span>
      ),
    },
    {
      accessorKey: 'estimatedDays',
      header: 'Delivery Time',
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">{row.original.estimatedDays}</span>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <Button
          onClick={() => toggleMethod(row.original._id)}
          variant="ghost"
          size="sm"
        >
          <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
            {row.original.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </Button>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteMethod(row.original._id)}
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shipping Settings</h1>
            <p className="text-gray-600 mt-1">Configure shipping methods and rates</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Shipping Method
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shipping Methods</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{methods.length}</div>
              <p className="text-xs text-gray-500 mt-2">
                {methods.filter(m => m.isActive).length} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Shipping Cost</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(methods.reduce((sum, m) => sum + m.cost, 0) / methods.length).toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Free Shipping</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {methods.filter(m => m.cost === 0).length}
              </div>
              <p className="text-xs text-gray-500 mt-2">Methods available</p>
            </CardContent>
          </Card>
        </div>

        {/* Shipping Methods Table */}
        <Card>
          <CardHeader>
            <CardTitle>Shipping Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={methods}
              searchPlaceholder="Search shipping methods..."
            />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
