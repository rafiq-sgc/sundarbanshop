export interface CartItem {
  product: {
    _id: string
    name: string
    image: string
    price: number
    description?: string
  }
  quantity: number
}

export interface AbandonedCart {
  _id: string
  userId?: string
  customer: {
    name: string
    email: string
    phone: string
  }
  items: CartItem[]
  totalValue: number
  abandonedAt: string
  recoveryStatus: 'pending' | 'follow-up' | 'lost'
  emailsSent: number
  hoursSinceAbandoned: number
  createdAt?: string
}

export interface AbandonedCartStats {
  total: number
  totalValue: number
  pending: number
  followUp: number
  lost: number
  averageValue: number
}

export interface AbandonedCartsResponse {
  carts: AbandonedCart[]
  stats: AbandonedCartStats
}

class AbandonedCartService {
  private baseUrl = '/api/admin/abandoned-carts'

  /**
   * Get all abandoned carts
   */
  async getAbandonedCarts(filters?: {
    search?: string
    status?: string
  }): Promise<{ success: boolean; data?: AbandonedCartsResponse; message?: string }> {
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
      console.error('Error fetching abandoned carts:', error)
      return { success: false, message: 'Failed to fetch abandoned carts' }
    }
  }

  /**
   * Get cart by ID
   */
  async getCartById(id: string): Promise<{ success: boolean; data?: AbandonedCart; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`)

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        return { success: false, message: 'Unauthorized' }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error fetching cart:', error)
      return { success: false, message: 'Failed to fetch cart' }
    }
  }

  /**
   * Send recovery email
   */
  async sendRecoveryEmail(
    id: string, 
    emailType: 'reminder' | 'discount' | 'final',
    discountCode?: string
  ): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailType, discountCode })
      })

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        return { success: false, message: 'Unauthorized' }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error sending recovery email:', error)
      return { success: false, message: 'Failed to send recovery email' }
    }
  }

  /**
   * Delete cart
   */
  async deleteCart(id: string): Promise<{ success: boolean; message?: string }> {
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
      console.error('Error deleting cart:', error)
      return { success: false, message: 'Failed to delete cart' }
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
      'pending': 'bg-yellow-100 text-yellow-700',
      'follow-up': 'bg-orange-100 text-orange-700',
      'lost': 'bg-red-100 text-red-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  /**
   * Get time ago text
   */
  getTimeAgo(hours: number): string {
    if (hours < 1) return 'Less than 1 hour ago'
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
    const days = Math.floor(hours / 24)
    return `${days} day${days !== 1 ? 's' : ''} ago`
  }

  /**
   * Get urgency level
   */
  getUrgency(hours: number): 'low' | 'medium' | 'high' {
    if (hours < 48) return 'low'
    if (hours < 96) return 'medium'
    return 'high'
  }
}

export const abandonedCartService = new AbandonedCartService()

