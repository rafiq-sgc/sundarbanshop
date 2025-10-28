'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  CheckCircle2,
  Package,
  Truck,
  Home as HomeIcon,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { dashboardOrderService } from '@/services/dashboard'

export default function OrderConfirmationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams?.get('orderId')
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (orderId) {
      fetchOrder()
    } else {
      // If no order ID, redirect based on authentication status
      if (status === 'authenticated') {
        router.push('/dashboard/orders')
      } else {
        router.push('/')
      }
    }
  }, [status, orderId, router])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/orders/${orderId}`)
      const result = await response.json()
      
      if (result.success && result.data) {
        setOrder(result.data)
      } else {
        // Redirect based on authentication status
        if (status === 'authenticated') {
          router.push('/dashboard/orders')
        } else {
          router.push('/')
        }
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      // Redirect based on authentication status
      if (status === 'authenticated') {
        router.push('/dashboard/orders')
      } else {
        router.push('/')
      }
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container py-8">
          <div className="animate-pulse text-center py-16">
            <div className="h-8 w-64 bg-gray-200 rounded mx-auto mb-4"></div>
            <div className="h-4 w-48 bg-gray-200 rounded mx-auto"></div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container py-8">
        <div className="max-w-3xl mx-auto">
          {/* Success Banner */}
          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 mb-8">
            <CardContent className="py-12 text-center">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Order Placed Successfully!
              </h1>
              <p className="text-lg text-gray-700 mb-4">
                Thank you for your order. We'll send you a confirmation email shortly.
              </p>
              {order?.isGuestOrder && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Guest Order:</strong> You can track your order using the order number above. 
                    If you provided an email address, you'll receive updates about your order.
                  </p>
                </div>
              )}
              <div className="inline-block bg-white px-6 py-3 rounded-lg shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Order Number</p>
                <p className="text-2xl font-bold text-green-600">
                  {order?.orderNumber || 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Order Timeline */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="text-xl font-bold">What's Next?</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Order Confirmed</h3>
                    <p className="text-sm text-gray-600">Your order has been received and is being processed</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Processing</h3>
                    <p className="text-sm text-gray-600">We're preparing your items for shipment</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Truck className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Shipped</h3>
                    <p className="text-sm text-gray-600">Your order will be on its way soon</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <HomeIcon className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Delivered</h3>
                    <p className="text-sm text-gray-600">Package arrives at your doorstep</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="text-xl font-bold">Order Details</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Items */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Items ({order?.items?.length || 0})</h3>
                  <div className="space-y-2">
                    {order?.items?.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.name} × {item.quantity}
                        </span>
                        <span className="font-semibold text-gray-900">
                          ৳{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold">৳{order?.subtotal?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax</span>
                      <span className="font-semibold">৳{order?.tax?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-semibold">
                        {order?.shipping === 0 ? (
                          <span className="text-green-600">FREE</span>
                        ) : (
                          `৳${order?.shipping?.toFixed(2)}`
                        )}
                      </span>
                    </div>
                    <div className="border-t pt-2 flex justify-between">
                      <span className="font-bold text-gray-900">Total</span>
                      <span className="text-xl font-bold text-green-600">
                        ৳{order?.total?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="border-t pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment Method</span>
                    <span className="font-semibold text-gray-900 capitalize">
                      {order?.paymentMethod?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            {status === 'authenticated' ? (
              <Link href="/dashboard/orders" className="flex-1">
                <Button variant="outline" size="lg" className="w-full gap-2">
                  View All Orders
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            ) : (
              <Link href="/shop" className="flex-1">
                <Button variant="outline" size="lg" className="w-full gap-2">
                  Browse Products
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            )}
            <Link href="/" className="flex-1">
              <Button size="lg" className="w-full gap-2">
                Continue Shopping
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

