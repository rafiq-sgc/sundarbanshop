export interface EmailCampaign {
  _id: string
  name: string
  subject: string
  content: string
  template?: string
  type: 'newsletter' | 'promotional' | 'transactional' | 'abandoned-cart'
  recipients: {
    type: 'all' | 'segment' | 'custom'
    segment?: {
      minOrders?: number
      maxOrders?: number
      minSpent?: number
      maxSpent?: number
      tags?: string[]
    }
    emails?: string[]
  }
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused'
  scheduledAt?: string
  sentAt?: string
  stats: {
    sent: number
    delivered: number
    opened: number
    clicked: number
    bounced: number
    unsubscribed: number
  }
  createdBy?: {
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

export interface EmailCampaignStats {
  total: number
  draft: number
  scheduled: number
  sent: number
  totalSent: number
  totalOpened: number
}

export interface EmailCampaignsResponse {
  campaigns: EmailCampaign[]
  stats: EmailCampaignStats
}

export interface CreateCampaignData {
  name: string
  subject: string
  content: string
  template?: string
  type: 'newsletter' | 'promotional' | 'transactional' | 'abandoned-cart'
  recipients: {
    type: 'all' | 'segment' | 'custom'
    segment?: any
    emails?: string[]
  }
  status?: 'draft' | 'scheduled'
  scheduledAt?: string
}

export interface UpdateCampaignData extends Partial<CreateCampaignData> {}

class EmailCampaignService {
  private baseUrl = '/api/admin/marketing/emails'

  /**
   * Get all campaigns
   */
  async getCampaigns(filters?: {
    search?: string
    type?: string
    status?: string
  }): Promise<{ success: boolean; data?: EmailCampaignsResponse; message?: string }> {
    try {
      const queryParams = new URLSearchParams()
      
      if (filters) {
        if (filters.search) queryParams.append('search', filters.search)
        if (filters.type) queryParams.append('type', filters.type)
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
      console.error('Error fetching campaigns:', error)
      return { success: false, message: 'Failed to fetch campaigns' }
    }
  }

  /**
   * Get campaign by ID
   */
  async getCampaignById(id: string): Promise<{ success: boolean; data?: EmailCampaign; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`)

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        return { success: false, message: 'Unauthorized' }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error fetching campaign:', error)
      return { success: false, message: 'Failed to fetch campaign' }
    }
  }

  /**
   * Create campaign
   */
  async createCampaign(data: CreateCampaignData): Promise<{ success: boolean; data?: EmailCampaign; message?: string }> {
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
      console.error('Error creating campaign:', error)
      return { success: false, message: 'Failed to create campaign' }
    }
  }

  /**
   * Update campaign
   */
  async updateCampaign(id: string, data: UpdateCampaignData): Promise<{ success: boolean; data?: EmailCampaign; message?: string }> {
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
      console.error('Error updating campaign:', error)
      return { success: false, message: 'Failed to update campaign' }
    }
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(id: string): Promise<{ success: boolean; message?: string }> {
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
      console.error('Error deleting campaign:', error)
      return { success: false, message: 'Failed to delete campaign' }
    }
  }

  /**
   * Send campaign
   */
  async sendCampaign(id: string): Promise<{ success: boolean; data?: EmailCampaign; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'send' })
      })

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        return { success: false, message: 'Unauthorized' }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error sending campaign:', error)
      return { success: false, message: 'Failed to send campaign' }
    }
  }

  /**
   * Duplicate campaign
   */
  async duplicateCampaign(id: string): Promise<{ success: boolean; data?: EmailCampaign; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'duplicate' })
      })

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        return { success: false, message: 'Unauthorized' }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error duplicating campaign:', error)
      return { success: false, message: 'Failed to duplicate campaign' }
    }
  }

  /**
   * Get status color
   */
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'draft': 'bg-gray-100 text-gray-700',
      'scheduled': 'bg-blue-100 text-blue-700',
      'sending': 'bg-yellow-100 text-yellow-700',
      'sent': 'bg-green-100 text-green-700',
      'paused': 'bg-orange-100 text-orange-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  /**
   * Get type color
   */
  getTypeColor(type: string): string {
    const colors: Record<string, string> = {
      'newsletter': 'bg-blue-100 text-blue-700',
      'promotional': 'bg-purple-100 text-purple-700',
      'transactional': 'bg-green-100 text-green-700',
      'abandoned-cart': 'bg-orange-100 text-orange-700'
    }
    return colors[type] || 'bg-gray-100 text-gray-700'
  }

  /**
   * Calculate metrics
   */
  getMetrics(campaign: EmailCampaign) {
    const openRate = campaign.stats.sent > 0 
      ? (campaign.stats.opened / campaign.stats.sent) * 100 
      : 0
    
    const clickRate = campaign.stats.sent > 0 
      ? (campaign.stats.clicked / campaign.stats.sent) * 100 
      : 0
    
    const bounceRate = campaign.stats.sent > 0 
      ? (campaign.stats.bounced / campaign.stats.sent) * 100 
      : 0

    return {
      openRate: openRate.toFixed(1),
      clickRate: clickRate.toFixed(1),
      bounceRate: bounceRate.toFixed(1)
    }
  }
}

export const emailCampaignService = new EmailCampaignService()

