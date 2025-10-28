'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  MapPin,
  CreditCard,
  Smartphone,
  Building2,
  Banknote,
  CheckCircle2,
  Loader2,
  Plus,
  Truck,
  Package
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  cartService, 
  addressService,
  type Cart,
  type Address,
  type CartItemVariant
} from '@/services/dashboard'
import { frontendCheckoutService } from '@/services/frontend/checkout.service'
import { useCartAPI } from '@/store/cart-api-context'
import { Badge } from '@/components/ui/badge'

// Address schema for inline form
const addressSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'Phone is required'),
  email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  address: z.string().min(5, 'Full address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().min(2, 'Country is required')
})

const checkoutSchema = z.object({
  shippingAddressId: z.string().optional(),
  shippingAddress: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional()
  }).optional(),
  paymentMethod: z.enum(['cod', 'bkash', 'nagad', 'rocket', 'bank']),
  notes: z.string().optional(),
  guestEmail: z.string().email('Please enter a valid email address').optional().or(z.literal(''))
})

type CheckoutFormData = z.infer<typeof checkoutSchema>

interface GuestCartItem {
  productId: string
  name: string
  price: number
  image: string
  quantity: number
  stock: number
  variant?: CartItemVariant
}

export default function CheckoutPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { refreshCart } = useCartAPI()
  const [cart, setCart] = useState<Cart | null>(null)
  const [guestCart, setGuestCart] = useState<GuestCartItem[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingAddress, setIsSavingAddress] = useState(false)
  const [selectedShipping, setSelectedShipping] = useState<string>('')
  const [selectedPayment, setSelectedPayment] = useState<string>('cod')
  const [showAddressForm, setShowAddressForm] = useState(true) // Always show for guests
  const [shippingOption, setShippingOption] = useState<'inside-dhaka' | 'outside-dhaka'>('inside-dhaka')

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema) as any,
    defaultValues: {
      paymentMethod: 'cod',
      notes: '',
      guestEmail: '',
      shippingAddress: {
        name: session?.user?.name || '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Bangladesh'
      }
    }
  })

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData()
    } else if (status === 'unauthenticated') {
      // Load guest cart from localStorage
      loadGuestCart()
    }
  }, [status])

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
        
        if (items.length === 0) {
          toast.error('Your cart is empty')
          router.push('/products')
          return
        }
        
        setGuestCart(items)
        setShowAddressForm(true) // Always show form for guests
      } else {
        toast.error('Your cart is empty')
        router.push('/products')
        return
      }
    } catch (error) {
      console.error('Error loading guest cart:', error)
      toast.error('Failed to load cart')
      router.push('/cart')
    } finally {
      setLoading(false)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const [cartResult, addressResult] = await Promise.all([
        cartService.getCart(),
        addressService.getAddresses()
      ])

      if (cartResult.success && cartResult.data) {
        setCart(cartResult.data)
        
        if (!cartResult.data.items || cartResult.data.items.length === 0) {
          toast.error('Your cart is empty')
          router.push('/products')
          return
        }
      }

      if (addressResult.success && addressResult.data) {
        setAddresses(addressResult.data)
        
        if (addressResult.data.length > 0) {
          // Has addresses - hide form, auto-select default
          setShowAddressForm(false)
          const defaultAddr = addressResult.data.find(a => a.isDefault) || addressResult.data[0]
          setSelectedShipping(defaultAddr._id!)
          form.setValue('shippingAddressId', defaultAddr._id!)
        } else {
          // No addresses - show form
          setShowAddressForm(true)
        }
      } else {
        // Error or no addresses - show form
        setShowAddressForm(true)
      }
    } catch (error: any) {
      console.error('Error fetching data:', error)
      toast.error(error.message || 'Failed to load checkout data')
      // Show form as fallback
      setShowAddressForm(true)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: CheckoutFormData) => {
    try {
      setIsSubmitting(true)

      // Prepare shipping address
      let shippingAddressId = data.shippingAddressId

      // Prepare shipping address data
      let shippingAddressData = null
      
      // If using inline form, validate and prepare address data
      if (!shippingAddressId && data.shippingAddress) {
        // Validate inline address has all required fields
        const addr = data.shippingAddress
        if (!addr.name || !addr.phone || !addr.address || !addr.city || !addr.country) {
          toast.error('Please fill in all required shipping address fields')
          setIsSubmitting(false)
          return
        }

        // For authenticated users, save address to database
        if (status === 'authenticated') {
          setIsSavingAddress(true)
          toast.loading('Saving address...', { id: 'save-address' })

          const addressResult = await addressService.addAddress({
            name: addr.name,
            phone: addr.phone,
            email: addr.email || undefined,
            address: addr.address,
            city: addr.city,
            state: addr.state,
            zipCode: addr.zipCode,
            country: addr.country,
            isDefault: addresses.length === 0,
            type: 'home'
          })

          toast.dismiss('save-address')
          setIsSavingAddress(false)

          if (addressResult.success && addressResult.address) {
            shippingAddressId = addressResult.address._id
            toast.success('Address saved!')
          } else {
            toast.error('Failed to save address')
            setIsSubmitting(false)
            return
          }
        } else {
          // For guest users, prepare address data for order
          shippingAddressData = {
            name: addr.name,
            phone: addr.phone,
            email: addr.email || undefined,
            address: addr.address,
            city: addr.city,
            state: addr.state,
            zipCode: addr.zipCode,
            country: addr.country
          }
        }
      }

      // For authenticated users, ensure we have a shipping address ID
      if (status === 'authenticated' && !shippingAddressId) {
        toast.error('Please select or enter a shipping address')
        setIsSubmitting(false)
        return
      }

      // For guest users, ensure we have shipping address data
      if (status === 'unauthenticated' && !shippingAddressData) {
        toast.error('Please enter your shipping address')
        setIsSubmitting(false)
        return
      }

      console.log('Creating order with:', {
        shippingAddressId,
        shippingAddressData,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        guestEmail: data.guestEmail
      })

      toast.loading('Processing your order...', { id: 'create-order' })

      // Prepare order data based on user type
      const orderData: any = {
        paymentMethod: data.paymentMethod as any,
        notes: data.notes,
        shippingOption: shippingOption
      }

      if (status === 'authenticated') {
        // Authenticated user order
        orderData.shippingAddressId = shippingAddressId
        orderData.billingAddressId = shippingAddressId
      } else {
        // Guest user order
        orderData.shippingAddress = shippingAddressData
        orderData.billingAddress = shippingAddressData
        if (data.guestEmail) {
          orderData.guestEmail = data.guestEmail
        }
        // Add guest cart items
        orderData.items = guestCart.map(item => ({
          product: item.productId,
          name: item.name,
          sku: item.variant?.sku || 'N/A',
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity,
          variant: item.variant ? {
            variantId: item.variant.variantId,
            name: item.variant.name,
            attributes: item.variant.attributes,
            sku: item.variant.sku
          } : undefined
        }))
        // Calculate totals for guest order
        const subtotal = guestCart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        const tax = subtotal * 0.08
        const shipping = subtotal > 50 ? 0 : 10
        const total = subtotal + tax + shipping
        
        orderData.subtotal = subtotal
        orderData.tax = tax
        orderData.shipping = shipping
        orderData.total = total
        orderData.currency = 'BDT'
      }

      const result = await frontendCheckoutService.createOrder(orderData)

      toast.dismiss('create-order')

      if (result.success && result.data) {
        toast.success('Order placed successfully! 🎉')
        
        // Refresh cart to show 0 items
        if (status === 'authenticated') {
          await refreshCart()
        } else {
          // Clear guest cart from localStorage
          localStorage.setItem('ekomart-cart', JSON.stringify({ items: [] }))
          // Also dispatch event to update cart count in header
          window.dispatchEvent(new CustomEvent('cartUpdated', { 
            detail: { cartCount: 0 }
          }))
        }
        
        // Redirect to order confirmation page
        router.push(`/order-confirmation?orderId=${result.data.orderId}&orderNumber=${result.data.orderNumber}`)
      } else {
        toast.error(result.message || 'Failed to create order')
      }
    } catch (error: any) {
      console.error('Error creating order:', error)
      toast.error(error.message || 'Failed to create order')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Calculate subtotal based on authenticated or guest cart
  const subtotal = status === 'authenticated' 
    ? (cart?.subtotal || 0)
    : guestCart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    
  const tax = subtotal * 0.08 // 8% tax
  
  // Shipping charges based on location
  const insideDhakaShipping = 60  // ৳60 inside Dhaka
  const outsideDhakaShipping = 120 // ৳120 outside Dhaka
  const shipping = shippingOption === 'outside-dhaka' ? outsideDhakaShipping : insideDhakaShipping
  
  const total = subtotal + tax + shipping

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-600">
          <ol className="flex items-center space-x-2">
            <li><Link href="/" className="hover:text-green-600">Home</Link></li>
            <li>/</li>
            <li><Link href="/cart" className="hover:text-green-600">Cart</Link></li>
            <li>/</li>
            <li className="text-gray-900">Checkout</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your order</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-green-600" />
                      Shipping Address
                    </CardTitle>
                    {addresses.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddressForm(!showAddressForm)}
                        className="gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        {showAddressForm ? 'Use Saved Address' : 'Add New Address'}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Saved Addresses */}
                  {!showAddressForm && addresses.length > 0 && (
                    <div className="space-y-3">
                      {addresses.map((address) => (
                        <div
                          key={address._id}
                          onClick={() => {
                            setSelectedShipping(address._id!)
                            form.setValue('shippingAddressId', address._id!)
                            form.setValue('shippingAddress', undefined)
                          }}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedShipping === address._id
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-green-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="font-semibold text-gray-900">{address.name}</p>
                                {address.isDefault && (
                                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{address.address}</p>
                              <p className="text-sm text-gray-600">
                                {address.city}, {address.state} {address.zipCode}
                              </p>
                              <p className="text-sm text-gray-600">Phone: {address.phone}</p>
                            </div>
                            {selectedShipping === address._id && (
                              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Address Form (shown if no addresses or user clicks add new) */}
                  {showAddressForm && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Full Name *</Label>
                          <Input
                            id="name"
                            {...form.register('shippingAddress.name')}
                            placeholder="John Doe"
                          />
                          {form.formState.errors.shippingAddress?.name && (
                            <p className="text-sm text-red-600 mt-1">
                              {form.formState.errors.shippingAddress.name.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="phone">Phone Number *</Label>
                          <Input
                            id="phone"
                            {...form.register('shippingAddress.phone')}
                            placeholder="01712345678"
                          />
                          {form.formState.errors.shippingAddress?.phone && (
                            <p className="text-sm text-red-600 mt-1">
                              {form.formState.errors.shippingAddress.phone.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="email">Email Address (Optional)</Label>
                          <Input
                            id="email"
                            type="email"
                            {...form.register('shippingAddress.email')}
                            placeholder="your.email@example.com"
                          />
                          {form.formState.errors.shippingAddress?.email && (
                            <p className="text-sm text-red-600 mt-1">
                              {form.formState.errors.shippingAddress.email.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="address">Full Address *</Label>
                        <Input
                          id="address"
                          {...form.register('shippingAddress.address')}
                          placeholder="123 Main Street, Apt 4B, Area Name"
                        />
                        {form.formState.errors.shippingAddress?.address && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.shippingAddress.address.message}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="city">City *</Label>
                          <Input
                            id="city"
                            {...form.register('shippingAddress.city')}
                            placeholder="Dhaka"
                          />
                          {form.formState.errors.shippingAddress?.city && (
                            <p className="text-sm text-red-600 mt-1">
                              {form.formState.errors.shippingAddress.city.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="state">State/Division *</Label>
                          <Input
                            id="state"
                            {...form.register('shippingAddress.state')}
                            placeholder="Dhaka"
                          />
                          {form.formState.errors.shippingAddress?.state && (
                            <p className="text-sm text-red-600 mt-1">
                              {form.formState.errors.shippingAddress.state.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="zipCode">ZIP Code (Optional)</Label>
                          <Input
                            id="zipCode"
                            {...form.register('shippingAddress.zipCode')}
                            placeholder="1200"
                          />
                          {form.formState.errors.shippingAddress?.zipCode && (
                            <p className="text-sm text-red-600 mt-1">
                              {form.formState.errors.shippingAddress.zipCode.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="country">Country *</Label>
                        <Input
                          id="country"
                          {...form.register('shippingAddress.country')}
                          placeholder="Bangladesh"
                        />
                        {form.formState.errors.shippingAddress?.country && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.shippingAddress.country.message}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Shipping Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-green-600" />
                    Shipping Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Inside Dhaka */}
                    <div
                      onClick={() => setShippingOption('inside-dhaka')}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        shippingOption === 'inside-dhaka'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-semibold text-gray-900">Inside Dhaka City</p>
                            <p className="text-xs text-gray-500">Delivery within 2-3 business days</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">৳{insideDhakaShipping}</p>
                          {shippingOption === 'inside-dhaka' && (
                            <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 ml-auto" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Outside Dhaka */}
                    <div
                      onClick={() => setShippingOption('outside-dhaka')}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        shippingOption === 'outside-dhaka'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Truck className="w-5 h-5 text-purple-600" />
                          <div>
                            <p className="font-semibold text-gray-900">Outside Dhaka City</p>
                            <p className="text-xs text-gray-500">Delivery within 3-5 business days</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">৳{outsideDhakaShipping}</p>
                          {shippingOption === 'outside-dhaka' && (
                            <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 ml-auto" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Cash on Delivery */}
                    <div
                      onClick={() => {
                        setSelectedPayment('cod')
                        form.setValue('paymentMethod', 'cod')
                      }}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedPayment === 'cod'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Banknote className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-semibold text-gray-900">Cash on Delivery</p>
                            <p className="text-xs text-gray-500">Pay when you receive your order</p>
                          </div>
                        </div>
                        {selectedPayment === 'cod' && (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                    </div>

                    {/* bKash */}
                    <div
                      onClick={() => {
                        setSelectedPayment('bkash')
                        form.setValue('paymentMethod', 'bkash')
                      }}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedPayment === 'bkash'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                            <Smartphone className="w-5 h-5 text-pink-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">bKash</p>
                            <p className="text-xs text-gray-500">Pay with bKash mobile wallet</p>
                          </div>
                        </div>
                        {selectedPayment === 'bkash' && (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                    </div>

                    {/* Nagad */}
                    <div
                      onClick={() => {
                        setSelectedPayment('nagad')
                        form.setValue('paymentMethod', 'nagad')
                      }}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedPayment === 'nagad'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Smartphone className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Nagad</p>
                            <p className="text-xs text-gray-500">Pay with Nagad mobile wallet</p>
                          </div>
                        </div>
                        {selectedPayment === 'nagad' && (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                    </div>

                    {/* Rocket */}
                    <div
                      onClick={() => {
                        setSelectedPayment('rocket')
                        form.setValue('paymentMethod', 'rocket')
                      }}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedPayment === 'rocket'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Smartphone className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Rocket</p>
                            <p className="text-xs text-gray-500">Pay with Rocket mobile wallet</p>
                          </div>
                        </div>
                        {selectedPayment === 'rocket' && (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                    </div>

                    {/* Bank Transfer */}
                    <div
                      onClick={() => {
                        setSelectedPayment('bank')
                        form.setValue('paymentMethod', 'bank')
                      }}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedPayment === 'bank'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Building2 className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-semibold text-gray-900">Bank Transfer</p>
                            <p className="text-xs text-gray-500">Pay via bank transfer</p>
                          </div>
                        </div>
                        {selectedPayment === 'bank' && (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Notes (Optional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    {...form.register('notes')}
                    placeholder="Add any special instructions for your order..."
                    rows={4}
                    disabled={isSubmitting}
                  />
                </CardContent>
              </Card>

              {/* Guest Email - Only show for unauthenticated users */}
              {status === 'unauthenticated' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information (Optional)</CardTitle>
                    <p className="text-sm text-gray-600">
                      Provide your email to receive order updates and invoice
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <Label htmlFor="guestEmail">Email Address</Label>
                      <Input
                        id="guestEmail"
                        type="email"
                        {...form.register('guestEmail')}
                        placeholder="your.email@example.com"
                        disabled={isSubmitting}
                      />
                      {form.formState.errors.guestEmail && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.guestEmail.message}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Cart Items */}
                  <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                    {status === 'authenticated' ? (
                      // Authenticated cart items
                      cart?.items.map((item: any) => (
                        <div key={item._id} className="flex gap-3">
                          <img
                            src={item.product?.images?.[0] || '/placeholder.png'}
                            alt={item.product?.name}
                            className="w-16 h-16 object-cover rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.png'
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.product?.name}
                            </p>
                            {/* Variant Information */}
                            {item.variant && item.variant.attributes && (
                              <div className="flex flex-wrap gap-1 my-1">
                                {Object.entries(item.variant.attributes as Record<string, string>).map(([key, value]) => (
                                  <Badge key={key} variant="outline" className="text-xs py-0 px-1">
                                    {key}: {value as string}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                            <p className="text-sm font-semibold text-green-600">
                              ৳{(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      // Guest cart items
                      guestCart.map((item) => (
                        <div key={item.productId} className="flex gap-3">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.png'
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.name}
                            </p>
                            {/* Variant Information */}
                            {item.variant && item.variant.attributes && (
                              <div className="flex flex-wrap gap-1 my-1">
                                {Object.entries(item.variant.attributes as Record<string, string>).map(([key, value]) => (
                                  <Badge key={key} variant="outline" className="text-xs py-0 px-1">
                                    {key}: {value as string}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                            <p className="text-sm font-semibold text-green-600">
                              ৳{(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="border-t pt-4 space-y-3 mb-4">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Subtotal</span>
                      <span className="font-semibold">৳{subtotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Tax (8%)</span>
                      <span className="font-semibold">৳{tax.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <div>
                        <p className="text-gray-600">Shipping</p>
                        <p className="text-xs text-gray-500">
                          {shippingOption === 'outside-dhaka' 
                            ? 'Outside Dhaka (3-5 days)' 
                            : 'Inside Dhaka (2-3 days)'}
                        </p>
                      </div>
                      <span className="font-semibold text-gray-900">
                        ৳{shipping.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-green-600">
                        ৳{total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full"
                    disabled={isSubmitting}
                    onClick={() => {
                      console.log('Place Order clicked')
                      console.log('Form values:', form.getValues())
                      console.log('Form errors:', form.formState.errors)
                      console.log('Selected shipping:', selectedShipping)
                      console.log('Show address form:', showAddressForm)
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      'Place Order'
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center mt-4">
                    🔒 Your payment information is secure
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </main>

      <Footer />

      {/* Loading Overlay */}
      {(isSubmitting || isSavingAddress) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="p-8">
            <CardContent className="flex flex-col items-center gap-4">
              <Loader2 className="w-16 h-16 animate-spin text-green-600" />
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">
                  {isSavingAddress ? 'Saving Address...' : 'Processing Your Order...'}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {isSavingAddress 
                    ? 'Please wait while we save your shipping address' 
                    : 'Please wait while we process your order'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
