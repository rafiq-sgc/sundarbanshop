'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from 'next-auth/react'
import { Eye, EyeOff, Mail, Lock, User, Phone, ShoppingBag, TrendingUp, Shield, Zap, CheckCircle2, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'

// Zod validation schema
const signupSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: z.string()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .optional()
    .or(z.literal('')),
  password: z.string()
    .min(6, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string()
    .min(1, 'Please confirm your password'),
  agreeToTerms: z.boolean()
    .refine(val => val === true, 'You must agree to the terms and conditions')
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
}).refine(data => {
  // At least one of email or phone must be provided
  const hasEmail = data.email && data.email.trim() !== ''
  const hasPhone = data.phone && data.phone.trim() !== ''
  return hasEmail || hasPhone
}, {
  message: "Either email or phone number is required",
  path: ['email']
}).refine(data => {
  // If phone is provided, validate Bangladeshi phone format
  if (data.phone && data.phone.trim() !== '') {
    // Bangladeshi phone formats:
    // +8801XXXXXXXXX (with country code)
    // 8801XXXXXXXXX (with country code, no +)
    // 01XXXXXXXXX (local format)
    // Must be 11 digits in local format or 13-14 with country code
    const phoneRegex = /^(?:\+?880|0)?1[3-9]\d{8}$/
    return phoneRegex.test(data.phone.replace(/[\s\-\(\)]/g, ''))
  }
  return true
}, {
  message: "Please enter a valid Bangladeshi phone number (e.g., 01712345678 or +8801712345678)",
  path: ['phone']
})

type SignupFormData = z.infer<typeof signupSchema>

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  })
  const router = useRouter()

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange', // Enable real-time validation
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false
    }
  })

  const { handleSubmit, formState: { isSubmitting, errors }, watch } = form
  
  // Watch fields for real-time validation feedback
  const password = watch('password')
  const email = watch('email')
  const phone = watch('phone')
  
  // Update password strength in real-time
  useEffect(() => {
    if (password) {
      setPasswordStrength({
        hasMinLength: password.length >= 8,
        hasUpperCase: /[A-Z]/.test(password),
        hasLowerCase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecialChar: /[^A-Za-z0-9]/.test(password)
      })
    } else {
      setPasswordStrength({
        hasMinLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false
      })
    }
  }, [password])

  const onSubmit = async (data: SignupFormData) => {
    try {
      // Step 1: Register the user
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Account created successfully! Signing you in...')
        
        // Step 2: Automatically sign in the user
        // Use email if provided, otherwise use phone
        const credential = data.email && data.email.trim() !== '' ? data.email : data.phone
        
        const signInResult = await signIn('credentials', {
          email: credential,
          password: data.password,
          redirect: false
        })

        if (signInResult?.error) {
          // If auto-login fails, redirect to signin
          toast.error('Please sign in with your credentials')
          router.push('/auth/signin')
        } else {
          // Success! Redirect to dashboard
          toast.success('Welcome to EkoMart! 🎉')
          router.push('/dashboard')
        }
      } else {
        toast.error(result.message || 'Failed to create account')
      }
    } catch (error) {
      console.error('Signup error:', error)
      toast.error('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        {/* Logo & Brand */}
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <ShoppingBag className="w-7 h-7 text-primary-600" />
            </div>
            <span className="text-3xl font-bold text-white">EkoMart</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
            Start your shopping
            <br />
            <span className="text-primary-200">journey today</span>
          </h1>
          <p className="text-primary-100 text-lg">
            Join thousands of happy customers and enjoy exclusive deals, fast shipping, and personalized recommendations.
          </p>
        </div>

        {/* Benefits */}
        <div className="relative z-10 grid grid-cols-1 gap-6">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Exclusive Deals</h3>
              <p className="text-primary-100 text-sm">Get access to member-only discounts and special offers</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Order Tracking</h3>
              <p className="text-primary-100 text-sm">Track your orders in real-time from purchase to delivery</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Secure Shopping</h3>
              <p className="text-primary-100 text-sm">Your data is protected with enterprise-grade security</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0">
            <CardHeader className="space-y-2 pb-6">
              <div className="flex items-center justify-center lg:hidden mb-4">
                <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                  <ShoppingBag className="w-7 h-7 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-center">Create your account</CardTitle>
              <CardDescription className="text-center">
                Join EkoMart and start shopping today
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Form {...form}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Name Field */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              type="text"
                              placeholder="John Doe"
                              className="pl-9 h-11"
                              disabled={isSubmitting}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Email Field */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => {
                      const isEmailValid = email && email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
                      const showValidation = email && email.length > 0
                      
                      return (
                        <FormItem>
                          <FormLabel>Email Address <span className="text-muted-foreground text-xs">(Optional)</span></FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                {...field}
                                type="email"
                                placeholder="john@example.com"
                                className={`pl-9 pr-9 h-11 ${
                                  showValidation 
                                    ? isEmailValid 
                                      ? 'border-green-500 focus-visible:ring-green-500' 
                                      : 'border-red-500 focus-visible:ring-red-500'
                                    : ''
                                }`}
                                disabled={isSubmitting}
                              />
                              {showValidation && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  {isEmailValid ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <X className="h-4 w-4 text-red-600" />
                                  )}
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs">
                            Provide email or phone number (at least one required)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )
                    }}
                  />

                  {/* Phone Field */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => {
                      const phoneRegex = /^(?:\+?880|0)?1[3-9]\d{8}$/
                      const cleanPhone = phone ? phone.replace(/[\s\-\(\)]/g, '') : ''
                      const isPhoneValid = phone && phone.length > 0 && phoneRegex.test(cleanPhone)
                      const showValidation = phone && phone.length > 0
                      
                      return (
                        <FormItem>
                          <FormLabel>Phone Number <span className="text-muted-foreground text-xs">(Optional)</span></FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                {...field}
                                type="tel"
                                placeholder="01712345678 or +8801712345678"
                                className={`pl-9 pr-9 h-11 ${
                                  showValidation 
                                    ? isPhoneValid 
                                      ? 'border-green-500 focus-visible:ring-green-500' 
                                      : 'border-red-500 focus-visible:ring-red-500'
                                    : ''
                                }`}
                                disabled={isSubmitting}
                              />
                              {showValidation && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  {isPhoneValid ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <X className="h-4 w-4 text-red-600" />
                                  )}
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs">
                            Bangladeshi mobile number (Grameenphone, Robi, Banglalink, Airtel, Teletalk)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )
                    }}
                  />

                  {/* Password Field */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              className="pl-9 pr-9 h-11"
                              disabled={isSubmitting}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        
                        {/* Password Strength Indicator */}
                        {password && (
                          <div className="mt-2 space-y-2">
                            <div className="text-xs font-medium text-gray-700">Password requirements:</div>
                            <div className="space-y-1">
                              <div className={`flex items-center gap-2 text-xs ${passwordStrength.hasMinLength ? 'text-green-600' : 'text-gray-500'}`}>
                                {passwordStrength.hasMinLength ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <X className="h-3 w-3" />
                                )}
                                <span>At least 8 characters</span>
                              </div>
                              <div className={`flex items-center gap-2 text-xs ${passwordStrength.hasUpperCase ? 'text-green-600' : 'text-gray-500'}`}>
                                {passwordStrength.hasUpperCase ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <X className="h-3 w-3" />
                                )}
                                <span>One uppercase letter</span>
                              </div>
                              <div className={`flex items-center gap-2 text-xs ${passwordStrength.hasLowerCase ? 'text-green-600' : 'text-gray-500'}`}>
                                {passwordStrength.hasLowerCase ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <X className="h-3 w-3" />
                                )}
                                <span>One lowercase letter</span>
                              </div>
                              <div className={`flex items-center gap-2 text-xs ${passwordStrength.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                                {passwordStrength.hasNumber ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <X className="h-3 w-3" />
                                )}
                                <span>One number</span>
                              </div>
                              <div className={`flex items-center gap-2 text-xs ${passwordStrength.hasSpecialChar ? 'text-green-600' : 'text-gray-500'}`}>
                                {passwordStrength.hasSpecialChar ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <X className="h-3 w-3" />
                                )}
                                <span>One special character (!@#$%^&*)</span>
                              </div>
                            </div>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Confirm Password Field */}
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              className="pl-9 pr-9 h-11"
                              disabled={isSubmitting}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Terms and Conditions */}
                  <FormField
                    control={form.control}
                    name="agreeToTerms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-normal cursor-pointer">
                            I agree to the{' '}
                            <Link href="/terms" className="text-primary-600 hover:text-primary-700 font-medium hover:underline">
                              Terms of Service
                            </Link>{' '}
                            and{' '}
                            <Link href="/privacy" className="text-primary-600 hover:text-primary-700 font-medium hover:underline">
                              Privacy Policy
                            </Link>
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 text-base font-medium"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-6 border-t">
              <div className="space-y-3 w-full">
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?
                </p>
                <Link href="/auth/signin" className="block">
                  <Button type="button" variant="outline" className="w-full h-11" size="lg">
                    Sign In
                  </Button>
                </Link>
              </div>
            </CardFooter>
          </Card>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Need help?{' '}
              <Link href="/contact" className="text-primary-600 hover:text-primary-700 font-medium hover:underline">
                Contact support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
