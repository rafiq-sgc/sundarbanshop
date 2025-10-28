// Dashboard Payment Service
import { API_BASE_URL } from '@/lib/constants'

export interface PaymentMethod {
  _id?: string
  type: 'card' | 'bkash' | 'nagad' | 'rocket' | 'bank'
  isDefault: boolean
  
  // Card details
  cardNumber?: string
  cardHolderName?: string
  expiryDate?: string
  
  // Mobile wallet details
  accountNumber?: string
  accountName?: string
  
  // Bank details
  bankName?: string
  bankAccountNumber?: string
  accountHolderName?: string
  routingNumber?: string
}

export interface PaymentMethodResponse {
  success: boolean
  message?: string
  data?: PaymentMethod[]
  paymentMethod?: PaymentMethod
}

class PaymentService {
  private baseUrl = `${API_BASE_URL}/dashboard/payment-methods`

  /**
   * Get all payment methods for current user
   */
  async getPaymentMethods(): Promise<PaymentMethodResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch payment methods')
    }

    return response.json()
  }

  /**
   * Add new payment method
   */
  async addPaymentMethod(paymentMethod: Omit<PaymentMethod, '_id'>): Promise<PaymentMethodResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentMethod),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to add payment method')
    }

    return response.json()
  }

  /**
   * Update payment method
   */
  async updatePaymentMethod(paymentMethodId: string, paymentMethod: Partial<PaymentMethod>): Promise<PaymentMethodResponse> {
    const response = await fetch(`${this.baseUrl}/${paymentMethodId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentMethod),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to update payment method')
    }

    return response.json()
  }

  /**
   * Delete payment method
   */
  async deletePaymentMethod(paymentMethodId: string): Promise<PaymentMethodResponse> {
    const response = await fetch(`${this.baseUrl}/${paymentMethodId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to delete payment method')
    }

    return response.json()
  }

  /**
   * Set payment method as default
   */
  async setDefaultPaymentMethod(paymentMethodId: string): Promise<PaymentMethodResponse> {
    return this.updatePaymentMethod(paymentMethodId, { isDefault: true })
  }
}

export const paymentService = new PaymentService()

