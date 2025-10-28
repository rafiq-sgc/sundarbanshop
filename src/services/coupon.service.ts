export interface Coupon {
  _id: string
  code: string
  description?: string
  type: 'percentage' | 'fixed'
  value: number
  minimumPurchase: number
  maximumDiscount?: number
  usageLimit?: number
  usageCount: number
  perUserLimit?: number
  usedBy: Array<{
    user: string
    usedAt: string
    orderNumber: string
  }>
  applicableProducts?: Array<{
    _id: string
    name: string
  }>
  applicableCategories?: Array<{
    _id: string
    name: string
  }>
  excludedProducts?: Array<{
    _id: string
    name: string
  }>
  isActive: boolean
  startDate?: string
  endDate?: string
  createdBy?: {
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

export interface CouponStats {
  total: number
  active: number
  expired: number
  percentage: number
  fixed: number
}

export interface CouponsResponse {
  coupons: Coupon[]
  stats: CouponStats
}

export interface CreateCouponData {
  code: string
  description?: string
  type: 'percentage' | 'fixed'
  value: number
  minimumPurchase?: number
  maximumDiscount?: number
  usageLimit?: number
  perUserLimit?: number
  applicableProducts?: string[]
  applicableCategories?: string[]
  excludedProducts?: string[]
  isActive?: boolean
  startDate?: string
  endDate?: string
}

export interface UpdateCouponData extends Partial<CreateCouponData> {}

class CouponService {
  private baseUrl = '/api/admin/marketing/coupons'

  /**
   * Get all coupons
   */
  async getCoupons(filters?: {
    search?: string
    type?: string
    isActive?: boolean
    status?: string
  }): Promise<{ success: boolean; data?: CouponsResponse; message?: string }> {
    try {
      const queryParams = new URLSearchParams()
      
      if (filters) {
        if (filters.search) queryParams.append('search', filters.search)
        if (filters.type) queryParams.append('type', filters.type)
        if (filters.isActive !== undefined) queryParams.append('isActive', filters.isActive.toString())
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
      console.error('Error fetching coupons:', error)
      return { success: false, message: 'Failed to fetch coupons' }
    }
  }

  /**
   * Get coupon by ID
   */
  async getCouponById(id: string): Promise<{ success: boolean; data?: Coupon; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`)

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        return { success: false, message: 'Unauthorized' }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error fetching coupon:', error)
      return { success: false, message: 'Failed to fetch coupon' }
    }
  }

  /**
   * Create coupon
   */
  async createCoupon(data: CreateCouponData): Promise<{ success: boolean; data?: Coupon; message?: string }> {
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
      console.error('Error creating coupon:', error)
      return { success: false, message: 'Failed to create coupon' }
    }
  }

  /**
   * Update coupon
   */
  async updateCoupon(id: string, data: UpdateCouponData): Promise<{ success: boolean; data?: Coupon; message?: string }> {
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
      console.error('Error updating coupon:', error)
      return { success: false, message: 'Failed to update coupon' }
    }
  }

  /**
   * Delete coupon
   */
  async deleteCoupon(id: string): Promise<{ success: boolean; message?: string }> {
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
      console.error('Error deleting coupon:', error)
      return { success: false, message: 'Failed to delete coupon' }
    }
  }

  /**
   * Toggle coupon active status
   */
  async toggleActive(id: string, isActive: boolean): Promise<{ success: boolean; data?: Coupon; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'toggleActive', isActive })
      })

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        return { success: false, message: 'Unauthorized' }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error toggling coupon:', error)
      return { success: false, message: 'Failed to toggle coupon' }
    }
  }

  /**
   * Format discount display
   */
  formatDiscount(coupon: Coupon): string {
    if (coupon.type === 'percentage') {
      return `${coupon.value}% OFF`
    } else {
      return `৳${coupon.value} OFF`
    }
  }

  /**
   * Get coupon status
   */
  getCouponStatus(coupon: Coupon): 'active' | 'expired' | 'upcoming' | 'inactive' {
    if (!coupon.isActive) return 'inactive'
    
    const now = new Date()
    
    if (coupon.startDate && new Date(coupon.startDate) > now) {
      return 'upcoming'
    }
    
    if (coupon.endDate && new Date(coupon.endDate) < now) {
      return 'expired'
    }
    
    return 'active'
  }

  /**
   * Get usage percentage
   */
  getUsagePercentage(coupon: Coupon): number {
    if (!coupon.usageLimit) return 0
    return (coupon.usageCount / coupon.usageLimit) * 100
  }
}

export const couponService = new CouponService()

