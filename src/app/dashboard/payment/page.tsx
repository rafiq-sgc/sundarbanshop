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
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CreditCard,
  Plus,
  Edit,
  Trash2,
  Star,
  Smartphone,
  Building2,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { paymentService, type PaymentMethod } from '@/services/dashboard'

// Zod validation schemas
const cardSchema = z.object({
  type: z.literal('card'),
  cardHolderName: z.string().min(2, 'Cardholder name is required'),
  cardNumber: z.string()
    .min(16, 'Card number must be 16 digits')
    .max(16, 'Card number must be 16 digits')
    .regex(/^\d+$/, 'Card number must contain only digits'),
  expiryDate: z.string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Expiry date must be in MM/YY format'),
  isDefault: z.boolean().default(false)
})

const mobileWalletSchema = z.object({
  type: z.enum(['bkash', 'nagad', 'rocket']),
  accountNumber: z.string()
    .min(11, 'Account number must be 11 digits')
    .regex(/^01[3-9]\d{8}$/, 'Invalid Bangladeshi phone number'),
  accountName: z.string().min(2, 'Account name is required'),
  isDefault: z.boolean().default(false)
})

const bankSchema = z.object({
  type: z.literal('bank'),
  bankName: z.string().min(2, 'Bank name is required'),
  accountNumber: z.string().min(5, 'Account number is required'),
  accountHolderName: z.string().min(2, 'Account holder name is required'),
  routingNumber: z.string().optional(),
  isDefault: z.boolean().default(false)
})

const paymentMethodSchema = z.discriminatedUnion('type', [
  cardSchema,
  mobileWalletSchema,
  bankSchema
])

type PaymentMethodFormData = z.infer<typeof paymentMethodSchema>

export default function PaymentMethodsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)
  const [selectedType, setSelectedType] = useState<'card' | 'bkash' | 'nagad' | 'rocket' | 'bank'>('card')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<any>({
    resolver: zodResolver(paymentMethodSchema) as any,
    defaultValues: {
      type: 'card',
      isDefault: false
    }
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/dashboard/payment')
    } else if (status === 'authenticated') {
      fetchPaymentMethods()
    }
  }, [status, router])

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true)
      const result = await paymentService.getPaymentMethods()
      if (result.success && result.data) {
        setPaymentMethods(result.data)
      }
    } catch (error: any) {
      console.error('Error fetching payment methods:', error)
      toast.error(error.message || 'Failed to load payment methods')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAddModal = () => {
    setEditingMethod(null)
    setSelectedType('card')
    form.reset({
      type: 'card',
      isDefault: paymentMethods.length === 0
    })
    setShowModal(true)
  }

  const handleOpenEditModal = (method: PaymentMethod) => {
    setEditingMethod(method)
    setSelectedType(method.type)
    form.reset(method)
    setShowModal(true)
  }

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true)

      if (editingMethod) {
        const result = await paymentService.updatePaymentMethod(editingMethod._id!, data)
        if (result.success) {
          toast.success('Payment method updated successfully')
          await fetchPaymentMethods()
          setShowModal(false)
        }
      } else {
        const result = await paymentService.addPaymentMethod(data)
        if (result.success) {
          toast.success('Payment method added successfully')
          await fetchPaymentMethods()
          setShowModal(false)
        }
      }
    } catch (error: any) {
      console.error('Error saving payment method:', error)
      toast.error(error.message || 'Failed to save payment method')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSetDefault = async (methodId: string) => {
    try {
      const result = await paymentService.setDefaultPaymentMethod(methodId)
      if (result.success) {
        toast.success('Default payment method updated')
        await fetchPaymentMethods()
      }
    } catch (error: any) {
      console.error('Error setting default:', error)
      toast.error(error.message || 'Failed to set default payment method')
    }
  }

  const handleDelete = async (methodId: string, isDefault: boolean) => {
    if (isDefault) {
      toast.error('Cannot delete default payment method. Please set another method as default first.')
      return
    }

    if (!confirm('Are you sure you want to delete this payment method?')) {
      return
    }

    try {
      const result = await paymentService.deletePaymentMethod(methodId)
      if (result.success) {
        toast.success('Payment method deleted successfully')
        await fetchPaymentMethods()
      }
    } catch (error: any) {
      console.error('Error deleting payment method:', error)
      toast.error(error.message || 'Failed to delete payment method')
    }
  }

  const maskCardNumber = (number: string) => {
    if (!number) return ''
    return `**** **** **** ${number.slice(-4)}`
  }

  const getPaymentIcon = (type: string) => {
    switch (type) {
      case 'card':
        return <CreditCard className="w-5 h-5 text-blue-600" />
      case 'bkash':
      case 'nagad':
      case 'rocket':
        return <Smartphone className="w-5 h-5 text-pink-600" />
      case 'bank':
        return <Building2 className="w-5 h-5 text-green-600" />
      default:
        return <CreditCard className="w-5 h-5 text-gray-600" />
    }
  }

  const getPaymentLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container py-8">
          <div className="animate-pulse space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 rounded-lg"></div>
            ))}
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
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-600">
          <ol className="flex items-center space-x-2">
            <li><Link href="/" className="hover:text-green-600">Home</Link></li>
            <li>/</li>
            <li><Link href="/dashboard" className="hover:text-green-600">Dashboard</Link></li>
            <li>/</li>
            <li className="text-gray-900">Payment Methods</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-green-600" />
              Payment Methods
            </h1>
            <p className="text-gray-600 mt-2">Manage your payment methods for faster checkout</p>
          </div>
          <Button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2"
            size="lg"
          >
            <Plus className="w-5 h-5" />
            Add Payment Method
          </Button>
        </div>

        {/* Payment Methods Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paymentMethods.map((method) => (
            <div
              key={method._id}
              className={`bg-white rounded-xl shadow-sm border-2 p-6 transition-all hover:shadow-lg ${
                method.isDefault ? 'border-green-500' : 'border-gray-200'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  {getPaymentIcon(method.type)}
                  <span className="font-semibold text-gray-900">{getPaymentLabel(method.type)}</span>
                </div>
                {method.isDefault && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    Default
                  </span>
                )}
              </div>

              {/* Method Details */}
              <div className="space-y-2 mb-4">
                {method.type === 'card' && (
                  <>
                    <p className="font-medium text-gray-900">{method.cardHolderName}</p>
                    <p className="text-gray-600 font-mono">{maskCardNumber(method.cardNumber || '')}</p>
                    <p className="text-sm text-gray-500">Expires: {method.expiryDate}</p>
                  </>
                )}
                {(method.type === 'bkash' || method.type === 'nagad' || method.type === 'rocket') && (
                  <>
                    <p className="font-medium text-gray-900">{method.accountName}</p>
                    <p className="text-gray-600">{method.accountNumber}</p>
                  </>
                )}
                {method.type === 'bank' && (
                  <>
                    <p className="font-medium text-gray-900">{method.accountHolderName}</p>
                    <p className="text-gray-600">{method.bankName}</p>
                    <p className="text-sm text-gray-500">Account: {method.accountNumber}</p>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                {!method.isDefault && (
                  <Button
                    onClick={() => handleSetDefault(method._id!)}
                    variant="outline"
                    className="flex-1 border-green-600 text-green-600 hover:bg-green-50"
                  >
                    Set as Default
                  </Button>
                )}
                <Button
                  onClick={() => handleOpenEditModal(method)}
                  variant="outline"
                  size="icon"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => handleDelete(method._id!, method.isDefault)}
                  variant="outline"
                  size="icon"
                  disabled={method.isDefault}
                  className={method.isDefault ? '' : 'border-red-300 hover:bg-red-50'}
                >
                  <Trash2 className={`w-4 h-4 ${method.isDefault ? 'text-gray-400' : 'text-red-600'}`} />
                </Button>
              </div>
            </div>
          ))}

          {/* Add New Payment Method Card */}
          <button
            onClick={handleOpenAddModal}
            className="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 p-12 hover:border-green-500 hover:bg-green-50 transition-all flex flex-col items-center justify-center gap-4 group"
          >
            <div className="w-16 h-16 bg-gray-100 group-hover:bg-green-100 rounded-full flex items-center justify-center transition-colors">
              <Plus className="w-8 h-8 text-gray-400 group-hover:text-green-600 transition-colors" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">Add Payment Method</p>
              <p className="text-sm text-gray-500">Add a card, mobile wallet, or bank account</p>
            </div>
          </button>
        </div>
      </main>

      {/* Payment Method Form Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
            </DialogTitle>
            <DialogDescription>
              {editingMethod 
                ? 'Update your payment method details' 
                : 'Choose a payment method and fill in the details'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Payment Type Selection */}
            <div>
              <Label>Payment Type *</Label>
              <Select
                value={selectedType}
                onValueChange={(value: any) => {
                  setSelectedType(value)
                  form.setValue('type', value)
                  // Reset form when type changes
                  form.reset({ type: value, isDefault: form.getValues('isDefault') })
                }}
                disabled={!!editingMethod}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Credit/Debit Card</SelectItem>
                  <SelectItem value="bkash">bKash</SelectItem>
                  <SelectItem value="nagad">Nagad</SelectItem>
                  <SelectItem value="rocket">Rocket</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Card Fields */}
            {selectedType === 'card' && (
              <>
                <div>
                  <Label htmlFor="cardHolderName">Cardholder Name *</Label>
                  <Input
                    id="cardHolderName"
                    {...form.register('cardHolderName')}
                    placeholder="John Doe"
                    disabled={isSubmitting}
                  />
                  {form.formState.errors.cardHolderName && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.cardHolderName.message as string}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="cardNumber">Card Number *</Label>
                  <Input
                    id="cardNumber"
                    {...form.register('cardNumber')}
                    placeholder="1234567812345678"
                    maxLength={16}
                    disabled={isSubmitting}
                  />
                  {form.formState.errors.cardNumber && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.cardNumber.message as string}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="expiryDate">Expiry Date *</Label>
                  <Input
                    id="expiryDate"
                    {...form.register('expiryDate')}
                    placeholder="MM/YY"
                    maxLength={5}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: MM/YY (e.g., 12/25)</p>
                  {form.formState.errors.expiryDate && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.expiryDate.message as string}</p>
                  )}
                </div>
              </>
            )}

            {/* Mobile Wallet Fields */}
            {(selectedType === 'bkash' || selectedType === 'nagad' || selectedType === 'rocket') && (
              <>
                <div>
                  <Label htmlFor="accountName">Account Name *</Label>
                  <Input
                    id="accountName"
                    {...form.register('accountName')}
                    placeholder="John Doe"
                    disabled={isSubmitting}
                  />
                  {form.formState.errors.accountName && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.accountName.message as string}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="accountNumber">Account Number *</Label>
                  <Input
                    id="accountNumber"
                    {...form.register('accountNumber')}
                    placeholder="01712345678"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500 mt-1">Your {getPaymentLabel(selectedType)} mobile number</p>
                  {form.formState.errors.accountNumber && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.accountNumber.message as string}</p>
                  )}
                </div>
              </>
            )}

            {/* Bank Fields */}
            {selectedType === 'bank' && (
              <>
                <div>
                  <Label htmlFor="bankName">Bank Name *</Label>
                  <Input
                    id="bankName"
                    {...form.register('bankName')}
                    placeholder="Dutch-Bangla Bank"
                    disabled={isSubmitting}
                  />
                  {form.formState.errors.bankName && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.bankName.message as string}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="accountHolderName">Account Holder Name *</Label>
                  <Input
                    id="accountHolderName"
                    {...form.register('accountHolderName')}
                    placeholder="John Doe"
                    disabled={isSubmitting}
                  />
                  {form.formState.errors.accountHolderName && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.accountHolderName.message as string}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="accountNumber">Account Number *</Label>
                  <Input
                    id="accountNumber"
                    {...form.register('accountNumber')}
                    placeholder="1234567890"
                    disabled={isSubmitting}
                  />
                  {form.formState.errors.accountNumber && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.accountNumber.message as string}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="routingNumber">Routing Number (Optional)</Label>
                  <Input
                    id="routingNumber"
                    {...form.register('routingNumber')}
                    placeholder="000000000"
                    disabled={isSubmitting}
                  />
                </div>
              </>
            )}

            {/* Set as Default */}
            <div className="flex items-center space-x-2">
              <input
                id="isDefault"
                type="checkbox"
                {...form.register('isDefault')}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <Label htmlFor="isDefault" className="cursor-pointer">
                Set as default payment method
              </Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingMethod ? 'Update Payment Method' : 'Add Payment Method'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}

