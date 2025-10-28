'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Package, 
  ArrowLeft,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  MapPin,
  CreditCard,
  Download,
  Phone,
  Mail,
  Calendar
} from 'lucide-react'
import Link from 'next/link'
import { dashboardOrderService } from '@/services/dashboard'
import toast from 'react-hot-toast'

interface Order {
  _id: string
  orderNumber: string
  user: {
    name: string
    email: string
    phone: string
  }
  items: Array<{
    name: string
    sku?: string
    quantity: number
    price: number
    total: number
    product?: {
      name: string
      images: string[]
    }
  }>
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
  subtotal: number
  tax: number
  shipping: number
  discount: number
  total: number
  currency: string
  orderStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  paymentMethod: string
  trackingNumber?: string
  shippedAt?: string
  deliveredAt?: string
  createdAt: string
  updatedAt: string
  notes?: string
}

export default function UserOrderDetailPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    fetchOrder()
  }, [session, status, params.id])

  const fetchOrder = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await dashboardOrderService.getById(params.id)

      if (data.success) {
        setOrder(data.data)
      } else {
        setError(data.message || 'Failed to load order')
      }
    } catch (error: any) {
      console.error('Error fetching order:', error)
      setError(error.message || 'Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadInvoice = async () => {
    try {
      toast.loading('Generating invoice...')
      await dashboardOrderService.downloadInvoice(params.id)
      toast.dismiss()
      toast.success('Invoice downloaded successfully!')
    } catch (error) {
      toast.dismiss()
      toast.error('Failed to download invoice')
      console.error('Error downloading invoice:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'shipped':
        return <Truck className="w-5 h-5 text-blue-600" />
      case 'processing':
        return <Package className="w-5 h-5 text-yellow-600" />
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'shipped':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'confirmed':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'refunded':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            <p className="font-medium">{error}</p>
            <Link href="/dashboard/orders" className="text-red-600 hover:text-red-800 underline mt-2 inline-block">
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard/orders"
                className="p-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
                <p className="text-sm text-gray-600">Order #{order.orderNumber}</p>
              </div>
            </div>
            <button 
              onClick={handleDownloadInvoice}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Invoice
            </button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Order Status</h2>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(order.orderStatus)}
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(order.orderStatus)}`}>
                    {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                  </span>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${order.orderStatus === 'pending' || order.orderStatus === 'confirmed' || order.orderStatus === 'processing' || order.orderStatus === 'shipped' || order.orderStatus === 'delivered' ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Order Placed</p>
                    <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                {order.orderStatus !== 'cancelled' && (
                  <>
                    <div className="flex items-start space-x-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${order.orderStatus === 'confirmed' || order.orderStatus === 'processing' || order.orderStatus === 'shipped' || order.orderStatus === 'delivered' ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Order Confirmed</p>
                        <p className="text-sm text-gray-500">Your order has been confirmed</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${order.orderStatus === 'processing' || order.orderStatus === 'shipped' || order.orderStatus === 'delivered' ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <Package className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Processing</p>
                        <p className="text-sm text-gray-500">Your order is being prepared</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${order.orderStatus === 'shipped' || order.orderStatus === 'delivered' ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <Truck className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Shipped</p>
                        {order.shippedAt && (
                          <p className="text-sm text-gray-500">{new Date(order.shippedAt).toLocaleString()}</p>
                        )}
                        {order.trackingNumber && (
                          <p className="text-sm text-gray-500 mt-1">Tracking: <span className="font-mono font-medium">{order.trackingNumber}</span></p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${order.orderStatus === 'delivered' ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Delivered</p>
                        {order.deliveredAt && (
                          <p className="text-sm text-gray-500">{new Date(order.deliveredAt).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {order.orderStatus === 'cancelled' && (
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-red-500">
                      <XCircle className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Order Cancelled</p>
                      <p className="text-sm text-gray-500">Your order has been cancelled</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 pb-4 border-b last:border-b-0">
                    <div className="flex-shrink-0 h-16 w-16">
                      <img
                        src={item.product?.images[0] || '/images/placeholder-product.jpg'}
                        alt={item.name}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      {item.sku && (
                        <p className="text-xs text-gray-500 mt-1">SKU: {item.sku}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        Quantity: {item.quantity} × ${item.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        ${item.total.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="border-t pt-4 mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">${order.subtotal.toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="text-green-600">-${order.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-900">${order.shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">${order.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold pt-2 border-t">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Payment Method</span>
                </div>
                <p className="text-sm font-medium text-gray-900 capitalize">
                  {order.paymentMethod.replace('_', ' ')}
                </p>
                <div className="mt-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                    {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h2>
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div className="text-sm text-gray-600">
                    <p className="font-medium text-gray-900">{order.shippingAddress.name}</p>
                    <p className="mt-1">{order.shippingAddress.address}</p>
                    <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                    <p>{order.shippingAddress.country}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{order.shippingAddress.phone}</span>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{order.user.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{order.user.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Ordered on {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Notes */}
            {order.notes && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Notes</h2>
                <p className="text-sm text-gray-600">{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

