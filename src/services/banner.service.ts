export interface Banner {
  _id: string
  title: string
  description?: string
  image: string
  mobileImage?: string
  link?: string
  linkText?: string
  position: 'hero' | 'top' | 'middle' | 'bottom' | 'sidebar'
  isActive: boolean
  sortOrder: number
  startDate?: string
  endDate?: string
  clicks: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface BannerStats {
  total: number
  active: number
  inactive: number
  hero: number
  totalClicks: number
}

export interface BannersResponse {
  banners: Banner[]
  stats: BannerStats
}

export interface CreateBannerData {
  title: string
  description?: string
  image: string
  mobileImage?: string
  link?: string
  linkText?: string
  position: 'hero' | 'top' | 'middle' | 'bottom' | 'sidebar'
  isActive?: boolean
  sortOrder?: number
  startDate?: string
  endDate?: string
}

export interface UpdateBannerData extends Partial<CreateBannerData> {}

class BannerService {
  private baseUrl = '/api/admin/content/banners'
  private frontendBaseUrl = '/api/frontend/banners'

  /**
   * Get all banners (public frontend API)
   */
  async getBanners(filters?: {
    search?: string
    position?: string
    status?: string
  }): Promise<{ success: boolean; data?: BannersResponse; message?: string }> {
    try {
      const queryParams = new URLSearchParams()
      
      if (filters) {
        if (filters.search) queryParams.append('search', filters.search)
        if (filters.position) queryParams.append('position', filters.position)
        if (filters.status) queryParams.append('status', filters.status)
      }

      const url = queryParams.toString() 
        ? `${this.frontendBaseUrl}?${queryParams.toString()}`
        : this.frontendBaseUrl

      const response = await fetch(url, { cache: 'no-store' })

      if (!response.ok) {
        console.error('Error fetching banners:', response.status, response.statusText)
        return { success: false, message: 'Failed to fetch banners' }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error fetching banners:', error)
      return { success: false, message: 'Failed to fetch banners' }
    }
  }

  /**
   * Get banner by ID
   */
  async getBannerById(id: string): Promise<{ success: boolean; data?: Banner; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`)

      if (!response.ok) {
        console.error('Error fetching banner:', response.status, response.statusText)
        return { success: false, message: 'Failed to fetch banner' }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error fetching banner:', error)
      return { success: false, message: 'Failed to fetch banner' }
    }
  }

  /**
   * Create banner
   */
  async createBanner(data: CreateBannerData): Promise<{ success: boolean; data?: Banner; message?: string }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        console.error('Error fetching banner:', response.status, response.statusText)
        return { success: false, message: 'Failed to fetch banner' }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error creating banner:', error)
      return { success: false, message: 'Failed to create banner' }
    }
  }

  /**
   * Update banner
   */
  async updateBanner(id: string, data: UpdateBannerData): Promise<{ success: boolean; data?: Banner; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        console.error('Error fetching banner:', response.status, response.statusText)
        return { success: false, message: 'Failed to fetch banner' }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error updating banner:', error)
      return { success: false, message: 'Failed to update banner' }
    }
  }

  /**
   * Delete banner
   */
  async deleteBanner(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        console.error('Error fetching banner:', response.status, response.statusText)
        return { success: false, message: 'Failed to fetch banner' }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error deleting banner:', error)
      return { success: false, message: 'Failed to delete banner' }
    }
  }

  /**
   * Toggle banner status
   */
  async toggleBannerStatus(id: string): Promise<{ success: boolean; data?: Banner; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PATCH',
      })

      if (!response.ok) {
        console.error('Error fetching banner:', response.status, response.statusText)
        return { success: false, message: 'Failed to fetch banner' }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error toggling banner:', error)
      return { success: false, message: 'Failed to toggle banner' }
    }
  }

  /**
   * Get position color
   */
  getPositionColor(position: string): string {
    const colors: Record<string, string> = {
      'hero': 'bg-purple-100 text-purple-700 border-purple-200',
      'top': 'bg-blue-100 text-blue-700 border-blue-200',
      'middle': 'bg-green-100 text-green-700 border-green-200',
      'bottom': 'bg-orange-100 text-orange-700 border-orange-200',
      'sidebar': 'bg-pink-100 text-pink-700 border-pink-200'
    }
    return colors[position] || 'bg-gray-100 text-gray-700'
  }

  /**
   * Get position label
   */
  getPositionLabel(position: string): string {
    const labels: Record<string, string> = {
      'hero': 'Hero Banner',
      'top': 'Top Banner',
      'middle': 'Middle Banner',
      'bottom': 'Bottom Banner',
      'sidebar': 'Sidebar'
    }
    return labels[position] || position
  }

  /**
   * Calculate CTR (Click-Through Rate)
   */
  calculateCTR(clicks: number, impressions: number = 1000): string {
    if (impressions === 0) return '0.0%'
    const ctr = (clicks / impressions) * 100
    return ctr.toFixed(1) + '%'
  }

  /**
   * Check if banner is scheduled
   */
  isBannerScheduled(startDate?: string, endDate?: string): boolean {
    if (!startDate && !endDate) return false
    
    const now = new Date()
    const start = startDate ? new Date(startDate) : null
    const end = endDate ? new Date(endDate) : null

    if (start && now < start) return true
    if (end && now > end) return true
    
    return false
  }

  /**
   * Get banner status
   */
  getBannerStatus(banner: Banner): 'active' | 'scheduled' | 'expired' | 'inactive' {
    if (!banner.isActive) return 'inactive'

    const now = new Date()
    
    if (banner.startDate) {
      const start = new Date(banner.startDate)
      if (now < start) return 'scheduled'
    }
    
    if (banner.endDate) {
      const end = new Date(banner.endDate)
      if (now > end) return 'expired'
    }

    return 'active'
  }

  /**
   * Get status color
   */
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'active': 'bg-green-100 text-green-700 border-green-200',
      'scheduled': 'bg-blue-100 text-blue-700 border-blue-200',
      'expired': 'bg-red-100 text-red-700 border-red-200',
      'inactive': 'bg-gray-100 text-gray-700 border-gray-200'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }
}

export const bannerService = new BannerService()

