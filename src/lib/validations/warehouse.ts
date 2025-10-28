import { z } from 'zod'

// Warehouse validation schema
export const warehouseSchema = z.object({
  name: z.string().min(1, 'Warehouse name is required').max(100, 'Name cannot exceed 100 characters'),
  code: z.string()
    .min(2, 'Code must be at least 2 characters')
    .max(10, 'Code cannot exceed 10 characters')
    .transform(val => val.toUpperCase())
    .refine(val => /^[A-Z0-9]+$/.test(val), {
      message: 'Code must contain only uppercase letters and numbers'
    }),
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'ZIP code is required'),
    country: z.string().min(1, 'Country is required'),
  }),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  manager: z.string().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
})

export type WarehouseFormData = z.infer<typeof warehouseSchema>

// Stock Transfer validation schema
export const transferItemSchema = z.object({
  product: z.string().min(1, 'Product is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  notes: z.string().optional(),
})

export const stockTransferSchema = z.object({
  fromWarehouse: z.string().min(1, 'Source warehouse is required'),
  toWarehouse: z.string().min(1, 'Destination warehouse is required'),
  items: z.array(transferItemSchema).min(1, 'At least one item is required'),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
})

export type StockTransferFormData = z.infer<typeof stockTransferSchema>

// Inventory Adjustment validation schema
export const adjustmentItemSchema = z.object({
  product: z.string().min(1, 'Product is required'),
  previousQuantity: z.number().min(0, 'Previous quantity cannot be negative'),
  newQuantity: z.number().min(0, 'New quantity cannot be negative'),
  difference: z.number(),
})

export const inventoryAdjustmentSchema = z.object({
  warehouse: z.string().min(1, 'Warehouse is required'),
  items: z.array(adjustmentItemSchema).min(1, 'At least one item is required'),
  type: z.enum(['stock_count', 'damaged', 'lost', 'found', 'correction', 'other']),
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason cannot exceed 500 characters'),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
})

export type InventoryAdjustmentFormData = z.infer<typeof inventoryAdjustmentSchema>

// Inventory Update schema
export const inventoryUpdateSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  operation: z.enum(['add', 'set']),
})

export type InventoryUpdateFormData = z.infer<typeof inventoryUpdateSchema>

