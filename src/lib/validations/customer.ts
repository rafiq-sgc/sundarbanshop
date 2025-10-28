import { z } from 'zod'

// Phone customer schema (for admin-created customers via phone orders)
export const phoneCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  password: z.string().optional(), // No password needed for phone customers
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  customerType: z.literal('phone'),
  canLogin: z.boolean().default(false), // Can't login by default
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
  sendWelcomeEmail: z.boolean().default(false),
})

// Walk-in customer schema
export const walkinCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  password: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  customerType: z.literal('walkin'),
  canLogin: z.boolean().default(false),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
  sendWelcomeEmail: z.boolean().default(false),
})

// Online customer schema (for self-registration via website)
export const onlineCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  customerType: z.literal('online'),
  canLogin: z.boolean().default(true),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
  sendWelcomeEmail: z.boolean().default(true),
})

// Combined schema with discriminated union for better type safety
export const customerCreateSchema = z.discriminatedUnion('customerType', [
  phoneCustomerSchema,
  walkinCustomerSchema,
  onlineCustomerSchema,
])

export type PhoneCustomerData = z.infer<typeof phoneCustomerSchema>
export type WalkinCustomerData = z.infer<typeof walkinCustomerSchema>
export type OnlineCustomerData = z.infer<typeof onlineCustomerSchema>
export type CustomerCreateData = z.infer<typeof customerCreateSchema>

// Full customer validation schema (for updates)
export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().min(1, 'Phone number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  address: z.array(z.object({
    name: z.string().min(1, 'Name is required'),
    phone: z.string().min(1, 'Phone is required'),
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'ZIP code is required'),
    country: z.string().min(1, 'Country is required'),
    isDefault: z.boolean().default(false),
  })).optional(),
  customerType: z.enum(['online', 'phone', 'walkin']),
  canLogin: z.boolean().optional(),
  isActive: z.boolean().default(true),
  emailVerified: z.boolean().optional(),
  notes: z.string().optional(),
})

export type CustomerFormData = z.infer<typeof customerSchema>

// Customer update schema (password optional)
export const customerUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters').optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  address: z.array(z.object({
    name: z.string().min(1, 'Name is required'),
    phone: z.string().min(1, 'Phone is required'),
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'ZIP code is required'),
    country: z.string().min(1, 'Country is required'),
    isDefault: z.boolean().default(false),
  })).optional(),
  customerType: z.enum(['online', 'phone', 'walkin']).optional(),
  canLogin: z.boolean().optional(),
  isActive: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
  notes: z.string().optional(),
})

export type CustomerUpdateData = z.infer<typeof customerUpdateSchema>
