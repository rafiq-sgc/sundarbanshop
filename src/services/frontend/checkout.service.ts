// Frontend Checkout Service - Works for both authenticated and guest users
import { API_BASE_URL } from '@/lib/constants'

export interface CheckoutData {
  // For authenticated users
  shippingAddressId?: string
  billingAddressId?: string
  
  // For guest users
  shippingAddress?: {
    name: string
    phone: string
    email?: string
    address: string
    city: string
    state: string
    zipCode?: string
    country: string
  }
  billingAddress?: {
    name: string
    phone: string
    email?: string
    address: string
    city: string
    state: string
    zipCode?: string
    country: string
  }
  
  // Common fields
  paymentMethod: 'cod' | 'card' | 'bkash' | 'nagad' | 'rocket' | 'bank'
  paymentMethodId?: string
  shippingOption?: 'inside-dhaka' | 'outside-dhaka'
  notes?: string
  
  // For guest users
  guestEmail?: string
  items?: Array<{
    product: string
    name: string
    sku: string
    price: number
    quantity: number
    total: number
    variant?: {
      variantId?: string
      name?: string
      attributes?: { [key: string]: string }
      sku?: string
    }
  }>
  subtotal?: number
  tax?: number
  shipping?: number
  total?: number
  currency?: string
}

export interface CheckoutResponse {
  success: boolean
  message?: string
  data?: {
    orderId: string
    orderNumber: string
    total: number
  }
}

class FrontendCheckoutService {
  private baseUrl = `${API_BASE_URL}/orders`

  /**
   * Create order (works for both authenticated and guest users)
   */
  async createOrder(checkoutData: CheckoutData): Promise<CheckoutResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutData),
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Failed to create order'
        }
      }

      return result
    } catch (error) {
      console.error('Checkout service error:', error)
      return {
        success: false,
        message: 'Network error. Please try again.'
      }
    }
  }
}

export const frontendCheckoutService = new FrontendCheckoutService()
export default frontendCheckoutService
