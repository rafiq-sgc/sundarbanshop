// Admin Variant Service
import { API_BASE_URL } from '@/lib/constants'

export interface ProductAttribute {
  name: string
  values: string[]
  isRequired: boolean
}

export interface ProductVariant {
  _id?: string
  name: string
  sku: string
  price: number
  comparePrice?: number
  stock: number
  attributes: { [key: string]: string }
  image?: string
  isActive: boolean
}

export interface VariantResponse {
  success: boolean
  message?: string
  data?: {
    variants: ProductVariant[]
    attributes: ProductAttribute[]
    count?: number
  }
}

export interface GenerateVariantsData {
  attributes: Array<{ name: string; values: string[] }>
  basePrice: number
  baseStock: number
  skuPrefix?: string
}

class VariantService {
  /**
   * Get all variants for a product
   */
  async getVariants(productId: string): Promise<VariantResponse> {
    const response = await fetch(`${API_BASE_URL}/admin/products/${productId}/variants`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch variants')
    }

    return response.json()
  }

  /**
   * Add a new variant
   */
  async addVariant(productId: string, variant: Omit<ProductVariant, '_id'>): Promise<VariantResponse> {
    const response = await fetch(`${API_BASE_URL}/admin/products/${productId}/variants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(variant),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to add variant')
    }

    return response.json()
  }

  /**
   * Update a variant
   */
  async updateVariant(
    productId: string, 
    variantId: string, 
    updates: Partial<ProductVariant>
  ): Promise<VariantResponse> {
    const response = await fetch(
      `${API_BASE_URL}/admin/products/${productId}/variants/${variantId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to update variant')
    }

    return response.json()
  }

  /**
   * Delete a variant
   */
  async deleteVariant(productId: string, variantId: string): Promise<VariantResponse> {
    const response = await fetch(
      `${API_BASE_URL}/admin/products/${productId}/variants/${variantId}`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to delete variant')
    }

    return response.json()
  }

  /**
   * Bulk generate variants
   */
  async generateVariants(productId: string, data: GenerateVariantsData): Promise<VariantResponse> {
    const response = await fetch(
      `${API_BASE_URL}/admin/products/${productId}/variants/generate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to generate variants')
    }

    return response.json()
  }

  /**
   * Update product attributes
   */
  async updateAttributes(
    productId: string, 
    attributes: ProductAttribute[]
  ): Promise<VariantResponse> {
    const response = await fetch(
      `${API_BASE_URL}/admin/products/${productId}/attributes`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attributes }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to update attributes')
    }

    return response.json()
  }
}

export const variantService = new VariantService()

