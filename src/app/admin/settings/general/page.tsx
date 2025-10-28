'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Store,
  Mail,
  Phone,
  MapPin,
  Globe,
  Upload,
  Save,
  Loader2,
  RotateCcw,
  DollarSign,
  Package,
  AlertCircle,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { generalSettingsService, type GeneralSettings } from '@/services/settings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

const settingsSchema = z.object({
  // Store Information
  storeName: z.string().min(1, 'Store name is required').max(100),
  storeEmail: z.string().email('Invalid email address'),
  storePhone: z.string().min(10, 'Phone number is required'),
  storeAddress: z.string().min(1, 'Address is required'),
  storeCity: z.string().min(1, 'City is required'),
  storeState: z.string().min(1, 'State is required'),
  storeZip: z.string().min(1, 'ZIP code is required'),
  storeCountry: z.string().min(1, 'Country is required'),
  storeLogo: z.string().url('Invalid URL').optional().or(z.literal('')),
  storeFavicon: z.string().url('Invalid URL').optional().or(z.literal('')),
  storeDescription: z.string().max(500, 'Description too long').optional().or(z.literal('')),
  
  // Regional Settings
  currency: z.string().default('USD'),
  language: z.string().default('en'),
  timezone: z.string().default('UTC'),
  dateFormat: z.string().optional(),
  timeFormat: z.string().optional(),
  
  // Tax & Shipping
  taxRate: z.number().min(0).max(100).default(0),
  taxEnabled: z.boolean().optional(),
  shippingFee: z.number().min(0).default(0),
  freeShippingThreshold: z.number().min(0).optional(),
  
  // SEO & Meta
  metaTitle: z.string().max(60).optional().or(z.literal('')),
  metaDescription: z.string().max(160).optional().or(z.literal('')),
  
  // Social Media
  facebook: z.string().url('Invalid URL').optional().or(z.literal('')),
  twitter: z.string().url('Invalid URL').optional().or(z.literal('')),
  instagram: z.string().url('Invalid URL').optional().or(z.literal('')),
  linkedin: z.string().url('Invalid URL').optional().or(z.literal('')),
  youtube: z.string().url('Invalid URL').optional().or(z.literal('')),
  
  // Business Information
  businessType: z.string().optional(),
  registrationNumber: z.string().optional().or(z.literal('')),
  vatNumber: z.string().optional().or(z.literal('')),
})

type SettingsFormData = z.infer<typeof settingsSchema>

export default function GeneralSettingsPage() {
  const { isAuthorized, loading: authLoading } = useAdminAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema) as any,
    defaultValues: {
      storeName: 'Ekomart',
      storeEmail: 'info@ekomart.com',
      storePhone: '+1 234 567 8900',
      storeAddress: '123 Main Street',
      storeCity: 'New York',
      storeState: 'NY',
      storeZip: '10001',
      storeCountry: 'United States',
      storeLogo: '',
      storeFavicon: '',
      storeDescription: '',
      currency: 'USD',
      language: 'en',
      timezone: 'America/New_York',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      taxRate: 0,
      taxEnabled: true,
      shippingFee: 5.99,
      freeShippingThreshold: 50,
      metaTitle: '',
      metaDescription: '',
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: '',
      youtube: '',
      businessType: '',
      registrationNumber: '',
      vatNumber: '',
    },
  })

  // Watch for changes
  useEffect(() => {
    const subscription = form.watch(() => {
      setHasChanges(form.formState.isDirty)
    })
    return () => subscription.unsubscribe()
  }, [form.watch, form.formState.isDirty])

  // Fetch settings
  const fetchSettings = async () => {
    if (!isAuthorized) return
    
    try {
      setLoading(true)
      const result = await generalSettingsService.getSettings()
      
      if (result.success && result.data) {
        // Flatten social media for form
        const formData: any = {
          ...result.data,
          facebook: result.data.socialMedia?.facebook || '',
          twitter: result.data.socialMedia?.twitter || '',
          instagram: result.data.socialMedia?.instagram || '',
          linkedin: result.data.socialMedia?.linkedin || '',
          youtube: result.data.socialMedia?.youtube || '',
        }
        delete formData.socialMedia
        delete formData._id
        delete formData.__v
        delete formData.createdAt
        delete formData.updatedAt
        delete formData.updatedBy
        
        form.reset(formData)
      } else {
        toast.error(result.message || 'Failed to fetch settings')
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Failed to fetch settings')
    } finally {
      setLoading(false)
    }
  }

  // Load settings on mount
  useEffect(() => {
    if (isAuthorized) {
      fetchSettings()
    }
  }, [isAuthorized])

  // Submit handler
  const onSubmit = async (data: SettingsFormData) => {
    try {
      // Restructure social media
      const settingsData: any = {
        ...data,
        socialMedia: {
          facebook: data.facebook,
          twitter: data.twitter,
          instagram: data.instagram,
          linkedin: data.linkedin,
          youtube: data.youtube,
        }
      }
      
      // Remove flat social media fields
      delete settingsData.facebook
      delete settingsData.twitter
      delete settingsData.instagram
      delete settingsData.linkedin
      delete settingsData.youtube
      
      const result = await generalSettingsService.updateSettings(settingsData)
      
      if (result.success) {
        toast.success('Settings saved successfully!')
        form.reset(data) // Reset dirty state
        setHasChanges(false)
      } else {
        toast.error(result.message || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    }
  }

  // Reset to defaults
  const handleReset = async () => {
    try {
      const result = await generalSettingsService.resetSettings()
      
      if (result.success && result.data) {
        toast.success('Settings reset to defaults!')
        
        // Flatten and reset form
        const formData: any = {
          ...result.data,
          facebook: result.data.socialMedia?.facebook || '',
          twitter: result.data.socialMedia?.twitter || '',
          instagram: result.data.socialMedia?.instagram || '',
          linkedin: result.data.socialMedia?.linkedin || '',
          youtube: result.data.socialMedia?.youtube || '',
        }
        delete formData.socialMedia
        delete formData._id
        delete formData.__v
        delete formData.createdAt
        delete formData.updatedAt
        delete formData.updatedBy
        
        form.reset(formData)
        setHasChanges(false)
        setShowResetDialog(false)
      } else {
        toast.error(result.message || 'Failed to reset settings')
      }
    } catch (error) {
      console.error('Error resetting settings:', error)
      toast.error('Failed to reset settings')
    }
  }

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">General Settings</h1>
              <p className="text-muted-foreground mt-2">
                Configure your store's basic information and preferences
              </p>
            </div>
            <div className="flex items-center gap-2">
              <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="default">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset to Defaults
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset all settings?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will reset all general settings to their default values.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset}>
                      Reset Settings
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={form.formState.isSubmitting || !hasChanges}
                size="default"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Unsaved Changes Warning */}
        {hasChanges && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-orange-800">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm font-medium">
                  You have unsaved changes. Don't forget to save!
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Store Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Store className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Store Information</CardTitle>
                    <CardDescription>Basic details about your store</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="storeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter store name" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your store's name as it appears to customers
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="storeEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="store@example.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          Primary contact email for your store
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="storePhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store Phone *</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="+1 234 567 8900" {...field} />
                        </FormControl>
                        <FormDescription>
                          Customer support phone number
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="USD">USD - US Dollar ($)</SelectItem>
                            <SelectItem value="EUR">EUR - Euro (€)</SelectItem>
                            <SelectItem value="GBP">GBP - British Pound (£)</SelectItem>
                            <SelectItem value="BDT">BDT - Bangladeshi Taka (৳)</SelectItem>
                            <SelectItem value="INR">INR - Indian Rupee (₹)</SelectItem>
                            <SelectItem value="CAD">CAD - Canadian Dollar (C$)</SelectItem>
                            <SelectItem value="AUD">AUD - Australian Dollar (A$)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Default currency for prices
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="storeDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your store..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Brief description of your store (max 500 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <MapPin className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>Store Address</CardTitle>
                    <CardDescription>Physical location of your business</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="storeAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address *</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main Street" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="storeCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City *</FormLabel>
                        <FormControl>
                          <Input placeholder="New York" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="storeState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State/Province *</FormLabel>
                        <FormControl>
                          <Input placeholder="NY" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="storeZip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP/Postal Code *</FormLabel>
                        <FormControl>
                          <Input placeholder="10001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="storeCountry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country *</FormLabel>
                        <FormControl>
                          <Input placeholder="United States" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Regional Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Globe className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle>Regional Settings</CardTitle>
                    <CardDescription>Language, timezone, and format preferences</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Spanish</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                            <SelectItem value="de">German</SelectItem>
                            <SelectItem value="bn">Bengali</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timezone</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                            <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                            <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                            <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="Asia/Dhaka">Asia/Dhaka (GMT+6)</SelectItem>
                            <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="timeFormat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time Format</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="12h">12 Hour (3:30 PM)</SelectItem>
                            <SelectItem value="24h">24 Hour (15:30)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tax & Shipping */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <CardTitle>Tax & Shipping Settings</CardTitle>
                    <CardDescription>Configure default tax and shipping rates</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="taxEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable Tax</FormLabel>
                        <FormDescription>
                          Apply tax to orders
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="taxRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Rate (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Default tax percentage
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shippingFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Shipping Fee ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Standard shipping cost
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="freeShippingThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Free Shipping Threshold ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="50"
                            {...field}
                            value={field.value || ''}
                            onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormDescription>
                          Order amount for free shipping
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* SEO Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Globe className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <CardTitle>SEO & Meta Tags</CardTitle>
                    <CardDescription>Optimize your store for search engines</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="metaTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Your Store - Quality Products Online" 
                          maxLength={60}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Page title for search engines (max 60 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="metaDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Shop quality products at great prices..."
                          className="resize-none"
                          rows={3}
                          maxLength={160}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Description for search results (max 160 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Social Media */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-100 rounded-lg">
                    <Globe className="h-5 w-5 text-pink-600" />
                  </div>
                  <div>
                    <CardTitle>Social Media Links</CardTitle>
                    <CardDescription>Connect your social media profiles</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="facebook"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Facebook className="h-4 w-4 text-blue-600" />
                          Facebook
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="https://facebook.com/yourstore" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="twitter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Twitter className="h-4 w-4 text-blue-400" />
                          Twitter
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="https://twitter.com/yourstore" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="instagram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Instagram className="h-4 w-4 text-pink-600" />
                          Instagram
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="https://instagram.com/yourstore" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="linkedin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Linkedin className="h-4 w-4 text-blue-700" />
                          LinkedIn
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="https://linkedin.com/company/yourstore" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="youtube"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="flex items-center gap-2">
                          <Youtube className="h-4 w-4 text-red-600" />
                          YouTube
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="https://youtube.com/@yourstore" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Business Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Store className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle>Business Information</CardTitle>
                    <CardDescription>Legal and registration details</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="businessType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="sole_proprietor">Sole Proprietor</SelectItem>
                            <SelectItem value="partnership">Partnership</SelectItem>
                            <SelectItem value="corporation">Corporation</SelectItem>
                            <SelectItem value="llc">LLC</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="registrationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registration Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter registration number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vatNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>VAT Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter VAT number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-4 pt-6">
              {hasChanges && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Unsaved changes
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={!hasChanges}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting || !hasChanges}
                size="lg"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save All Settings
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  )
}
