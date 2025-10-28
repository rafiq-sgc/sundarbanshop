'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import AdminLayout from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Search,
  User,
  MapPin,
  Package,
  AlertCircle,
  UserPlus,
  Calculator,
  Receipt,
  Edit3,
  FileText,
  Download,
  X,
  ShoppingCart
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { z } from 'zod'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// Zod validation schemas
const orderItemSchema = z.object({
  product: z.string().optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  price: z.number().min(0, 'Price must be non-negative'),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  image: z.string().optional()
})

const customItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  price: z.number().min(0, 'Price must be non-negative'),
  total: z.number().min(0, 'Total must be non-negative')
})

const addressSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'ZIP code is required'),
  country: z.string().min(1, 'Country is required')
})

const orderFormSchema = z.object({
  user: z.string().min(1, 'Customer is required'),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  customItems: z.array(customItemSchema).default([]),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).default('pending'),
  orderStatus: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).default('pending'),
  subtotal: z.number().min(0, 'Subtotal must be non-negative'),
  tax: z.number().min(0, 'Tax must be non-negative'),
  shipping: z.number().min(0, 'Shipping must be non-negative'),
  discount: z.number().min(0, 'Discount must be non-negative'),
  total: z.number().min(0, 'Total must be non-negative'),
  currency: z.string().default('USD'),
  notes: z.string().optional(),
  createInvoice: z.boolean().default(true)
})

type OrderFormData = z.infer<typeof orderFormSchema>

interface Product {
  _id: string
  name: string
  price: number
  images: string[]
  stock: number
  description?: string
}

interface User {
  _id: string
  name: string
  email?: string
  phone: string
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
}

export default function NewOrderPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showUserSearch, setShowUserSearch] = useState(false)
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [showProductSearch, setShowProductSearch] = useState(false)
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [showInvoicePreview, setShowInvoicePreview] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    customerType: 'phone' as 'phone' | 'walkin' | 'online'
  })

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema) as any,
    mode: 'onSubmit',
    defaultValues: {
      user: '',
      items: [],
      customItems: [],
      shippingAddress: {
        name: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'United States'
      },
      billingAddress: undefined,
      paymentMethod: 'credit_card',
      paymentStatus: 'pending',
      orderStatus: 'pending',
      subtotal: 0,
      tax: 0,
      shipping: 0,
      discount: 0,
      total: 0,
      currency: 'USD',
      notes: '',
      createInvoice: true
    }
  })

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors: formErrors, isSubmitting },
    reset
  } = form

  const { fields: customItemFields, append: appendCustomItem, remove: removeCustomItem } = useFieldArray({
    control,
    name: 'customItems'
  })

  const formData = watch()

  // Fetch data on component mount
  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'admin') {
      router.push('/auth/signin')
    } else {
      fetchData()
    }
  }, [session, status, router])

  // Calculate totals when items change
  useEffect(() => {
    calculateTotals()
  }, [formData.items, formData.customItems, formData.discount])

  const fetchData = async () => {
    try {
      const [productsRes, usersRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/admin/users')
      ])
      
      const productsData = await productsRes.json()
      const usersData = await usersRes.json()
      
      console.log('Products response:', productsData)
      console.log('Users response:', usersData)
      
      if (productsData.success) {
        // Handle both formats: data.products or data (array)
        const productsList = Array.isArray(productsData.data) ? productsData.data : (productsData.data?.products || [])
        setProducts(productsList)
      }
      
      if (usersData.success) {
        // Handle both formats: data.users or data (array)
        const usersList = Array.isArray(usersData.data) ? usersData.data : (usersData.data?.users || [])
        setUsers(usersList)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const calculateTotals = () => {
    const currentItems = getValues('items') || []
    const currentCustomItems = getValues('customItems') || []
    
    const productSubtotal = currentItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const customSubtotal = currentCustomItems.reduce((sum, item) => sum + item.total, 0)
    const subtotal = productSubtotal + customSubtotal
    const tax = subtotal * 0.08 // 8% tax
    const shipping = subtotal > 50 ? 0 : 10 // Free shipping over $50
    const discount = getValues('discount') || 0
    const total = subtotal + tax + shipping - discount

    setValue('subtotal', parseFloat(subtotal.toFixed(2)))
    setValue('tax', parseFloat(tax.toFixed(2)))
    setValue('shipping', parseFloat(shipping.toFixed(2)))
    setValue('total', parseFloat(total.toFixed(2)))
  }

  const handleUserSelect = (user: User) => {
    setSelectedUser(user)
    setValue('user', user._id)
    setValue('shippingAddress.name', user.name)
    setValue('shippingAddress.phone', user.phone || '')
    
    // Set default address if available
    const defaultAddress = user.address?.find(addr => addr.isDefault) || user.address?.[0]
    if (defaultAddress) {
      setValue('shippingAddress.address', defaultAddress.address)
      setValue('shippingAddress.city', defaultAddress.city)
      setValue('shippingAddress.state', defaultAddress.state)
      setValue('shippingAddress.zipCode', defaultAddress.zipCode)
      setValue('shippingAddress.country', defaultAddress.country)
    }
    
    setShowUserSearch(false)
    setSearchTerm('')
  }

  const handleCreateNewCustomer = async () => {
    // Validate required fields
    if (!newCustomer.name) {
      toast.error('Name is required')
      return
    }
    
    if (!newCustomer.phone) {
      toast.error('Phone number is required')
      return
    }
    
    // If email is provided, password is required
    if (newCustomer.email && newCustomer.email.trim() !== '') {
      if (!newCustomer.password || newCustomer.password.length < 6) {
        toast.error('Password must be at least 6 characters when email is provided')
        return
      }
    }

    try {
      // Prepare customer data
      const customerData: any = {
        name: newCustomer.name,
        phone: newCustomer.phone,
        customerType: newCustomer.customerType,
        role: 'user'
      }
      
      // Only include email and password if email is provided
      if (newCustomer.email && newCustomer.email.trim() !== '') {
        customerData.email = newCustomer.email
        customerData.password = newCustomer.password
        customerData.canLogin = true
      } else {
        customerData.canLogin = false
      }
      
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      })

      const result = await response.json()
      console.log("user", result)
      
      if (result.success) {
        const user = result.data
        
        // Send welcome email if user has email and credentials
        if (user.isNewUser && user.email && user.temporaryPassword) {
          console.log('Sending welcome email with credentials to:', user.email)
          
          // Import and process template
          import('@/lib/email-templates').then(({ emailTemplates }) => {
            const template = emailTemplates.find(t => t.id === 'welcome-with-credentials')
            
            if (template) {
              // Replace variables in template
              let emailBody = template.body
              let emailSubject = template.subject
              
              const variables = {
                name: user.name,
                email: user.email,
                password: user.temporaryPassword,
                loginUrl: `${window.location.origin}/auth/signin`,
                storeName: 'Sundarban Shop'
              }
              
              // Replace all variables
              Object.entries(variables).forEach(([key, value]) => {
                const regex = new RegExp(`\\$\\{\\{${key}\\}\\}|\\{\\{${key}\\}\\}`, 'g')
                emailBody = emailBody.replace(regex, value)
                emailSubject = emailSubject.replace(regex, value)
              })
              
              // Send email with processed template
              fetch('/api/admin/emails/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  to: {
                    email: user.email,
                    name: user.name
                  },
                  subject: emailSubject,
                  body: emailBody,
                  priority: 'high'
                })
              }).then(() => {
                console.log('Welcome email sent successfully!')
              }).catch((err) => {
                console.error('Failed to send welcome email:', err)
              })
            }
          }).catch((err) => {
            console.error('Failed to load email template:', err)
          })
        }
        
        handleUserSelect(user)
        setUsers([...users, user])
        setNewCustomer({ name: '', email: '', phone: '', password: '', customerType: 'phone' })
        setShowNewCustomer(false)
        toast.success('Customer created successfully' + (user.email ? ' - Welcome email sent!' : ''))
      } else {
        toast.error(result.message || 'Failed to create customer')
      }
    } catch (error) {
      console.error('Error creating customer:', error)
      toast.error('Failed to create customer')
    }
  }

  const handleAddProduct = (product: Product) => {
    const currentItems = getValues('items') || []
    const existingItem = currentItems.find(item => item.product === product._id)
    
    if (existingItem) {
      setValue('items', currentItems.map(item => 
        item.product === product._id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
      toast.success(`Increased quantity of ${product.name}`)
    } else {
      setValue('items', [...currentItems, {
        product: product._id,
        name: product.name,
        description: product.description || '',
        image: product.images[0] || '',
        quantity: 1,
        price: product.price
      }])
      toast.success(`Added ${product.name} to order`)
    }
    
    setShowProductSearch(false)
    setProductSearchTerm('')
  }

  const handleRemoveProduct = (index: number) => {
    const currentItems = getValues('items') || []
    setValue('items', currentItems.filter((_, i) => i !== index))
    toast.success('Item removed from order')
  }

  const handleQuantityChange = (index: number, quantity: number) => {
    if (quantity < 1) return
    const currentItems = getValues('items') || []
    const updatedItems = [...currentItems]
    updatedItems[index] = { ...updatedItems[index], quantity }
    setValue('items', updatedItems)
  }

  const handlePriceChange = (index: number, price: number) => {
    if (price < 0) return
    const currentItems = getValues('items') || []
    const updatedItems = [...currentItems]
    updatedItems[index] = { ...updatedItems[index], price }
    setValue('items', updatedItems)
  }

  const handleAddCustomItem = () => {
    appendCustomItem({
      name: '',
      description: '',
      quantity: 1,
      price: 0,
      total: 0
    })
  }

  const handleCustomItemChange = (index: number, field: string, value: any) => {
    const currentCustomItems = getValues('customItems') || []
    const updatedItems = [...currentCustomItems]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    
    // Calculate total for custom item
    if (field === 'quantity' || field === 'price') {
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].price
    }
    
    setValue('customItems', updatedItems)
  }

  const onSubmit = async (data: OrderFormData) => {
    console.log('Form submitted!', data)
    setSaving(true)

    try {
      // Combine product items and custom items
      const allItems = [
        ...data.items,
        ...data.customItems.map((item) => ({
          product: 'custom',
          name: item.name,
          description: item.description || '',
          quantity: item.quantity,
          price: item.price,
          image: ''
        }))
      ]

      // Prepare order data without customItems field
      const { customItems, createInvoice, billingAddress, ...orderFields } = data
      const orderData = {
        ...orderFields,
        items: allItems,
        // Only include billingAddress if it has data, otherwise use shippingAddress
        billingAddress: billingAddress || data.shippingAddress
      }
      
      console.log('Submitting order data:', JSON.stringify(orderData, null, 2))
      
      // Create order
      const orderResponse = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      })

      const orderResult = await orderResponse.json()
      console.log('Order creation result:', orderResult)

      if (orderResult.success) {
        // Create invoice if requested
        if (createInvoice) {
          try {
            const invoiceResponse = await fetch('/api/admin/invoices', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ orderId: orderResult.data._id })
            })

            const invoiceResult = await invoiceResponse.json()
            console.log('Invoice creation result:', invoiceResult)
            
            if (invoiceResult.success) {
              toast.success('Order and invoice created successfully!')
            } else {
              console.error('Invoice creation failed:', invoiceResult)
              toast.success('Order created successfully!')
              toast.error(invoiceResult.message || 'Failed to create invoice')
            }
          } catch (error) {
            console.error('Error creating invoice:', error)
            toast.success('Order created successfully!')
            toast.error('Failed to create invoice')
          }
        } else {
          toast.success('Order created successfully!')
        }

        // Redirect to order details page
        setTimeout(() => {
          router.push(`/admin/orders/${orderResult.data._id}`)
        }, 1000)
      } else {
        console.error('Order creation failed:', orderResult)
        if (orderResult.errors) {
          orderResult.errors.forEach((err: any) => {
            toast.error(`${err.field}: ${err.message}`)
          })
        } else {
          toast.error(orderResult.message || 'Failed to create order')
        }
      }
    } catch (error) {
      console.error('Error creating order:', error)
      toast.error('Failed to create order. Please check console for details.')
    } finally {
      setSaving(false)
    }
  }

  const exportToPDF = async () => {
    try {
      const element = document.getElementById('invoice-preview')
      if (!element) return

      toast.loading('Generating PDF...')

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      // A4 dimensions: 210mm x 297mm
      const pdfWidth = 210
      const pdfHeight = 297
      
      // Calculate image dimensions to fit A4
      const imgWidth = pdfWidth
      const imgHeight = (canvas.height * pdfWidth) / canvas.width
      
      // If content fits on one page, just add it
      if (imgHeight <= pdfHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      } else {
        // If content is larger, add multiple pages
        let heightLeft = imgHeight
        let position = 0
        
        // First page
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pdfHeight
        
        // Additional pages if needed
        while (heightLeft > 0) {
          position = heightLeft - imgHeight
          pdf.addPage()
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
          heightLeft -= pdfHeight
        }
      }

      pdf.save(`invoice-${Date.now()}.pdf`)
      toast.dismiss()
      toast.success('Invoice exported successfully!')
    } catch (error) {
      console.error('Error exporting PDF:', error)
      toast.dismiss()
      toast.error('Failed to export PDF')
    }
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 10)

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearchTerm.toLowerCase())
  ).slice(0, 12)

  if (loading || status === 'loading') {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/admin/orders"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Order</h1>
            <p className="text-gray-600">Manually create an order for customers</p>
          </div>
        </div>
        <Form {...form}>
          <form 
            onSubmit={handleSubmit(
              onSubmit,
              (errors) => {
                console.log('Form validation errors:', errors)
                toast.error('Please fill in all required fields')
              }
            )} 
            className="space-y-6"
          >
            {/* Customer Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Selection
                </CardTitle>
                <CardDescription>
                  Search for existing customer or create a new one
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedUser ? (
                  <>
                    {!showNewCustomer ? (
                      <>
                        <FormField
                          control={control}
                          name="user"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Customer</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                  <Input
                                    {...field}
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => {
                                      setSearchTerm(e.target.value)
                                      setShowUserSearch(true)
                                    }}
                                    onFocus={() => setShowUserSearch(true)}
                                    placeholder="Search by name or email..."
                                    className="pl-10"
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {showUserSearch && searchTerm && (
                          <Card className="max-h-60 overflow-y-auto">
                            <CardContent className="p-0">
                              {filteredUsers.length > 0 ? (
                                <>
                                  {filteredUsers.map(user => (
                                    <button
                                      key={user._id}
                                      type="button"
                                      onClick={() => handleUserSelect(user)}
                                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                                    >
                                      <div className="font-medium text-gray-900">{user.name}</div>
                                      <div className="text-sm text-gray-500">{user.email}</div>
                                      {user.phone && <div className="text-xs text-gray-400">{user.phone}</div>}
                                    </button>
                                  ))}
                                  {users.length > 10 && (
                                    <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50">
                                      Showing 10 of {users.length} customers
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="px-4 py-3 text-gray-500 text-center">
                                  No customers found
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )}
                      </>
                    ) : (
                      <Card className="bg-green-50 border-green-200">
                        <CardHeader>
                          <CardTitle className="text-lg text-green-900">Create New Customer</CardTitle>
                          <CardDescription className="text-green-700">
                            Phone is required. Email is optional but enables account login.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="newCustomerName">
                                Name <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="newCustomerName"
                                type="text"
                                value={newCustomer.name}
                                onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                                placeholder="John Doe"
                              />
                            </div>
                            <div>
                              <Label htmlFor="newCustomerPhone">
                                Phone <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="newCustomerPhone"
                                type="tel"
                                value={newCustomer.phone}
                                onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                                placeholder="+1 (555) 123-4567"
                              />
                            </div>
                            <div>
                              <Label htmlFor="newCustomerEmail">
                                Email (Optional)
                              </Label>
                              <Input
                                id="newCustomerEmail"
                                type="email"
                                value={newCustomer.email}
                                onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                                placeholder="john@example.com"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Required for account login
                              </p>
                            </div>
                            <div>
                              <Label htmlFor="newCustomerPassword">
                                Password {newCustomer.email && newCustomer.email.trim() !== '' && <span className="text-red-500">*</span>}
                              </Label>
                              <Input
                                id="newCustomerPassword"
                                type="password"
                                value={newCustomer.password}
                                onChange={(e) => setNewCustomer({...newCustomer, password: e.target.value})}
                                placeholder="••••••••"
                                disabled={!newCustomer.email || newCustomer.email.trim() === ''}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                {newCustomer.email && newCustomer.email.trim() !== '' 
                                  ? 'Required when email is provided' 
                                  : 'Only needed if email is provided'}
                              </p>
                            </div>
                          </div>
                          
                          {/* Customer Type Info */}
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800">
                              <strong>Customer Type:</strong> Phone Order Customer
                              {newCustomer.email && newCustomer.email.trim() !== '' && newCustomer.password
                                ? ' (Can login to dashboard)' 
                                : ' (Cannot login - no email/password)'}
                            </p>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              onClick={handleCreateNewCustomer}
                              className="flex items-center gap-2"
                            >
                              <UserPlus className="w-4 h-4" />
                              Create Customer
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowNewCustomer(false)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    <Button
                      type="button"
                      onClick={() => setShowNewCustomer(!showNewCustomer)}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      {showNewCustomer ? 'Search Existing Customer' : 'Create New Customer'}
                    </Button>
                  </>
                ) : (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <h3 className="font-semibold text-blue-900">{selectedUser.name}</h3>
                        <p className="text-sm text-blue-700">{selectedUser.email}</p>
                        {selectedUser.phone && <p className="text-xs text-blue-600">{selectedUser.phone}</p>}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(null)
                          setValue('user', '')
                        }}
                      >
                        Change
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* Products Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Products Selection
                </CardTitle>
                <CardDescription>
                  Search and add products to the order
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="text"
                      value={productSearchTerm}
                      onChange={(e) => {
                        setProductSearchTerm(e.target.value)
                        setShowProductSearch(true)
                      }}
                      onFocus={() => setShowProductSearch(true)}
                      placeholder="Search products..."
                      className="pl-10"
                    />
                  </div>
                </div>

                {showProductSearch && productSearchTerm && (
                  <Card className="max-h-96 overflow-y-auto">
                    <CardContent className="p-0">
                      {filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
                          {filteredProducts.map(product => (
                            <button
                              key={product._id}
                              type="button"
                              onClick={() => handleAddProduct(product)}
                              className="flex items-center gap-3 p-3 text-left hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors"
                            >
                              <img 
                                src={product.images[0] || '/placeholder.png'} 
                                alt={product.name}
                                className="w-16 h-16 object-cover rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 truncate">{product.name}</div>
                                <div className="text-sm text-gray-500">${product.price.toFixed(2)}</div>
                                <div className="text-xs text-gray-400">Stock: {product.stock}</div>
                              </div>
                              <Plus className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="px-4 py-8 text-gray-500 text-center">
                          No products found
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Selected Products */}
                {formData.items && formData.items.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Selected Products ({formData.items.length})</Label>
                    <div className="space-y-2">
                      {formData.items.map((item, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <img 
                                src={item.image || '/placeholder.png'} 
                                alt={item.name}
                                className="w-16 h-16 object-cover rounded"
                              />
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{item.name}</h4>
                                <div className="flex items-center gap-4 mt-2">
                                  <div className="flex items-center gap-2">
                                    <Label className="text-xs">Qty:</Label>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleQuantityChange(index, item.quantity - 1)}
                                        className="h-7 w-7 p-0"
                                      >
                                        -
                                      </Button>
                                      <Input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                                        className="w-16 h-7 text-center px-2"
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleQuantityChange(index, item.quantity + 1)}
                                        className="h-7 w-7 p-0"
                                      >
                                        +
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Label className="text-xs">Price:</Label>
                                    <div className="relative">
                                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={item.price}
                                        onChange={(e) => handlePriceChange(index, parseFloat(e.target.value) || 0)}
                                        className="w-24 h-7 pl-6"
                                      />
                                    </div>
                                  </div>
                                  <div className="text-sm font-semibold text-gray-900">
                                    Total: ${(item.price * item.quantity).toFixed(2)}
                                  </div>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveProduct(index)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Custom Items Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Custom Items (Optional)
                </CardTitle>
                <CardDescription>
                  Add custom items that are not in your product catalog
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {customItemFields.length > 0 && (
                  <div className="space-y-3">
                    {customItemFields.map((field, index) => (
                      <Card key={field.id}>
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                            <div className="md:col-span-3">
                              <Label className="text-xs">Item Name</Label>
                              <Controller
                                name={`customItems.${index}.name`}
                                control={control}
                                render={({ field: nameField }) => (
                                  <Input
                                    {...nameField}
                                    onChange={(e) => {
                                      nameField.onChange(e)
                                      handleCustomItemChange(index, 'name', e.target.value)
                                    }}
                                    placeholder="Item name"
                                    className="h-9"
                                  />
                                )}
                              />
                            </div>
                            <div className="md:col-span-3">
                              <Label className="text-xs">Description</Label>
                              <Controller
                                name={`customItems.${index}.description`}
                                control={control}
                                render={({ field: descField }) => (
                                  <Input
                                    {...descField}
                                    onChange={(e) => {
                                      descField.onChange(e)
                                      handleCustomItemChange(index, 'description', e.target.value)
                                    }}
                                    placeholder="Optional"
                                    className="h-9"
                                  />
                                )}
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Label className="text-xs">Quantity</Label>
                              <Controller
                                name={`customItems.${index}.quantity`}
                                control={control}
                                render={({ field: qtyField }) => (
                                  <Input
                                    {...qtyField}
                                    type="number"
                                    onChange={(e) => {
                                      const value = parseInt(e.target.value) || 1
                                      qtyField.onChange(value)
                                      handleCustomItemChange(index, 'quantity', value)
                                    }}
                                    className="h-9"
                                  />
                                )}
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Label className="text-xs">Price</Label>
                              <Controller
                                name={`customItems.${index}.price`}
                                control={control}
                                render={({ field: priceField }) => (
                                  <Input
                                    {...priceField}
                                    type="number"
                                    step="0.01"
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0
                                      priceField.onChange(value)
                                      handleCustomItemChange(index, 'price', value)
                                    }}
                                    className="h-9"
                                  />
                                )}
                              />
                            </div>
                            <div className="md:col-span-1">
                              <Label className="text-xs">Total</Label>
                              <div className="h-9 flex items-center font-semibold text-gray-900">
                                ${formData.customItems[index]?.total?.toFixed(2) || '0.00'}
                              </div>
                            </div>
                            <div className="md:col-span-1 flex items-end">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeCustomItem(index)}
                                className="h-9 text-red-600 hover:text-red-800 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                
                <Button
                  type="button"
                  onClick={handleAddCustomItem}
                  variant="outline"
                  className="w-full flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Custom Item
                </Button>
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
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name="shippingAddress.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Full name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="shippingAddress.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+1 (555) 123-4567" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="shippingAddress.address"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Address <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Street address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="shippingAddress.city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="City" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="shippingAddress.state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="State" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="shippingAddress.zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="12345" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="shippingAddress.country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="United States" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Order Summary & Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Order Summary & Pricing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-600 font-medium">Subtotal</span>
                      <span className="text-xl font-bold text-gray-900">
                        ${formData.subtotal.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-600 font-medium">Tax (8%)</span>
                      <span className="text-xl font-bold text-gray-900">
                        ${formData.tax.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-600 font-medium">Shipping</span>
                      <span className="text-xl font-bold text-gray-900">
                        ${formData.shipping.toFixed(2)}
                      </span>
                    </div>
                    
                    <FormField
                      control={control}
                      name="discount"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <span className="text-gray-600 font-medium">Discount</span>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-semibold">$</span>
                              <Input
                                {...field}
                                type="number"
                                step="0.01"
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0
                                  field.onChange(value)
                                }}
                                className="w-24 px-2 py-1 text-right"
                              />
                            </div>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="border-t-2 border-gray-200 pt-4">
                    <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                      <span className="text-xl font-bold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-blue-600">
                        ${formData.total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <FormField
                    control={control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order Notes (Optional)</FormLabel>
                        <FormControl>
                          <textarea
                            {...field}
                            rows={3}
                            placeholder="Add any special instructions or notes..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Invoice Creation Option */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Invoice Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={control}
                  name="createInvoice"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 bg-gray-50 rounded-lg">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Automatically create invoice for this order
                        </FormLabel>
                        <p className="text-xs text-gray-500">
                          An invoice will be generated and linked to this order
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" asChild>
                  <Link href="/admin/orders">Cancel</Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    console.log('Current form data:', getValues())
                    console.log('Form errors:', formErrors)
                  }}
                  className="flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  Debug Form
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowInvoicePreview(true)}
                  className="flex items-center gap-2"
                >
                  <Receipt className="w-4 h-4" />
                  Invoice Preview
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={exportToPDF}
                  className="flex items-center gap-2"
                  disabled={formData.items.length === 0 && formData.customItems.length === 0}
                >
                  <Download className="w-4 h-4" />
                  Export Invoice
                </Button>
                <Button
                  type="submit"
                  disabled={saving || isSubmitting}
                  className="flex items-center gap-2"
                  onClick={(e) => {
                    console.log('Submit button clicked')
                    console.log('Form is valid?', Object.keys(formErrors).length === 0)
                  }}
                >
                  {saving || isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating Order...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Create Order & Invoice
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>

        {/* Invoice Preview Modal */}
        {showInvoicePreview && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header - Not included in PDF */}
              <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <div className="flex items-center gap-3">
                  <Receipt className="w-6 h-6" />
                  <h2 className="text-xl font-bold">Invoice Preview</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={exportToPDF}
                    className="bg-white text-blue-600 hover:bg-blue-50 flex items-center gap-2 shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    Export PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowInvoicePreview(false)}
                    className="bg-white/10 text-white border-white/20 hover:bg-white/20 flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Close
                  </Button>
                </div>
              </div>

              {/* Invoice Content - This will be exported to PDF */}
              <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
                <div id="invoice-preview" className="mx-auto bg-white shadow-lg" style={{ width: '210mm', padding: '20mm' }}>
                  {/* A4 Standard Paper Style: 210mm x 297mm with proper padding */}
                    {/* Invoice Header - Compact */}
                    <div className="flex justify-between items-start mb-4 pb-3 border-b-2 border-blue-600">
                      <div>
                        <h1 className="text-3xl font-bold text-blue-600 mb-1">INVOICE</h1>
                        <p className="text-gray-700 text-sm font-semibold">Invoice #INV-{Date.now().toString().slice(-6)}</p>
                        <p className="text-gray-600 text-xs">Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                      </div>
                      <div className="text-right">
                        <h2 className="text-2xl font-bold text-blue-600 mb-1">EKOMART</h2>
                        <div className="text-xs text-gray-600">
                          <p>123 Business Street, City, State 12345</p>
                          <p>info@ekomart.com | +1 (555) 123-4567</p>
                        </div>
                      </div>
                    </div>

                    {/* Customer Info - Compact without borders */}
                    {selectedUser && (
                      <div className="grid grid-cols-2 gap-6 mb-4 text-xs">
                        <div>
                          <h3 className="font-bold text-gray-500 uppercase tracking-wide mb-1.5">Bill To</h3>
                          <div className="space-y-0.5">
                            <p className="font-bold text-gray-900">{selectedUser.name}</p>
                            <p className="text-gray-700">{selectedUser.email}</p>
                            {selectedUser.phone && <p className="text-gray-700">{selectedUser.phone}</p>}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-500 uppercase tracking-wide mb-1.5">Ship To</h3>
                          <div className="space-y-0.5">
                            <p className="font-bold text-gray-900">{formData.shippingAddress.name}</p>
                            <p className="text-gray-700">{formData.shippingAddress.address}</p>
                            <p className="text-gray-700">
                              {formData.shippingAddress.city}, {formData.shippingAddress.state} {formData.shippingAddress.zipCode}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Invoice Items Table - Compact */}
                    <div className="mb-3">
                      <table className="w-full text-xs" style={{ borderCollapse: 'collapse', border: '1px solid #d1d5db' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#2563eb' }}>
                            <th style={{ border: '1px solid #d1d5db', padding: '10px 12px', textAlign: 'left', verticalAlign: 'middle', fontWeight: 'bold', color: 'white', fontSize: '11px', textTransform: 'uppercase' }}>
                              Product
                            </th>
                            <th style={{ border: '1px solid #d1d5db', padding: '10px 12px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold', color: 'white', fontSize: '11px', textTransform: 'uppercase', width: '80px' }}>
                              Qty
                            </th>
                            <th style={{ border: '1px solid #d1d5db', padding: '10px 12px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold', color: 'white', fontSize: '11px', textTransform: 'uppercase', width: '100px' }}>
                              Price
                            </th>
                            <th style={{ border: '1px solid #d1d5db', padding: '10px 12px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold', color: 'white', fontSize: '11px', textTransform: 'uppercase', width: '100px' }}>
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.items.length === 0 && formData.customItems.length === 0 ? (
                            <tr>
                              <td colSpan={4} style={{ border: '1px solid #d1d5db', padding: '24px 12px', textAlign: 'center', verticalAlign: 'middle', color: '#6b7280' }}>
                                No items added yet
                              </td>
                            </tr>
                          ) : (
                            <>
                              {formData.items.map((item, index) => (
                                <tr key={index}>
                                  <td style={{ border: '1px solid #d1d5db', padding: '10px 12px', verticalAlign: 'middle' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      {item.image && (
                                        <img 
                                          src={item.image} 
                                          alt={item.name}
                                          style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px' }}
                                        />
                                      )}
                                      <span style={{ fontWeight: '600', color: '#111827', fontSize: '12px' }}>{item.name}</span>
                                    </div>
                                  </td>
                                  <td style={{ border: '1px solid #d1d5db', padding: '10px 12px', textAlign: 'center', verticalAlign: 'middle', fontWeight: '500', color: '#111827', fontSize: '12px' }}>
                                    {item.quantity}
                                  </td>
                                  <td style={{ border: '1px solid #d1d5db', padding: '10px 12px', textAlign: 'center', verticalAlign: 'middle', color: '#111827', fontSize: '12px' }}>
                                    ${item.price.toFixed(2)}
                                  </td>
                                  <td style={{ border: '1px solid #d1d5db', padding: '10px 12px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold', color: '#111827', fontSize: '12px' }}>
                                    ${(item.price * item.quantity).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                              {formData.customItems.map((item, index) => (
                                <tr key={`custom-${index}`} style={{ backgroundColor: '#f9fafb' }}>
                                  <td style={{ border: '1px solid #d1d5db', padding: '10px 12px', verticalAlign: 'middle' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <div style={{ width: '32px', height: '32px', backgroundColor: '#dbeafe', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        📦
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontWeight: '600', color: '#111827', fontSize: '12px' }}>{item.name}</span>
                                        <span style={{ display: 'inline-block', padding: '2px 6px', borderRadius: '3px', fontSize: '9px', fontWeight: '600', backgroundColor: '#2563eb', color: 'white' }}>
                                          Custom
                                        </span>
                                      </div>
                                    </div>
                                  </td>
                                  <td style={{ border: '1px solid #d1d5db', padding: '10px 12px', textAlign: 'center', verticalAlign: 'middle', fontWeight: '500', color: '#111827', fontSize: '12px' }}>
                                    {item.quantity}
                                  </td>
                                  <td style={{ border: '1px solid #d1d5db', padding: '10px 12px', textAlign: 'center', verticalAlign: 'middle', color: '#111827', fontSize: '12px' }}>
                                    ${item.price.toFixed(2)}
                                  </td>
                                  <td style={{ border: '1px solid #d1d5db', padding: '10px 12px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold', color: '#111827', fontSize: '12px' }}>
                                    ${item.total.toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Totals Section - Compact */}
                    <div className="flex justify-end mb-3">
                      <div style={{ width: '250px' }}>
                        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                          <tbody>
                            <tr style={{ borderBottom: '1px solid #d1d5db' }}>
                              <td style={{ padding: '6px 16px 6px 0', textAlign: 'right', fontWeight: '500', color: '#374151' }}>Subtotal:</td>
                              <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: '600', color: '#111827' }}>${formData.subtotal.toFixed(2)}</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #d1d5db' }}>
                              <td style={{ padding: '6px 16px 6px 0', textAlign: 'right', fontWeight: '500', color: '#374151' }}>Tax (8%):</td>
                              <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: '600', color: '#111827' }}>${formData.tax.toFixed(2)}</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #d1d5db' }}>
                              <td style={{ padding: '6px 16px 6px 0', textAlign: 'right', fontWeight: '500', color: '#374151' }}>Shipping:</td>
                              <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: '600', color: '#111827' }}>
                                {formData.shipping === 0 ? 'FREE' : `$${formData.shipping.toFixed(2)}`}
                              </td>
                            </tr>
                            {formData.discount > 0 && (
                              <tr style={{ borderBottom: '1px solid #d1d5db' }}>
                                <td style={{ padding: '6px 16px 6px 0', textAlign: 'right', fontWeight: '500', color: '#374151' }}>Discount:</td>
                                <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: '600', color: '#dc2626' }}>-${formData.discount.toFixed(2)}</td>
                              </tr>
                            )}
                            <tr style={{ backgroundColor: '#2563eb' }}>
                              <td style={{ padding: '10px 16px 10px 0', textAlign: 'right', fontWeight: 'bold', color: 'white', fontSize: '14px' }}>Total:</td>
                              <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 'bold', color: 'white', fontSize: '18px' }}>${formData.total.toFixed(2)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Payment Information - Compact */}
                    <div className="mb-3 grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="font-bold text-gray-500 uppercase">Payment Method: </span>
                        <span className="text-gray-900 font-semibold capitalize">{formData.paymentMethod.replace('_', ' ')}</span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-500 uppercase">Payment Status: </span>
                        <span className="text-gray-900 font-semibold capitalize">{formData.paymentStatus}</span>
                      </div>
                    </div>

                    {/* Notes - Compact */}
                    {formData.notes && (
                      <div className="mb-3 text-xs">
                        <p className="font-bold text-gray-500 uppercase mb-1">Notes:</p>
                        <p className="text-gray-700 leading-relaxed">{formData.notes}</p>
                      </div>
                    )}

                    {/* Terms & Conditions - Compact */}
                    <div className="mb-3 pt-3 border-t border-gray-300">
                      <p className="font-bold text-gray-500 uppercase text-xs mb-1.5">Terms & Conditions</p>
                      <div className="text-[10px] text-gray-600 space-y-0.5">
                        <p>1. Payment due within 30 days | 2. Include invoice number with payment</p>
                        <p>3. 1.5% monthly late fee applies | 4. All sales final unless stated otherwise</p>
                      </div>
                    </div>

                    {/* Footer - Compact */}
                    <div className="pt-3 border-t-2 border-blue-600 text-center">
                      <p className="text-sm font-bold text-gray-900 mb-1">Thank You For Your Business!</p>
                      <p className="text-[10px] text-gray-700">
                        Questions? Email: <span className="font-semibold">info@ekomart.com</span> | Phone: <span className="font-semibold">+1 (555) 123-4567</span>
                      </p>
                    </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}


