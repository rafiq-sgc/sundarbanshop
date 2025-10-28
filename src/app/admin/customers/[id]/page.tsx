'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { ArrowLeft, Mail, Phone, MapPin, ShoppingBag, DollarSign, Calendar, User, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { customerService, type CustomerWithStats } from '@/services/customer'
import { toast } from 'react-hot-toast'

export default function CustomerDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [customerData, setCustomerData] = useState<CustomerWithStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'admin') {
      router.push('/auth/signin')
    } else {
      fetchCustomerDetails()
    }
  }, [session, status, router, id])

  const fetchCustomerDetails = async () => {
    setLoading(true)
    try {
      console.log('Fetching customer details for ID:', id)
      const response = await customerService.getById(id)
      console.log('Customer details fetched:', response)
      setCustomerData(response.customer)
      setRecentOrders(response.recentOrders || [])
    } catch (error: any) {
      console.error('Error fetching customer details:', error)
      toast.error(error.message || 'Failed to fetch customer details')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!customerData) return
    
    try {
      await customerService.toggleStatus(id)
      toast.success(`Customer ${customerData.isActive ? 'deactivated' : 'activated'} successfully`)
      fetchCustomerDetails() // Refresh data
    } catch (error: any) {
      console.error('Error toggling customer status:', error)
      toast.error(error.message || 'Failed to toggle customer status')
    }
  }

  const handleDelete = async () => {
    if (!customerData) return
    
    const confirmed = confirm('Are you sure you want to delete this customer? This action cannot be undone.')
    if (!confirmed) return
    
    try {
      await customerService.delete(id)
      toast.success('Customer deleted successfully')
      router.push('/admin/customers')
    } catch (error: any) {
      console.error('Error deleting customer:', error)
      toast.error(error.message || 'Failed to delete customer')
    }
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

  if (!customerData) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Customer Not Found</h2>
          <p className="text-gray-600 mb-4">The customer you're looking for doesn't exist.</p>
          <Link href="/admin/customers">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Customers
            </Button>
          </Link>
        </div>
      </AdminLayout>
    )
  }

  const defaultAddress = customerData.address?.find(a => a.isDefault) || customerData.address?.[0]

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin/customers">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Customers
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">Customer Details</h1>
            <p className="text-gray-600 mt-1">View and manage customer information</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleToggleStatus}>
              {customerData.isActive ? (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Deactivate
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Activate
                </>
              )}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Customer Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-semibold text-gray-900">{customerData.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <a href={`mailto:${customerData.email}`} className="text-blue-600 hover:underline">
                    {customerData.email}
                  </a>
                </div>
              </div>
              {customerData.phone && (
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <p className="font-medium text-gray-900">{customerData.phone}</p>
                  </div>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge variant={customerData.isActive ? 'default' : 'secondary'}>
                  {customerData.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Member Since</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <p className="font-medium text-gray-900">
                    {format(new Date(customerData.createdAt), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
              {customerData.lastLogin && (
                <div>
                  <p className="text-sm text-gray-500">Last Login</p>
                  <p className="font-medium text-gray-900">
                    {format(new Date(customerData.lastLogin), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              {defaultAddress ? (
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900">{defaultAddress.name}</p>
                  <p className="text-sm text-gray-600">{defaultAddress.address}</p>
                  <p className="text-sm text-gray-600">
                    {defaultAddress.city}, {defaultAddress.state} {defaultAddress.zipCode}
                  </p>
                  <p className="text-sm text-gray-600">{defaultAddress.country}</p>
                  <p className="text-sm text-gray-600">Phone: {defaultAddress.phone}</p>
                </div>
              ) : (
                <p className="text-gray-500">No address on file</p>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Total Orders</p>
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-blue-600" />
                  <p className="text-2xl font-bold text-gray-900">{customerData.stats.totalOrders}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Spent</p>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <p className="text-2xl font-bold text-gray-900">
                    ${customerData.stats.totalSpent.toFixed(2)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Average Order Value</p>
                <p className="text-xl font-semibold text-gray-900">
                  ${customerData.stats.averageOrderValue.toFixed(2)}
                </p>
              </div>
              {customerData.stats.lastOrderDate && (
                <div>
                  <p className="text-sm text-gray-500">Last Order</p>
                  <p className="font-medium text-gray-900">
                    {format(new Date(customerData.stats.lastOrderDate), 'MMM dd, yyyy')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order._id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <Link
                        href={`/admin/orders/${order._id}`}
                        className="font-semibold text-blue-600 hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                      <p className="text-sm text-gray-500">
                        {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">${order.total.toFixed(2)}</p>
                      <Badge
                        variant={
                          order.status === 'delivered'
                            ? 'default'
                            : order.status === 'cancelled'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No orders yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
