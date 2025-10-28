export interface GeneralSettings {
  // Store Information
  storeName: string
  storeEmail: string
  storePhone: string
  storeAddress: string
  storeCity: string
  storeState: string
  storeZip: string
  storeCountry: string
  storeLogo?: string
  storeFavicon?: string
  storeDescription?: string
  
  // Regional Settings
  currency: string
  language: string
  timezone: string
  dateFormat?: string
  timeFormat?: string
  
  // Tax & Shipping
  taxRate: number
  taxEnabled?: boolean
  shippingFee: number
  freeShippingThreshold?: number
  
  // SEO & Meta
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string[]
  
  // Social Media
  socialMedia?: {
    facebook?: string
    twitter?: string
    instagram?: string
    linkedin?: string
    youtube?: string
  }
  
  // Business Information
  businessType?: string
  registrationNumber?: string
  vatNumber?: string
  
  // Metadata
  _id?: string
  updatedBy?: any
  updatedAt?: Date
  createdAt?: Date
}

class GeneralSettingsService {
  private baseUrl = '/api/admin/settings/general'

  /**
   * Get general settings
   */
  async getSettings(): Promise<{ success: boolean; data?: GeneralSettings; message?: string }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.status === 401) {
        // Unauthorized - redirect to login
        window.location.href = '/auth/signin'
        return {
          success: false,
          message: 'Unauthorized'
        }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error fetching settings:', error)
      return {
        success: false,
        message: 'Failed to fetch settings'
      }
    }
  }

  /**
   * Update general settings
   */
  async updateSettings(settings: Partial<GeneralSettings>): Promise<{ success: boolean; data?: GeneralSettings; message?: string }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      })

      if (response.status === 401) {
        // Unauthorized - redirect to login
        window.location.href = '/auth/signin'
        return {
          success: false,
          message: 'Unauthorized'
        }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error updating settings:', error)
      return {
        success: false,
        message: 'Failed to update settings'
      }
    }
  }

  /**
   * Reset settings to default
   */
  async resetSettings(): Promise<{ success: boolean; data?: GeneralSettings; message?: string }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.status === 401) {
        // Unauthorized - redirect to login
        window.location.href = '/auth/signin'
        return {
          success: false,
          message: 'Unauthorized'
        }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error resetting settings:', error)
      return {
        success: false,
        message: 'Failed to reset settings'
      }
    }
  }
}

export const generalSettingsService = new GeneralSettingsService()

