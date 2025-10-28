// Dashboard Address Service
import { API_BASE_URL } from '@/lib/constants'

export interface Address {
  _id?: string
  name: string
  phone: string
  email?: string
  address: string
  city: string
  state?: string
  zipCode?: string
  country: string
  isDefault: boolean
  type?: 'home' | 'work' | 'other'
}

export interface AddressResponse {
  success: boolean
  message?: string
  data?: Address[]
  address?: Address
}

class AddressService {
  private baseUrl = `${API_BASE_URL}/dashboard/addresses`

  /**
   * Get all addresses for current user
   */
  async getAddresses(): Promise<AddressResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch addresses')
    }

    return response.json()
  }

  /**
   * Add new address
   */
  async addAddress(address: Omit<Address, '_id'>): Promise<AddressResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(address),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to add address')
    }

    return response.json()
  }

  /**
   * Update address
   */
  async updateAddress(addressId: string, address: Partial<Address>): Promise<AddressResponse> {
    const response = await fetch(`${this.baseUrl}/${addressId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(address),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to update address')
    }

    return response.json()
  }

  /**
   * Delete address
   */
  async deleteAddress(addressId: string): Promise<AddressResponse> {
    const response = await fetch(`${this.baseUrl}/${addressId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to delete address')
    }

    return response.json()
  }

  /**
   * Set address as default
   */
  async setDefaultAddress(addressId: string): Promise<AddressResponse> {
    return this.updateAddress(addressId, { isDefault: true })
  }
}

export const addressService = new AddressService()

