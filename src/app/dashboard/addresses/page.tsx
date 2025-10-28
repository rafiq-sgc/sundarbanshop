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
  MapPin,
  Plus,
  Edit,
  Trash2,
  Star,
  Home,
  Building,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { addressService, type Address } from '@/services/dashboard'

// Zod validation schema
const addressSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zipCode: z.string().min(4, 'ZIP code is required'),
  country: z.string().min(2, 'Country is required'),
  isDefault: z.boolean().default(false),
  type: z.enum(['home', 'work', 'other']).default('home')
})

type AddressFormData = z.infer<typeof addressSchema>

export default function AddressesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema) as any,
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Bangladesh',
      isDefault: false,
      type: 'home'
    }
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/dashboard/addresses')
    } else if (status === 'authenticated') {
      fetchAddresses()
    }
  }, [status, router])

  const fetchAddresses = async () => {
    try {
      setLoading(true)
      const result = await addressService.getAddresses()
      if (result.success && result.data) {
        setAddresses(result.data)
      }
    } catch (error: any) {
      console.error('Error fetching addresses:', error)
      toast.error(error.message || 'Failed to load addresses')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAddModal = () => {
    setEditingAddress(null)
    form.reset({
      name: session?.user?.name || '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Bangladesh',
      isDefault: addresses.length === 0,
      type: 'home'
    })
    setShowAddressModal(true)
  }

  const handleOpenEditModal = (address: Address) => {
    setEditingAddress(address)
    form.reset({
      name: address.name,
      phone: address.phone,
      address: address.address,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      isDefault: address.isDefault,
      type: address.type || 'home'
    })
    setShowAddressModal(true)
  }

  const onSubmit = async (data: AddressFormData) => {
    try {
      setIsSubmitting(true)

      if (editingAddress) {
        // Update existing address
        const result = await addressService.updateAddress(editingAddress._id!, data)
        if (result.success) {
          toast.success('Address updated successfully')
          await fetchAddresses()
          setShowAddressModal(false)
        }
      } else {
        // Add new address
        const result = await addressService.addAddress(data)
        if (result.success) {
          toast.success('Address added successfully')
          await fetchAddresses()
          setShowAddressModal(false)
        }
      }
    } catch (error: any) {
      console.error('Error saving address:', error)
      toast.error(error.message || 'Failed to save address')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSetDefault = async (addressId: string) => {
    try {
      const result = await addressService.setDefaultAddress(addressId)
      if (result.success) {
        toast.success('Default address updated')
        await fetchAddresses()
      }
    } catch (error: any) {
      console.error('Error setting default:', error)
      toast.error(error.message || 'Failed to set default address')
    }
  }

  const handleDelete = async (addressId: string, isDefault: boolean) => {
    if (isDefault) {
      toast.error('Cannot delete default address. Please set another address as default first.')
      return
    }

    if (!confirm('Are you sure you want to delete this address?')) {
      return
    }

    try {
      const result = await addressService.deleteAddress(addressId)
      if (result.success) {
        toast.success('Address deleted successfully')
        await fetchAddresses()
      }
    } catch (error: any) {
      console.error('Error deleting address:', error)
      toast.error(error.message || 'Failed to delete address')
    }
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
            <li className="text-gray-900">Addresses</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <MapPin className="w-8 h-8 text-green-600" />
              My Addresses
            </h1>
            <p className="text-gray-600 mt-2">Manage your shipping and billing addresses</p>
          </div>
          <Button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2"
            size="lg"
          >
            <Plus className="w-5 h-5" />
            Add Address
          </Button>
        </div>

        {/* Addresses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((address) => (
            <div
              key={address._id}
              className={`bg-white rounded-xl shadow-sm border-2 p-6 transition-all hover:shadow-lg ${
                address.isDefault ? 'border-green-500' : 'border-gray-200'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  {address.type === 'home' ? (
                    <Home className="w-5 h-5 text-green-600" />
                  ) : address.type === 'work' ? (
                    <Building className="w-5 h-5 text-blue-600" />
                  ) : (
                    <MapPin className="w-5 h-5 text-gray-600" />
                  )}
                  <span className="font-semibold text-gray-900 capitalize">{address.type} Address</span>
                </div>
                {address.isDefault && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    Default
                  </span>
                )}
              </div>

              {/* Address Details */}
              <div className="space-y-2 mb-4">
                <p className="font-semibold text-gray-900">{address.name}</p>
                <p className="text-gray-700">{address.address}</p>
                <p className="text-gray-700">{address.city}, {address.state} {address.zipCode}</p>
                <p className="text-gray-700">{address.country}</p>
                <p className="text-gray-600">Phone: {address.phone}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                {!address.isDefault && (
                  <Button
                    onClick={() => handleSetDefault(address._id!)}
                    variant="outline"
                    className="flex-1 border-green-600 text-green-600 hover:bg-green-50"
                  >
                    Set as Default
                  </Button>
                )}
                <Button
                  onClick={() => handleOpenEditModal(address)}
                  variant="outline"
                  size="icon"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => handleDelete(address._id!, address.isDefault)}
                  variant="outline"
                  size="icon"
                  disabled={address.isDefault}
                  className={address.isDefault ? '' : 'border-red-300 hover:bg-red-50'}
                >
                  <Trash2 className={`w-4 h-4 ${address.isDefault ? 'text-gray-400' : 'text-red-600'}`} />
                </Button>
              </div>
            </div>
          ))}

          {/* Add New Address Card */}
          <button
            onClick={handleOpenAddModal}
            className="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 p-12 hover:border-green-500 hover:bg-green-50 transition-all flex flex-col items-center justify-center gap-4 group"
          >
            <div className="w-16 h-16 bg-gray-100 group-hover:bg-green-100 rounded-full flex items-center justify-center transition-colors">
              <Plus className="w-8 h-8 text-gray-400 group-hover:text-green-600 transition-colors" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">Add New Address</p>
              <p className="text-sm text-gray-500">Click to add a new shipping address</p>
            </div>
          </button>
        </div>
      </main>

      {/* Address Form Modal */}
      <Dialog open={showAddressModal} onOpenChange={setShowAddressModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </DialogTitle>
            <DialogDescription>
              {editingAddress 
                ? 'Update your address details below' 
                : 'Fill in the form below to add a new address'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="John Doe"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.name.message}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  {...form.register('phone')}
                  placeholder="01712345678"
                />
                {form.formState.errors.phone && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.phone.message}</p>
                )}
              </div>
            </div>

            {/* Address */}
            <div>
              <Label htmlFor="address">Street Address *</Label>
              <Input
                id="address"
                {...form.register('address')}
                placeholder="123 Main Street, Apt 4B"
              />
              {form.formState.errors.address && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* City */}
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  {...form.register('city')}
                  placeholder="Dhaka"
                />
                {form.formState.errors.city && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.city.message}</p>
                )}
              </div>

              {/* State */}
              <div>
                <Label htmlFor="state">State/Division *</Label>
                <Input
                  id="state"
                  {...form.register('state')}
                  placeholder="Dhaka"
                />
                {form.formState.errors.state && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.state.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ZIP Code */}
              <div>
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input
                  id="zipCode"
                  {...form.register('zipCode')}
                  placeholder="1200"
                />
                {form.formState.errors.zipCode && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.zipCode.message}</p>
                )}
              </div>

              {/* Country */}
              <div>
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  {...form.register('country')}
                  placeholder="Bangladesh"
                />
                {form.formState.errors.country && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.country.message}</p>
                )}
              </div>
            </div>

            {/* Address Type */}
            <div>
              <Label htmlFor="type">Address Type</Label>
              <Select
                value={form.watch('type')}
                onValueChange={(value) => form.setValue('type', value as 'home' | 'work' | 'other')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Set as Default */}
            <div className="flex items-center space-x-2">
              <input
                id="isDefault"
                type="checkbox"
                {...form.register('isDefault')}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <Label htmlFor="isDefault" className="cursor-pointer">
                Set as default address
              </Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddressModal(false)}
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
                  editingAddress ? 'Update Address' : 'Add Address'
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
