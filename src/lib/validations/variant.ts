import { z } from 'zod'

// Product Attribute Schema
export const productAttributeSchema = z.object({
  name: z.string().min(1, 'Attribute name is required'),
  values: z.array(z.string()).min(1, 'At least one value is required'),
  isRequired: z.boolean().default(false)
})

export type ProductAttributeFormData = z.infer<typeof productAttributeSchema>

// Product Variant Schema
export const productVariantSchema = z.object({
  name: z.string().min(1, 'Variant name is required'),
  sku: z.string().min(1, 'SKU is required'),
  price: z.number().min(0, 'Price must be non-negative'),
  comparePrice: z.number().min(0, 'Compare price must be non-negative').optional(),
  stock: z.number().int().min(0, 'Stock must be non-negative'),
  attributes: z.record(z.string(), z.string()),
  image: z.string().optional(),
  isActive: z.boolean().default(true)
})

export type ProductVariantFormData = z.infer<typeof productVariantSchema>

// Cart Item Variant Schema
export const cartItemVariantSchema = z.object({
  variantId: z.string().optional(),
  name: z.string().optional(),
  attributes: z.record(z.string(), z.string()).optional(),
  sku: z.string().optional()
})

export type CartItemVariantData = z.infer<typeof cartItemVariantSchema>

// Add to Cart with Variant Schema
export const addToCartWithVariantSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  variant: cartItemVariantSchema.optional()
})

export type AddToCartWithVariantData = z.infer<typeof addToCartWithVariantSchema>

// Variant Selector State Schema
export const variantSelectionSchema = z.object({
  selectedAttributes: z.record(z.string(), z.string()),
  selectedVariant: productVariantSchema.optional()
})

export type VariantSelectionData = z.infer<typeof variantSelectionSchema>

// Bulk Variant Generation Schema
export const bulkVariantGenerationSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  attributes: z.array(productAttributeSchema).min(1, 'At least one attribute is required'),
  basePrice: z.number().min(0, 'Base price must be non-negative'),
  baseStock: z.number().int().min(0, 'Base stock must be non-negative').default(0)
})

export type BulkVariantGenerationData = z.infer<typeof bulkVariantGenerationSchema>

// Category Attribute Template Schema
export const categoryAttributeTemplateSchema = z.object({
  name: z.string().min(1, 'Attribute name is required'),
  type: z.enum(['select', 'multiselect', 'text', 'number', 'color']),
  values: z.array(z.string()).optional(),
  isRequired: z.boolean().default(false),
  displayOrder: z.number().int().min(0).default(0)
})

export type CategoryAttributeTemplateData = z.infer<typeof categoryAttributeTemplateSchema>

