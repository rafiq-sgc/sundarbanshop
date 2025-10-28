// API Base URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

// Other constants
export const APP_NAME = 'Sundarban Shop'
export const APP_DESCRIPTION = 'Modern E-commerce Platform'

// Pagination
export const DEFAULT_PAGE_SIZE = 10
export const MAX_PAGE_SIZE = 100

// Order statuses
export const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const

// Payment statuses
export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const

// Warehouse transfer statuses
export const TRANSFER_STATUSES = {
  PENDING: 'pending',
  IN_TRANSIT: 'in_transit',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

// Inventory adjustment types
export const ADJUSTMENT_TYPES = {
  STOCK_COUNT: 'stock_count',
  DAMAGED: 'damaged',
  LOST: 'lost',
  FOUND: 'found',
  CORRECTION: 'correction',
  OTHER: 'other',
} as const

