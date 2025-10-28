'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import AdminLayout from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ArrowLeft,
  Edit,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  Truck,
  DollarSign,
  MapPin,
  User,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { toast } from 'react-hot-toast'

interface OrderItem {
  product: {
    _id: string
    name: string
    images: string[]
  }
  quantity: number
  price: number
  name: string
  image?: string
}

interface Order {
  _id: string
  orderNumber: string
  user: {
    _id: string
    name: string
    email: string
    phone?: string
  }
  items: OrderItem[]
  shippingAddress: {
    name: string
    phone: string
    address: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  billingAddress?: {
    name: string
    phone: string
    address: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  paymentMethod: string
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  orderStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  subtotal: number
  tax: number
  shipping: number
  discount: number
  total: number
  currency: string
  notes?: string
  trackingNumber?: string
  shippedAt?: string
  deliveredAt?: string
  createdAt: string
  updatedAt: string
}

export default function OrderDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'admin') {
      router.push('/auth/signin')
    } else {
      fetchOrder()
    }
  }, [session, status, router, params.id])

  const fetchOrder = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/orders/${params.id}`)
      const data = await response.json()

      if (data.success) {
        setOrder(data.data)
      } else {
        toast.error(data.message || 'Failed to fetch order')
        router.push('/admin/orders')
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      toast.error('Failed to fetch order')
      router.push('/admin/orders')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5" />
      case 'confirmed':
        return <CheckCircle className="w-5 h-5" />
      case 'processing':
        return <Package className="w-5 h-5" />
      case 'shipped':
        return <Truck className="w-5 h-5" />
      case 'delivered':
        return <CheckCircle className="w-5 h-5" />
      case 'cancelled':
        return <XCircle className="w-5 h-5" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'confirmed':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'processing':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'shipped':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200'
      case 'delivered':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'failed':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'refunded':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      default:
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    }
  }

  if (loading || status === 'loading') {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    )
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order not found</h2>
            <p className="text-gray-600 mb-4">The order you're looking for doesn't exist.</p>
            <Link
              href="/admin/orders"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Orders
            </Link>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/orders"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
              <p className="text-gray-600">Order #{order.orderNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild>
              <Link href={`/admin/orders/${order._id}/edit`} className="flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Edit Order
              </Link>
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download Invoice
            </Button>
          </div>
        </div>

        {/* Order Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Order Status</CardTitle>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {getStatusIcon(order.orderStatus)}
                    {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                  </Badge>
                  <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'outline'} className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Order Date</p>
                <p className="font-semibold text-gray-900">
                  {format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            </div>
          </CardHeader>
          {order.trackingNumber && (
            <CardContent>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-600" />
                  <div>
                    <span className="font-semibold text-blue-900">Tracking Number: </span>
                    <span className="text-blue-800">{order.trackingNumber}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-semibold text-gray-900">{order.user.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold text-gray-900 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {order.user.email}
                </p>
              </div>
              {order.user.phone && (
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {order.user.phone}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-semibold text-gray-900">{order.shippingAddress.name}</p>
              <p className="text-gray-700">{order.shippingAddress.address}</p>
              <p className="text-gray-700">
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
              </p>
              <p className="text-gray-700">{order.shippingAddress.country}</p>
              <p className="text-gray-700 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {order.shippingAddress.phone}
              </p>
            </CardContent>
          </Card>

          {/* Billing Address */}
          {order.billingAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Billing Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-semibold text-gray-900">{order.billingAddress.name}</p>
                <p className="text-gray-700">{order.billingAddress.address}</p>
                <p className="text-gray-700">
                  {order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.zipCode}
                </p>
                <p className="text-gray-700">{order.billingAddress.country}</p>
                <p className="text-gray-700 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {order.billingAddress.phone}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Items
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {item.image ? (
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{item.name}</h4>
                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold text-gray-900">${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax</span>
              <span className="font-semibold text-gray-900">${order.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shipping</span>
              <span className="font-semibold text-gray-900">${order.shipping.toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount</span>
                <span className="font-semibold text-red-600">-${order.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-blue-600">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Notes */}
        {order.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Order Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{order.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}