import { z, ZodError } from 'zod'

export { ZodError }

// Order item validation
export const orderItemSchema = z.object({
  product: z.string().optional(), // Allow empty for custom items
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  price: z.number().min(0, 'Price must be non-negative'),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  image: z.string().optional()
})

// Address validation
export const addressSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'ZIP code is required'),
  country: z.string().min(1, 'Country is required')
})

// Order creation schema
export const orderSchema = z.object({
  user: z.string().min(1, 'User is required'),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).default('pending'),
  orderStatus: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).default('pending'),
  subtotal: z.number().min(0, 'Subtotal must be non-negative'),
  tax: z.number().min(0, 'Tax must be non-negative').default(0),
  shipping: z.number().min(0, 'Shipping must be non-negative').default(0),
  discount: z.number().min(0, 'Discount must be non-negative').default(0),
  total: z.number().min(0, 'Total must be non-negative'),
  currency: z.string().default('USD'),
  notes: z.string().optional(),
  trackingNumber: z.string().optional(),
  createInvoice: z.boolean().optional() // Allow createInvoice field from frontend
})

// Order update schema
export const orderUpdateSchema = z.object({
  orderStatus: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
  trackingNumber: z.string().optional(),
  notes: z.string().optional(),
  shippedAt: z.string().optional(),
  deliveredAt: z.string().optional()
})

// Bulk order update schema
export const bulkOrderUpdateSchema = z.object({
  orderIds: z.array(z.string()).min(1, 'At least one order ID is required'),
  action: z.enum(['updateStatus', 'updatePaymentStatus', 'delete']),
  orderStatus: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).optional()
})

// Order stats schema
export const orderStatsSchema = z.object({
  period: z.enum(['today', 'week', 'month', 'year', 'all']).default('all'),
  status: z.string().optional()
})

export type OrderFormData = z.infer<typeof orderSchema>
export type OrderUpdateData = z.infer<typeof orderUpdateSchema>
export type BulkOrderUpdateData = z.infer<typeof bulkOrderUpdateSchema>
export type OrderStatsData = z.infer<typeof orderStatsSchema>