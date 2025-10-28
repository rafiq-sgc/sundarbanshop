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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  User,
  Mail,
  Phone,
  Lock,
  Shield,
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
  Camera
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { profileService, type UserProfile, type UpdateProfileData } from '@/services/dashboard'

// Zod validation schemas
const profileInfoSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').optional().or(z.literal(''))
}).refine(data => {
  // At least one of email or phone must be provided
  const hasEmail = data.email && data.email.trim() !== ''
  const hasPhone = data.phone && data.phone.trim() !== ''
  return hasEmail || hasPhone
}, {
  message: 'Either email or phone number is required',
  path: ['email']
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password')
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
})

type ProfileInfoFormData = z.infer<typeof profileInfoSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

export default function ProfilePage() {
  const { data: session, status, update: updateSession } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmittingInfo, setIsSubmittingInfo] = useState(false)
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false)

  const profileForm = useForm<ProfileInfoFormData>({
    resolver: zodResolver(profileInfoSchema) as any,
    defaultValues: {
      name: '',
      email: '',
      phone: ''
    }
  })

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema) as any,
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/dashboard/profile')
    } else if (status === 'authenticated') {
      fetchProfile()
    }
  }, [status, router])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const result = await profileService.getProfile()
      if (result.success && result.data) {
        setProfile(result.data)
        profileForm.reset({
          name: result.data.name,
          email: result.data.email || '',
          phone: result.data.phone || ''
        })
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error)
      toast.error(error.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const onSubmitProfileInfo = async (data: ProfileInfoFormData) => {
    try {
      setIsSubmittingInfo(true)
      
      const updateData: UpdateProfileData = {
        name: data.name
      }

      // Only include email if it has a value
      if (data.email && data.email.trim() !== '') {
        updateData.email = data.email.trim()
      }

      // Only include phone if it has a value
      if (data.phone && data.phone.trim() !== '') {
        updateData.phone = data.phone.trim()
      }

      const result = await profileService.updateProfile(updateData)
      
      if (result.success) {
        toast.success('Profile updated successfully')
        await fetchProfile()
        
        // Update session if name changed
        if (updateSession) {
          await updateSession({
            ...session,
            user: {
              ...session?.user,
              name: data.name
            }
          })
        }
      }
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setIsSubmittingInfo(false)
    }
  }

  const onSubmitPassword = async (data: PasswordFormData) => {
    try {
      setIsSubmittingPassword(true)
      
      const result = await profileService.updateProfile({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword
      })
      
      if (result.success) {
        toast.success('Password updated successfully')
        passwordForm.reset()
      }
    } catch (error: any) {
      console.error('Error updating password:', error)
      toast.error(error.message || 'Failed to update password')
    } finally {
      setIsSubmittingPassword(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-40 bg-gray-200 rounded-lg"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
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
            <li className="text-gray-900">Profile</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <User className="w-8 h-8 text-green-600" />
            My Profile
          </h1>
          <p className="text-gray-600 mt-2">Manage your account information and settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Summary Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  {/* Avatar */}
                  <div className="relative mb-4">
                    <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                      {profile?.name.charAt(0).toUpperCase()}
                    </div>
                    <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-gray-200 hover:bg-gray-50 transition-colors">
                      <Camera className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  {/* Name */}
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{profile?.name}</h2>
                  
                  {/* Role Badge */}
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold mb-4 ${
                    profile?.role === 'admin' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {profile?.role === 'admin' ? 'Administrator' : 'Customer'}
                  </span>

                  {/* Stats */}
                  <div className="w-full space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Member Since</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Account Status</span>
                      <span className="flex items-center gap-1">
                        {profile?.isActive ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-semibold text-green-600">Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-semibold text-red-600">Inactive</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Email Verified</span>
                      <span className="flex items-center gap-1">
                        {profile?.emailVerified ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-semibold text-green-600">Verified</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-orange-600" />
                            <span className="text-sm font-semibold text-orange-600">Not Verified</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Forms */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Personal Information</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>

              {/* Personal Information Tab */}
              <TabsContent value="info">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Update your personal details and contact information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={profileForm.handleSubmit(onSubmitProfileInfo)} className="space-y-4">
                      {/* Name */}
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <div className="relative mt-1">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="name"
                            {...profileForm.register('name')}
                            placeholder="John Doe"
                            className="pl-9"
                            disabled={isSubmittingInfo}
                          />
                        </div>
                        {profileForm.formState.errors.name && (
                          <p className="text-sm text-red-600 mt-1">{profileForm.formState.errors.name.message}</p>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <div className="relative mt-1">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            {...profileForm.register('email')}
                            placeholder="john@example.com"
                            className="pl-9"
                            disabled={isSubmittingInfo}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Either email or phone number is required
                        </p>
                        {profileForm.formState.errors.email && (
                          <p className="text-sm text-red-600 mt-1">{profileForm.formState.errors.email.message}</p>
                        )}
                      </div>

                      {/* Phone */}
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <div className="relative mt-1">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            type="tel"
                            {...profileForm.register('phone')}
                            placeholder="01712345678"
                            className="pl-9"
                            disabled={isSubmittingInfo}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Bangladeshi mobile number
                        </p>
                        {profileForm.formState.errors.phone && (
                          <p className="text-sm text-red-600 mt-1">{profileForm.formState.errors.phone.message}</p>
                        )}
                      </div>

                      <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isSubmittingInfo}>
                          {isSubmittingInfo ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save Changes'
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>
                      Update your password to keep your account secure
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4">
                      {/* Current Password */}
                      <div>
                        <Label htmlFor="currentPassword">Current Password *</Label>
                        <div className="relative mt-1">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="currentPassword"
                            type="password"
                            {...passwordForm.register('currentPassword')}
                            placeholder="••••••••"
                            className="pl-9"
                            disabled={isSubmittingPassword}
                          />
                        </div>
                        {passwordForm.formState.errors.currentPassword && (
                          <p className="text-sm text-red-600 mt-1">{passwordForm.formState.errors.currentPassword.message}</p>
                        )}
                      </div>

                      {/* New Password */}
                      <div>
                        <Label htmlFor="newPassword">New Password *</Label>
                        <div className="relative mt-1">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="newPassword"
                            type="password"
                            {...passwordForm.register('newPassword')}
                            placeholder="••••••••"
                            className="pl-9"
                            disabled={isSubmittingPassword}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Must be 8+ characters with uppercase, lowercase, number, and special character
                        </p>
                        {passwordForm.formState.errors.newPassword && (
                          <p className="text-sm text-red-600 mt-1">{passwordForm.formState.errors.newPassword.message}</p>
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <Label htmlFor="confirmPassword">Confirm New Password *</Label>
                        <div className="relative mt-1">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="confirmPassword"
                            type="password"
                            {...passwordForm.register('confirmPassword')}
                            placeholder="••••••••"
                            className="pl-9"
                            disabled={isSubmittingPassword}
                          />
                        </div>
                        {passwordForm.formState.errors.confirmPassword && (
                          <p className="text-sm text-red-600 mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>
                        )}
                      </div>

                      <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isSubmittingPassword}>
                          {isSubmittingPassword ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            'Update Password'
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

