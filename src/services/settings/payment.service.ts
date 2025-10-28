export interface PaymentGateway {
  name: string
  displayName: string
  enabled: boolean
  isDefault: boolean
  config: Record<string, any>
  fees?: {
    fixed?: number
    percentage?: number
  }
  minimumAmount?: number
  maximumAmount?: number
  supportedCurrencies?: string[]
  logo?: string
  description?: string
  sortOrder?: number
}

export interface PaymentSettings {
  // General Payment Settings
  currency: string
  currencySymbol: string
  currencyPosition: 'before' | 'after'
  decimalPlaces: number
  thousandSeparator: string
  decimalSeparator: string
  
  // Payment Gateways
  gateways: PaymentGateway[]
  
  // Payment Options
  acceptedPaymentMethods: string[]
  requireBillingAddress: boolean
  requirePhoneNumber: boolean
  saveCardDetails: boolean
  
  // Refund Settings
  autoRefundEnabled: boolean
  refundProcessingDays: number
  partialRefundAllowed: boolean
  
  // Security
  sslEnabled: boolean
  fraudDetectionEnabled: boolean
  requireCVV: boolean
  
  // Transaction Settings
  transactionPrefix: string
  invoicePrefix: string
  
  // Mobile Banking
  mobileBankingEnabled: boolean
  mobileBankingNote?: string
  
  // Metadata
  _id?: string
  updatedBy?: any
  updatedAt?: Date
  createdAt?: Date
}

class PaymentSettingsService {
  private baseUrl = '/api/admin/settings/payments'

  /**
   * Get payment settings
   */
  async getSettings(): Promise<{ success: boolean; data?: PaymentSettings; message?: string }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        return {
          success: false,
          message: 'Unauthorized'
        }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error fetching payment settings:', error)
      return {
        success: false,
        message: 'Failed to fetch settings'
      }
    }
  }

  /**
   * Update payment settings
   */
  async updateSettings(settings: Partial<PaymentSettings>): Promise<{ success: boolean; data?: PaymentSettings; message?: string }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      })

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        return {
          success: false,
          message: 'Unauthorized'
        }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error updating payment settings:', error)
      return {
        success: false,
        message: 'Failed to update settings'
      }
    }
  }

  /**
   * Reset settings to default
   */
  async resetSettings(): Promise<{ success: boolean; data?: PaymentSettings; message?: string }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        return {
          success: false,
          message: 'Unauthorized'
        }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error resetting payment settings:', error)
      return {
        success: false,
        message: 'Failed to reset settings'
      }
    }
  }

  /**
   * Test gateway connection
   */
  async testGateway(gatewayName: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/test/${gatewayName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        return {
          success: false,
          message: 'Unauthorized'
        }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error testing gateway:', error)
      return {
        success: false,
        message: 'Failed to test gateway connection'
      }
    }
  }
}

export const paymentSettingsService = new PaymentSettingsService()

