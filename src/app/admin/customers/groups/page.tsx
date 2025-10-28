'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import AdminLayout from '@/components/admin/AdminLayout'
import { DataTable } from '@/components/admin/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import {
  Users,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Tag,
  TrendingUp,
  DollarSign,
  Percent,
  Calendar
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'react-hot-toast'

interface CustomerGroup {
  _id: string
  name: string
  description: string
  customerCount: number
  totalRevenue: number
  avgOrderValue: number
  discountPercent: number
  color: string
  createdAt: string
  benefits: string[]
}

export default function CustomerGroupsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [groups, setGroups] = useState<CustomerGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalGroups: 0,
    totalCustomers: 0,
    averageGroupSize: 0,
    totalRevenue: 0
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'admin') {
      router.push('/auth/signin')
    } else {
      fetchGroups()
    }
  }, [session, status, router])

  const fetchGroups = async () => {
    setLoading(true)
    try {
      // Mock data for demonstration
      const mockGroups: CustomerGroup[] = [
        {
          _id: '1',
          name: 'VIP Customers',
          description: 'High-value customers with premium benefits',
          customerCount: 45,
          totalRevenue: 125000.50,
          avgOrderValue: 2777.78,
          discountPercent: 15,
          color: 'purple',
          createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
          benefits: ['Free shipping', '15% discount', 'Priority support', 'Early access']
        },
        {
          _id: '2',
          name: 'Regular Customers',
          description: 'Standard customer tier',
          customerCount: 342,
          totalRevenue: 285000.75,
          avgOrderValue: 833.33,
          discountPercent: 5,
          color: 'blue',
          createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
          benefits: ['5% discount', 'Standard support']
        },
        {
          _id: '3',
          name: 'New Customers',
          description: 'First-time buyers',
          customerCount: 128,
          totalRevenue: 45000.25,
          avgOrderValue: 351.56,
          discountPercent: 10,
          color: 'green',
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          benefits: ['Welcome discount', 'Free first shipping']
        },
        {
          _id: '4',
          name: 'Wholesale',
          description: 'Bulk buyers and business customers',
          customerCount: 23,
          totalRevenue: 180000.00,
          avgOrderValue: 7826.09,
          discountPercent: 20,
          color: 'orange',
          createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
          benefits: ['20% discount', 'Net 30 payment terms', 'Dedicated account manager']
        }
      ]

      setGroups(mockGroups)

      // Calculate stats
      const totalGroups = mockGroups.length
      const totalCustomers = mockGroups.reduce((sum, g) => sum + g.customerCount, 0)
      const averageGroupSize = Math.round(totalCustomers / totalGroups)
      const totalRevenue = mockGroups.reduce((sum, g) => sum + g.totalRevenue, 0)

      setStats({ totalGroups, totalCustomers, averageGroupSize, totalRevenue })
    } catch (error) {
      console.error('Error fetching groups:', error)
      toast.error('Failed to fetch customer groups')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (confirm('Are you sure you want to delete this customer group?')) {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500))
        
        setGroups(groups.filter(g => g._id !== groupId))
        toast.success('Customer group deleted successfully')
      } catch (error) {
        console.error('Error deleting group:', error)
        toast.error('Failed to delete customer group')
      }
    }
  }

  const getColorClasses = (color: string) => {
    const colors: { [key: string]: { badge: string; bg: string; text: string } } = {
      purple: { badge: 'bg-purple-100 text-purple-700', bg: 'bg-purple-500', text: 'text-purple-600' },
      blue: { badge: 'bg-blue-100 text-blue-700', bg: 'bg-blue-500', text: 'text-blue-600' },
      green: { badge: 'bg-green-100 text-green-700', bg: 'bg-green-500', text: 'text-green-600' },
      orange: { badge: 'bg-orange-100 text-orange-700', bg: 'bg-orange-500', text: 'text-orange-600' },
      red: { badge: 'bg-red-100 text-red-700', bg: 'bg-red-500', text: 'text-red-600' }
    }
    return colors[color] || colors.blue
  }

  const columns: ColumnDef<CustomerGroup>[] = [
    {
      accessorKey: 'name',
      header: 'Group Name',
      cell: ({ row }) => {
        const colorClasses = getColorClasses(row.original.color)
        return (
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${colorClasses.bg}`} />
            <div>
              <p className="font-medium text-gray-900">{row.original.name}</p>
              <p className="text-sm text-gray-500">{row.original.description}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'customerCount',
      header: 'Customers',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-gray-900">{row.original.customerCount}</span>
        </div>
      ),
    },
    {
      accessorKey: 'totalRevenue',
      header: 'Total Revenue',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-600" />
          <span className="font-semibold text-gray-900">
            ${row.original.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'avgOrderValue',
      header: 'Avg Order Value',
      cell: ({ row }) => (
        <span className="text-gray-900">
          ${row.original.avgOrderValue.toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: 'discountPercent',
      header: 'Discount',
      cell: ({ row }) => (
        <Badge variant="secondary">
          <Percent className="w-3 h-3 mr-1" />
          {row.original.discountPercent}%
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {format(new Date(row.original.createdAt), 'MMM dd, yyyy')}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/admin/customers?group=${row.original._id}`}>
                <Users className="mr-2 h-4 w-4" />
                View Customers
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/admin/customers/groups/${row.original._id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Group
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDeleteGroup(row.original._id)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Group
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
            <h1 className="text-2xl font-bold text-gray-900">Customer Groups</h1>
            <p className="text-gray-600 mt-1">Organize and manage your customer segments</p>
          </div>
          <Button asChild>
            <Link href="/admin/customers/groups/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Group
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalGroups}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Group Size</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageGroupSize}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Groups Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {groups.map((group) => {
            const colorClasses = getColorClasses(group.color)
            return (
              <Card key={group._id} className="overflow-hidden">
                <div className={`h-2 ${colorClasses.bg}`} />
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>{group.name}</span>
                    <Badge variant="secondary">{group.customerCount}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{group.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Revenue:</span>
                      <span className="font-semibold text-green-600">
                        ${group.totalRevenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Discount:</span>
                      <span className="font-semibold">{group.discountPercent}%</span>
                    </div>
                  </div>

                  {group.benefits.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-500 mb-2">Benefits:</p>
                      <div className="flex flex-wrap gap-1">
                        {group.benefits.slice(0, 2).map((benefit, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {benefit}
                          </Badge>
                        ))}
                        {group.benefits.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{group.benefits.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <Button asChild size="sm" variant="outline" className="flex-1">
                      <Link href={`/admin/customers?group=${group._id}`}>
                        View
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="flex-1">
                      <Link href={`/admin/customers/groups/${group._id}/edit`}>
                        Edit
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Groups Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Customer Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={groups}
              searchPlaceholder="Search customer groups..."
              onExport={() => {
                console.log('Exporting customer groups...')
                toast.success('Exporting customer groups...')
              }}
            />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}

