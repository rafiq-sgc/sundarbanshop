// Dashboard Checkout Service
import { API_BASE_URL } from '@/lib/constants'

export interface CheckoutData {
  shippingAddressId: string
  billingAddressId?: string
  paymentMethod: 'cod' | 'card' | 'bkash' | 'nagad' | 'rocket' | 'bank'
  paymentMethodId?: string // For saved payment methods
  shippingOption?: 'inside-dhaka' | 'outside-dhaka'
  notes?: string
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

class CheckoutService {
  private baseUrl = `${API_BASE_URL}/dashboard/checkout`

  /**
   * Create order from cart
   */
  async createOrder(checkoutData: CheckoutData): Promise<CheckoutResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkoutData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create order')
    }

    return response.json()
  }
}

export const checkoutService = new CheckoutService()

