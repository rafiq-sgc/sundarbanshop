'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import AdminLayout from '@/components/admin/AdminLayout'
import { DataTable } from '@/components/admin/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import { 
  Eye, 
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  DollarSign,
  Users,
  UserPlus,
  TrendingUp,
  Filter,
  Download,
  Search,
  UserCheck,
  UserX,
  Star,
  Clock,
  Plus,
  MoreHorizontal
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import CustomerCreateModal from '@/components/admin/CustomerCreateModal'
import EmailComposerModal from '@/components/admin/EmailComposerModal'
import { customerService } from '@/services/customer'
import { toast } from 'react-hot-toast'

interface Customer {
  _id: string
  name: string
  email: string
  phone?: string
  address?: Array<{
    name: string
    phone: string
    address: string
    city: string
    state: string
    zipCode: string
    country: string
    isDefault: boolean
  }>
  isActive: boolean
  stats: {
    totalOrders: number
    totalSpent: number
    averageOrderValue: number
    lastOrderDate?: string
  }
  createdAt: string
}

export default function CustomersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [segmentFilter, setSegmentFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortByFilter, setSortByFilter] = useState<string>('createdAt')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [selectedCustomerForEmail, setSelectedCustomerForEmail] = useState<{ email: string; name: string } | null>(null)
  const [selectedCustomersForBulkEmail, setSelectedCustomersForBulkEmail] = useState<Array<{ email: string; name: string }>>([])
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([])
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    newThisMonth: 0,
    totalRevenue: 0
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'admin') {
      router.push('/auth/signin')
    } else {
      fetchCustomers()
    }
  }, [session, status, router])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      console.log('Fetching customers from API...')
      const response = await customerService.getAll({
        limit: 100,
        offset: 0,
        status: (statusFilter === 'active' || statusFilter === 'inactive') ? statusFilter as 'active' | 'inactive' : 'all',
        search: searchTerm,
        sortBy: sortByFilter,
        sortOrder: 'desc',
      })
      
      console.log('Customers fetched:', response)
      setCustomers(response.customers)
      setStats({
        total: response.stats.total,
        active: response.stats.active,
        newThisMonth: response.stats.newThisMonth,
        totalRevenue: response.stats.totalRevenue,
      })
    } catch (error: any) {
      console.error('Error fetching customers:', error)
      toast.error(error.message || 'Failed to fetch customers')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyFilters = () => {
    fetchCustomers()
  }

  const handleResetFilters = () => {
    setStatusFilter('all')
    setSortByFilter('createdAt')
    setSearchTerm('')
    // Fetch will be triggered by useEffect
  }

  const handleSelectionChange = (selected: Customer[]) => {
    console.log('Selected customers:', selected)
    setSelectedCustomers(selected)
  }

  const handleBulkEmail = () => {
    // Filter customers with email
    const recipientsWithEmail = selectedCustomers.filter(c => c.email)
    
    if (recipientsWithEmail.length === 0) {
      toast.error('No customers with email addresses selected')
      return
    }

    setSelectedCustomersForBulkEmail(
      recipientsWithEmail.map(c => ({
        email: c.email!,
        name: c.name
      }))
    )
    setSelectedCustomerForEmail(null) // Clear single recipient
    setShowEmailModal(true)
  }

  const handleSegmentEmail = (segment: string) => {
    // Get customers in this segment
    const segmentCustomers = customers.filter(customer => {
      if (segment === 'all') return true
      if (segment === 'active') return customer.isActive
      if (segment === 'inactive') return !customer.isActive
      return getCustomerSegment(customer) === segment
    })

    // Filter customers with email
    const recipientsWithEmail = segmentCustomers.filter(c => c.email)
    
    if (recipientsWithEmail.length === 0) {
      toast.error(`No customers with email in "${segment}" segment`)
      return
    }

    setSelectedCustomersForBulkEmail(
      recipientsWithEmail.map(c => ({
        email: c.email!,
        name: c.name
      }))
    )
    setSelectedCustomerForEmail(null) // Clear single recipient
    toast.success(`Preparing email for ${recipientsWithEmail.length} ${segment} customers`)
    setShowEmailModal(true)
  }

  // Refetch when filters change
  useEffect(() => {
    if (session && session.user.role === 'admin') {
      fetchCustomers()
    }
  }, [statusFilter, sortByFilter, searchTerm])

  const columns: ColumnDef<Customer>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
          className="w-4 h-4 rounded border-gray-300"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(!!e.target.checked)}
          className="w-4 h-4 rounded border-gray-300"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-gray-900">{row.original.name}</p>
          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
            <Mail className="w-3 h-3" />
            {row.original.email}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Contact',
      cell: ({ row }) => {
        const defaultAddress = row.original.address?.find(a => a.isDefault) || row.original.address?.[0]
        return (
          <div className="space-y-1">
            {row.original.phone && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Phone className="w-3 h-3" />
                {row.original.phone}
              </div>
            )}
            {defaultAddress && (
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <MapPin className="w-3 h-3" />
                {defaultAddress.city}, {defaultAddress.state}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'stats.totalOrders',
      header: 'Orders',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-gray-900">{row.original.stats.totalOrders}</span>
        </div>
      ),
    },
    {
      accessorKey: 'stats.totalSpent',
      header: 'Total Spent',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-600" />
          <span className="font-semibold text-gray-900">
            ${row.original.stats.totalSpent.toFixed(2)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'stats.lastOrderDate',
      header: 'Last Order',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {row.original.stats.lastOrderDate 
            ? format(new Date(row.original.stats.lastOrderDate), 'MMM dd, yyyy')
            : 'No orders yet'}
        </span>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
          {row.original.isActive ? 'Active' : 'Inactive'}
        </Badge>
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
              <Link href={`/admin/customers/${row.original._id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => {
                setSelectedCustomerForEmail({
                  email: row.original.email || '',
                  name: row.original.name
                })
                setShowEmailModal(true)
              }}
              disabled={!row.original.email}
            >
              <Mail className="mr-2 h-4 w-4" />
              Send Email
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  // Segmentation logic
  const getCustomerSegment = (customer: Customer) => {
    const daysSinceLastOrder = customer.stats.lastOrderDate 
      ? (Date.now() - new Date(customer.stats.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24)
      : Infinity
    
    if (customer.stats.totalOrders === 0) return 'new'
    if (customer.stats.totalSpent >= 1000 && customer.stats.totalOrders >= 10) return 'vip'
    if (customer.stats.totalOrders >= 5) return 'loyal'
    if (daysSinceLastOrder > 90) return 'dormant'
    if (customer.stats.totalOrders === 1) return 'one-time'
    return 'regular'
  }

  // Filter customers by segment
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (!matchesSearch) return false
    
    if (segmentFilter === 'all') return true
    return getCustomerSegment(customer) === segmentFilter
  })

  // Segment stats
  const segments = {
    all: customers.length,
    new: customers.filter(c => getCustomerSegment(c) === 'new').length,
    vip: customers.filter(c => getCustomerSegment(c) === 'vip').length,
    loyal: customers.filter(c => getCustomerSegment(c) === 'loyal').length,
    regular: customers.filter(c => getCustomerSegment(c) === 'regular').length,
    dormant: customers.filter(c => getCustomerSegment(c) === 'dormant').length,
    oneTime: customers.filter(c => getCustomerSegment(c) === 'one-time').length
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-600 mt-1">Manage your customer database</p>
          </div>
          <div className="flex gap-2">
            {selectedCustomers.length > 0 && (
              <Button 
                onClick={handleBulkEmail} 
                variant="outline"
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                <Mail className="mr-2 h-4 w-4" />
                Email Selected ({selectedCustomers.length})
              </Button>
            )}
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card 
            className="cursor-pointer hover:border-blue-500 transition-all"
            onClick={() => handleSegmentEmail('all')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-gray-500 mt-1">Click to email all</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:border-blue-500 transition-all"
            onClick={() => handleSegmentEmail('active')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
              <p className="text-xs text-gray-500 mt-1">Click to email active</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:border-blue-500 transition-all"
            onClick={() => handleSegmentEmail('new')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New This Month</CardTitle>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.newThisMonth}</div>
              <p className="text-xs text-gray-500 mt-1">Click to email new</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters & Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              {/* Search Input */}
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Search</label>
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Status Filter */}
              <div className="min-w-[180px]">
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By Filter */}
              <div className="min-w-[180px]">
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <Select value={sortByFilter} onValueChange={setSortByFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Recently Added</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button onClick={handleApplyFilters} disabled={loading}>
                  {loading ? 'Loading...' : 'Apply Filters'}
                </Button>
                <Button variant="outline" onClick={handleResetFilters} disabled={loading}>
                  Reset
                </Button>
              </div>
            </div>
            
            {/* Active Filters Display */}
            {(statusFilter !== 'all' || sortByFilter !== 'createdAt' || searchTerm) && (
              <div className="mt-4 flex flex-wrap gap-2 items-center">
                <span className="text-sm text-gray-600">Active filters:</span>
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="cursor-pointer" onClick={() => setStatusFilter('all')}>
                    Status: {statusFilter} ✕
                  </Badge>
                )}
                {sortByFilter !== 'createdAt' && (
                  <Badge variant="secondary" className="cursor-pointer" onClick={() => setSortByFilter('createdAt')}>
                    Sort: {sortByFilter} ✕
                  </Badge>
                )}
                {searchTerm && (
                  <Badge variant="secondary" className="cursor-pointer" onClick={() => setSearchTerm('')}>
                    Search: "{searchTerm}" ✕
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customers Table */}
        <DataTable
          columns={columns}
          data={filteredCustomers}
          searchPlaceholder="Search customers by name, email, or phone..."
          showRowSelection={true}
          onSelectionChange={handleSelectionChange}
          onExport={() => {
            console.log('Exporting customers...')
          }}
        />

        {/* Create Customer Modal */}
        <CustomerCreateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchCustomers() // Refresh the list
          }}
        />

        {/* Email Composer Modal */}
        <EmailComposerModal
          isOpen={showEmailModal}
          onClose={() => {
            setShowEmailModal(false)
            setSelectedCustomerForEmail(null)
            setSelectedCustomersForBulkEmail([])
          }}
          defaultRecipient={selectedCustomerForEmail || undefined}
          bulkRecipients={selectedCustomersForBulkEmail.length > 0 ? selectedCustomersForBulkEmail : undefined}
          onSuccess={() => {
            toast.success('Email sent successfully!')
            setSelectedCustomersForBulkEmail([])
          }}
        />
      </div>
    </AdminLayout>
  )
}
