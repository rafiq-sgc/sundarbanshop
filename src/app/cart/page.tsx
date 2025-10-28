'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ShoppingBag,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { cartService, type Cart, type CartItem, type CartItemVariant } from '@/services/dashboard'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'

interface GuestCartItem {
  productId: string
  name: string
  price: number
  image: string
  quantity: number
  stock: number
  variant?: CartItemVariant
}

export default function CartPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [cart, setCart] = useState<Cart | null>(null)
  const [guestCart, setGuestCart] = useState<GuestCartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCart()
    } else {
      // Load guest cart for unauthenticated users
      loadGuestCart()
    }
  }, [status])

  // Listen for cart updates from other pages
  useEffect(() => {
    if (status === 'unauthenticated') {
      const handleCartUpdate = () => {
        loadGuestCart()
      }

      window.addEventListener('cartUpdated', handleCartUpdate)
      return () => {
        window.removeEventListener('cartUpdated', handleCartUpdate)
      }
    }
  }, [status])

  const fetchCart = async () => {
    try {
      setLoading(true)
      const result = await cartService.getCart()
      if (result.success && result.data) {
        setCart(result.data)
      }
    } catch (error: any) {
      console.error('Error fetching cart:', error)
      toast.error(error.message || 'Failed to load cart')
    } finally {
      setLoading(false)
    }
  }

  const loadGuestCart = () => {
    try {
      setLoading(true)
      const stored = localStorage.getItem('ekomart-cart')
      if (stored) {
        const cartData = JSON.parse(stored)
        // Convert cart context format to guest cart format
        const items: GuestCartItem[] = cartData.items.map((item: any) => ({
          productId: item.product._id,
          name: item.product.name,
          price: item.product.price,
          image: item.product.images?.[0] || '/placeholder.png',
          quantity: item.quantity,
          stock: item.product.stock,
          variant: item.variant
        }))
        setGuestCart(items)
      } else {
        setGuestCart([])
      }
    } catch (error) {
      console.error('Error loading guest cart:', error)
      setGuestCart([])
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    if (quantity < 1) return

    try {
      setUpdating(productId)
      
      if (status === 'authenticated') {
        const result = await cartService.updateQuantity(productId, quantity)
        if (result.success && result.data) {
          setCart(result.data)
        }
      } else {
        // Update guest cart
        const updatedCart = guestCart.map(item =>
          item.productId === productId ? { ...item, quantity } : item
        )
        setGuestCart(updatedCart)
        
        // Update localStorage with the correct format
        const stored = localStorage.getItem('ekomart-cart')
        if (stored) {
          const cartData = JSON.parse(stored)
          const updatedItems = cartData.items.map((item: any) => {
            if (item.product._id === productId) {
              return { ...item, quantity }
            }
            return item
          })
          localStorage.setItem('ekomart-cart', JSON.stringify({
            ...cartData,
            items: updatedItems
          }))
        }
      }
    } catch (error: any) {
      console.error('Error updating quantity:', error)
      toast.error(error.message || 'Failed to update quantity')
    } finally {
      setUpdating(null)
    }
  }

  const handleRemoveItem = async (productId: string) => {
    try {
      setUpdating(productId)
      
      if (status === 'authenticated') {
        const result = await cartService.removeFromCart(productId)
        if (result.success) {
          toast.success('Item removed from cart')
          await fetchCart()
        }
      } else {
        // Remove from guest cart
        const updatedCart = guestCart.filter(item => item.productId !== productId)
        setGuestCart(updatedCart)
        
        // Update localStorage with the correct format
        const stored = localStorage.getItem('ekomart-cart')
        if (stored) {
          const cartData = JSON.parse(stored)
          const updatedItems = cartData.items.filter((item: any) => item.product._id !== productId)
          localStorage.setItem('ekomart-cart', JSON.stringify({
            ...cartData,
            items: updatedItems
          }))
        }
        toast.success('Item removed from cart')
      }
    } catch (error: any) {
      console.error('Error removing item:', error)
      toast.error(error.message || 'Failed to remove item')
    } finally {
      setUpdating(null)
    }
  }

  const handleClearCart = async () => {
    if (!confirm('Are you sure you want to clear your cart?')) {
      return
    }

    try {
      if (status === 'authenticated') {
        const result = await cartService.clearCart()
        if (result.success) {
          toast.success('Cart cleared')
          await fetchCart()
        }
      } else {
        // Clear guest cart
        setGuestCart([])
        localStorage.setItem('ekomart-cart', JSON.stringify({ items: [] }))
        toast.success('Cart cleared')
      }
    } catch (error: any) {
      console.error('Error clearing cart:', error)
      toast.error(error.message || 'Failed to clear cart')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-gray-200 rounded-lg"></div>
            <div className="h-24 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Determine which cart to use
  const isAuthenticated = status === 'authenticated'
  const items = isAuthenticated ? (cart?.items || []) : guestCart
  const isEmpty = items.length === 0

  // Calculate totals
  const subtotal = isAuthenticated
    ? (cart?.subtotal || 0)
    : guestCart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-600">
          <ol className="flex items-center space-x-2">
            <li><Link href="/" className="hover:text-green-600">Home</Link></li>
            <li>/</li>
            <li className="text-gray-900">Shopping Cart</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-green-600" />
              Shopping Cart
              {!isEmpty && (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-bold rounded-full">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
              )}
            </h1>
          </div>
          {!isEmpty && (
            <Button
              onClick={handleClearCart}
              variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Cart
            </Button>
          )}
        </div>

        {isEmpty ? (
          /* Empty Cart */
          <Card>
            <CardContent className="py-16 text-center">
              <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">Add some products to get started!</p>
              <Link href="/products">
                <Button size="lg" className="gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Continue Shopping
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {isAuthenticated ? (
                // Authenticated cart items
                cart!.items.map((item: any) => (
                <Card key={item._id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.product?.images?.[0] || '/placeholder.png'}
                          alt={item.product?.name || 'Product'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.png'
                          }}
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/products/${item.product?._id}`}>
                          <h3 className="font-semibold text-gray-900 hover:text-green-600 mb-1">
                            {item.product?.name || 'Unknown Product'}
                          </h3>
                        </Link>
                        
                        {/* Variant Information */}
                        {item.variant && item.variant.attributes && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {Object.entries(item.variant.attributes).map(([key, value]) => (
                              <Badge key={key} variant="secondary" className="text-xs">
                                {key}: {String(value)}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <p className="text-sm text-gray-500 mb-2">
                          SKU: {item.variant?.sku || item.product?.sku || 'N/A'}
                        </p>
                        <div className="flex items-center gap-4">
                          <div className="text-lg font-bold text-green-600">
                            ৳{item.price.toFixed(2)}
                          </div>
                          {item.product && item.product.stock < 10 && (
                            <span className="text-xs text-orange-600 font-medium">
                              Only {item.product.stock} left!
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2 border border-gray-300 rounded-lg">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateQuantity(item.product._id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || updating === item.product._id}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-12 text-center font-semibold">
                            {updating === item.product._id ? (
                              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                            ) : (
                              item.quantity
                            )}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateQuantity(item.product._id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock || updating === item.product._id}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.product._id)}
                          disabled={updating === item.product._id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
              ) : (
                // Guest cart items
                guestCart.map((item) => (
                <Card key={item.productId}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.png'
                          }}
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/products/${item.productId}`}>
                          <h3 className="font-semibold text-gray-900 hover:text-green-600 mb-1">
                            {item.name}
                          </h3>
                        </Link>
                        
                        {/* Variant Information */}
                        {item.variant && item.variant.attributes && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {Object.entries(item.variant.attributes).map(([key, value]) => (
                              <Badge key={key} variant="secondary" className="text-xs">
                                {key}: {String(value)}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4">
                          <div className="text-lg font-bold text-green-600">
                            ৳{item.price.toFixed(2)}
                          </div>
                          {item.stock < 10 && (
                            <span className="text-xs text-orange-600 font-medium">
                              Only {item.stock} left!
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-xl font-bold text-gray-900">
                          ৳{(item.price * item.quantity).toFixed(2)}
                        </div>
                        <div className="flex items-center border rounded-lg">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                            disabled={item.quantity <= 1 || updating === item.productId}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-12 text-center font-semibold">
                            {updating === item.productId ? (
                              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                            ) : (
                              item.quantity
                            )}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                            disabled={item.quantity >= item.stock || updating === item.productId}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.productId)}
                          disabled={updating === item.productId}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal ({items.length} items)</span>
                      <span className="font-semibold">৳{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Tax (8%)</span>
                      <span className="font-semibold">৳{(subtotal * 0.08).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span className="font-semibold">
                        {subtotal > 50 ? (
                          <span className="text-green-600">FREE</span>
                        ) : (
                          '৳10.00'
                        )}
                      </span>
                    </div>
                    {subtotal > 50 && (
                      <div className="text-xs text-green-600 flex items-center gap-1">
                        ✓ You've qualified for free shipping!
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-green-600">
                        ৳{(subtotal + (subtotal * 0.08) + (subtotal > 50 ? 0 : 10)).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <Link href="/checkout">
                    <Button size="lg" className="w-full gap-2">
                      Proceed to Checkout
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </Link>

                  <Link href="/products">
                    <Button variant="outline" size="lg" className="w-full mt-3">
                      Continue Shopping
                    </Button>
                  </Link>

                  {/* Security Badge */}
                  <div className="mt-6 pt-6 border-t text-center">
                    <p className="text-xs text-gray-500">
                      🔒 Secure checkout powered by EkoMart
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
