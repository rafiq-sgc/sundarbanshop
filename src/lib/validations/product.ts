import { z } from 'zod'

// Product Validation Schema
export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200, 'Product name is too long'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description is too long'),
  shortDescription: z.string().max(500, 'Short description is too long').optional(),
  
  // Pricing
  price: z.number().min(0, 'Price must be positive'),
  comparePrice: z.number().min(0, 'Compare price must be positive').optional(),
  cost: z.number().min(0, 'Cost must be positive').optional(),
  salePrice: z.number().min(0, 'Sale price must be positive').optional(),
  
  // Inventory
  sku: z.string().min(1, 'SKU is required').max(100, 'SKU is too long'),
  barcode: z.string().max(100, 'Barcode is too long').optional(),
  quantity: z.number().int().min(0, 'Quantity must be non-negative'),
  lowStockThreshold: z.number().int().min(0, 'Low stock threshold must be non-negative').optional(),
  
  // Media
  images: z.array(z.string()).min(1, 'At least one image is required'),
  
  // Categories and Tags
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).optional(),
  
  // Status
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isOnSale: z.boolean().default(false),
  
  // Physical attributes
  weight: z.number().min(0, 'Weight must be positive').optional(),
  length: z.number().min(0, 'Length must be positive').optional(),
  width: z.number().min(0, 'Width must be positive').optional(),
  height: z.number().min(0, 'Height must be positive').optional(),
  
  // SEO
  metaTitle: z.string().max(60, 'Meta title is too long').optional(),
  metaDescription: z.string().max(160, 'Meta description is too long').optional(),
  metaKeywords: z.array(z.string()).optional(),
})

export type ProductFormData = z.infer<typeof productSchema>

// Category Validation Schema
export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Category name is too long'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().max(500, 'Description is too long').optional(),
  parent: z.string().optional().nullable(),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
  metaTitle: z.string().max(60, 'Meta title is too long').optional(),
  metaDescription: z.string().max(160, 'Meta description is too long').optional(),
})

export type CategoryFormData = z.infer<typeof categorySchema>

// Category Bulk Update Schema
export const categoryBulkUpdateSchema = z.object({
  categoryIds: z.array(z.string()).min(1, 'Select at least one category'),
  action: z.enum(['activate', 'deactivate', 'delete']),
})

export type CategoryBulkUpdateData = z.infer<typeof categoryBulkUpdateSchema>

// Product Variant Schema
export const variantSchema = z.object({
  name: z.string().min(1, 'Variant name is required'),
  price: z.number().min(0, 'Price must be positive'),
  sku: z.string().min(1, 'SKU is required'),
  quantity: z.number().int().min(0, 'Quantity must be non-negative'),
  attributes: z.record(z.string(), z.string()).optional(),
})

export type VariantFormData = z.infer<typeof variantSchema>

// Bulk Update Schema
export const bulkUpdateSchema = z.object({
  productIds: z.array(z.string()).min(1, 'Select at least one product'),
  action: z.enum([
    'activate', 
    'deactivate', 
    'feature', 
    'unfeature', 
    'set-on-sale',
    'remove-sale',
    'update-category',
    'adjust-price',
    'delete'
  ]),
  data: z.object({
    category: z.string().optional(),
    salePrice: z.number().min(0).optional(),
    saleStartDate: z.string().optional(),
    saleEndDate: z.string().optional(),
    adjustment: z.number().optional(),
    type: z.enum(['percentage', 'fixed']).optional()
  }).optional()
})

export type BulkUpdateFormData = z.infer<typeof bulkUpdateSchema>

// Product Search Schema
export const productSearchSchema = z.object({
  q: z.string().min(2, 'Search query must be at least 2 characters'),
  limit: z.number().int().min(1).max(100).optional()
})

// Product Filter Schema
export const productFilterSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['active', 'inactive', 'all']).optional(),
  featured: z.enum(['true', 'false', 'all']).optional(),
  onSale: z.enum(['true', 'false', 'all']).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  minStock: z.number().int().min(0).optional(),
  maxStock: z.number().int().min(0).optional()
})

export type ProductFilterData = z.infer<typeof productFilterSchema>
