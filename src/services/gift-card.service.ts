export interface GiftCardTransaction {
  type: 'credit' | 'debit'
  amount: number
  order?: {
    orderNumber: string
  }
  description: string
  date: string
}

export interface GiftCard {
  _id: string
  code: string
  initialAmount: number
  currentBalance: number
  currency: string
  purchasedBy?: {
    name: string
    email: string
  }
  recipientEmail?: string
  recipientName?: string
  message?: string
  status: 'active' | 'used' | 'expired' | 'cancelled'
  expiryDate?: string
  transactions: GiftCardTransaction[]
  createdBy?: {
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

export interface GiftCardStats {
  total: number
  active: number
  used: number
  expired: number
  cancelled: number
  totalValue: number
  remainingValue: number
  usedValue: number
}

export interface GiftCardsResponse {
  giftCards: GiftCard[]
  stats: GiftCardStats
}

export interface CreateGiftCardData {
  initialAmount: number
  recipientEmail?: string
  recipientName?: string
  message?: string
  expiryDate?: string
  count?: number
}

export interface UpdateGiftCardData {
  recipientEmail?: string
  recipientName?: string
  message?: string
  expiryDate?: string
}

class GiftCardService {
  private baseUrl = '/api/admin/marketing/gift-cards'

  /**
   * Get all gift cards
   */
  async getGiftCards(filters?: {
    search?: string
    status?: string
  }): Promise<{ success: boolean; data?: GiftCardsResponse; message?: string }> {
    try {
      const queryParams = new URLSearchParams()
      
      if (filters) {
        if (filters.search) queryParams.append('search', filters.search)
        if (filters.status) queryParams.append('status', filters.status)
      }

      const url = queryParams.toString() 
        ? `${this.baseUrl}?${queryParams.toString()}`
        : this.baseUrl

      const response = await fetch(url, { cache: 'no-store' })

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        return { success: false, message: 'Unauthorized' }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error fetching gift cards:', error)
      return { success: false, message: 'Failed to fetch gift cards' }
    }
  }

  /**
   * Get gift card by ID
   */
  async getGiftCardById(id: string): Promise<{ success: boolean; data?: GiftCard; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`)

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        return { success: false, message: 'Unauthorized' }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error fetching gift card:', error)
      return { success: false, message: 'Failed to fetch gift card' }
    }
  }

  /**
   * Create gift card(s)
   */
  async createGiftCard(data: CreateGiftCardData): Promise<{ success: boolean; data?: GiftCard | GiftCard[]; message?: string }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        return { success: false, message: 'Unauthorized' }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error creating gift card:', error)
      return { success: false, message: 'Failed to create gift card' }
    }
  }

  /**
   * Update gift card
   */
  async updateGiftCard(id: string, data: UpdateGiftCardData): Promise<{ success: boolean; data?: GiftCard; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        return { success: false, message: 'Unauthorized' }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error updating gift card:', error)
      return { success: false, message: 'Failed to update gift card' }
    }
  }

  /**
   * Delete gift card
   */
  async deleteGiftCard(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
      })

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        return { success: false, message: 'Unauthorized' }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error deleting gift card:', error)
      return { success: false, message: 'Failed to delete gift card' }
    }
  }

  /**
   * Cancel gift card
   */
  async cancelGiftCard(id: string): Promise<{ success: boolean; data?: GiftCard; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'cancel' })
      })

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        return { success: false, message: 'Unauthorized' }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error cancelling gift card:', error)
      return { success: false, message: 'Failed to cancel gift card' }
    }
  }

  /**
   * Adjust gift card balance
   */
  async adjustBalance(id: string, amount: number, description: string): Promise<{ success: boolean; data?: GiftCard; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'adjustBalance', amount, description })
      })

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        return { success: false, message: 'Unauthorized' }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error adjusting balance:', error)
      return { success: false, message: 'Failed to adjust balance' }
    }
  }

  /**
   * Format currency (BDT)
   */
  formatCurrency(amount: number): string {
    return `৳${amount.toLocaleString('en-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }

  /**
   * Get status color
   */
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'active': 'bg-green-100 text-green-700',
      'used': 'bg-gray-100 text-gray-700',
      'expired': 'bg-yellow-100 text-yellow-700',
      'cancelled': 'bg-red-100 text-red-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  /**
   * Get usage percentage
   */
  getUsagePercentage(card: GiftCard): number {
    if (card.initialAmount === 0) return 0
    return ((card.initialAmount - card.currentBalance) / card.initialAmount) * 100
  }

  /**
   * Check if expired
   */
  isExpired(card: GiftCard): boolean {
    if (!card.expiryDate) return false
    return new Date(card.expiryDate) < new Date()
  }
}

export const giftCardService = new GiftCardService()

