'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Package, 
  Search, 
  Mail, 
  Phone,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  MapPin,
  Calendar,
  CreditCard,
  ArrowLeft,
  ShoppingBag
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'

interface Order {
  _id: string
  orderNumber: string
  orderDate: string
  orderStatus: string
  paymentStatus: string
  paymentMethod: string
  items: Array<{
    name: string
    sku?: string
    quantity: number
    price: number
    total: number
    product?: {
      name: string
      images: string[]
    } | null
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
  subtotal: number
  tax: number
  shipping: number
  discount: number
  total: number
  currency: string
  trackingNumber?: string
  shippedAt?: string
  deliveredAt?: string
  notes?: string
  customer: {
    name: string
    email?: string
    phone: string
  }
}

import { Suspense } from 'react'

function TrackOrderPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [formData, setFormData] = useState({
    orderNumber: searchParams?.get('order') || '',
    email: searchParams?.get('email') || '',
    phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<Order | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setOrder(null)

    try {
      const response = await fetch('/api/track-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        setOrder(data.data)
        toast.success('Order found!')
      } else {
        toast.error(data.message || 'Order not found')
      }
    } catch (error) {
      toast.error('Failed to track order. Please try again.')
    } finally {
      setLoading(false)
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
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-purple-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-500/10 text-green-700 border-green-200'
      case 'shipped':
        return 'bg-blue-500/10 text-blue-700 border-blue-200'
      case 'processing':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200'
      case 'cancelled':
        return 'bg-red-500/10 text-red-700 border-red-200'
      case 'confirmed':
        return 'bg-purple-500/10 text-purple-700 border-purple-200'
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">EkoMart</span>
            </Link>
            <Button variant="outline" asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-12">
        <div className="max-w-4xl mx-auto">
          {/* Search Form */}
          {!order && (
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-3xl">Track Your Order</CardTitle>
                <CardDescription className="text-base">
                  Enter your order number and email or phone number to track your order status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="orderNumber">Order Number *</Label>
                    <div className="relative">
                      <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="orderNumber"
                        placeholder="ORD-000123"
                        value={formData.orderNumber}
                        onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value.toUpperCase() })}
                        className="pl-9"
                        required
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You can find this in your order confirmation email
                    </p>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        And either
                      </span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="name@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+1234567890"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Tracking...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Track Order
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground text-center">
                    <strong>Have an account?</strong>{' '}
                    <Link href="/auth/signin" className="text-primary hover:underline">
                      Sign in
                    </Link>{' '}
                    to view all your orders and manage your account.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Details */}
          {order && (
            <div className="space-y-6">
              <Button
                variant="outline"
                onClick={() => setOrder(null)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Track Another Order
              </Button>

              {/* Order Status */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Order #{order.orderNumber}</CardTitle>
                      <CardDescription>
                        Placed on {new Date(order.orderDate).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className={getStatusColor(order.orderStatus)}>
                      {getStatusIcon(order.orderStatus)}
                      <span className="ml-2 capitalize">{order.orderStatus}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Status Timeline */}
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${['pending', 'confirmed', 'processing', 'shipped', 'delivered'].includes(order.orderStatus) ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">Order Placed</p>
                        <p className="text-sm text-muted-foreground">{new Date(order.orderDate).toLocaleString()}</p>
                      </div>
                    </div>

                    {order.orderStatus !== 'cancelled' && (
                      <>
                        <div className="flex items-start space-x-4">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${['confirmed', 'processing', 'shipped', 'delivered'].includes(order.orderStatus) ? 'bg-green-500' : 'bg-gray-300'}`}>
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">Order Confirmed</p>
                            <p className="text-sm text-muted-foreground">Your order has been confirmed</p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-4">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${['processing', 'shipped', 'delivered'].includes(order.orderStatus) ? 'bg-green-500' : 'bg-gray-300'}`}>
                            <Package className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">Processing</p>
                            <p className="text-sm text-muted-foreground">Your order is being prepared</p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-4">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${['shipped', 'delivered'].includes(order.orderStatus) ? 'bg-green-500' : 'bg-gray-300'}`}>
                            <Truck className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">Shipped</p>
                            {order.shippedAt ? (
                              <p className="text-sm text-muted-foreground">{new Date(order.shippedAt).toLocaleString()}</p>
                            ) : (
                              <p className="text-sm text-muted-foreground">Awaiting shipment</p>
                            )}
                            {order.trackingNumber && (
                              <p className="text-sm font-mono font-medium mt-1">Tracking: {order.trackingNumber}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start space-x-4">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${order.orderStatus === 'delivered' ? 'bg-green-500' : 'bg-gray-300'}`}>
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">Delivered</p>
                            {order.deliveredAt ? (
                              <p className="text-sm text-muted-foreground">{new Date(order.deliveredAt).toLocaleString()}</p>
                            ) : (
                              <p className="text-sm text-muted-foreground">Not yet delivered</p>
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
                        <div>
                          <p className="font-medium">Order Cancelled</p>
                          <p className="text-sm text-muted-foreground">Your order has been cancelled</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 pb-4 border-b last:border-b-0">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={item.product?.images?.[0] || '/images/placeholder-product.jpg'}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/images/placeholder-product.jpg';
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        {item.sku && (
                          <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity} × ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right font-medium">
                        ${item.total.toFixed(2)}
                      </div>
                    </div>
                  ))}

                  {/* Order Summary */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>${order.subtotal.toFixed(2)}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Discount</span>
                        <span className="text-green-600">-${order.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>${order.shipping.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax</span>
                      <span>${order.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total</span>
                      <span>${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{order.shippingAddress.name}</p>
                      <p className="text-sm text-muted-foreground">{order.shippingAddress.address}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                      </p>
                      <p className="text-sm text-muted-foreground">{order.shippingAddress.country}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        <Phone className="w-4 h-4 inline mr-1" />
                        {order.shippingAddress.phone}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Need Help */}
              <Card className="bg-muted">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                      Need help with your order? Contact our support team
                    </p>
                    <div className="flex justify-center gap-4">
                      <Button variant="outline" asChild>
                        <Link href="/contact">Contact Support</Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href="/auth/signin">Sign In to Account</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div>Loading track order...</div>}>
      <TrackOrderPageInner />
    </Suspense>
  )
}
