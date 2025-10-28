export interface EmailTemplate {
  _id: string
  name: string
  slug: string
  subject: string
  type: 'email' | 'sms'
  category: 'order' | 'marketing' | 'notification' | 'support' | 'account'
  content: string
  variables: string[]
  isActive: boolean
  isDefault: boolean
  lastUsed?: string
  usageCount: number
  preheader?: string
  fromName?: string
  fromEmail?: string
  replyTo?: string
  smsLength?: number
  createdBy?: any
  updatedBy?: any
  createdAt?: string
  updatedAt?: string
}

export interface TemplateStats {
  total: number
  email: number
  sms: number
  active: number
  inactive: number
}

export interface TemplatesResponse {
  templates: EmailTemplate[]
  stats: TemplateStats
}

export interface CreateTemplateData {
  name: string
  subject?: string
  type: 'email' | 'sms'
  category: 'order' | 'marketing' | 'notification' | 'support' | 'account'
  content: string
  isActive?: boolean
  preheader?: string
  fromName?: string
  fromEmail?: string
  replyTo?: string
}

export interface UpdateTemplateData extends Partial<CreateTemplateData> {}

class EmailTemplateService {
  private baseUrl = '/api/admin/settings/templates'

  /**
   * Get all templates
   */
  async getTemplates(filters?: {
    search?: string
    type?: string
    category?: string
    isActive?: boolean
  }): Promise<{ success: boolean; data?: TemplatesResponse; message?: string }> {
    try {
      const queryParams = new URLSearchParams()
      
      if (filters) {
        if (filters.search) queryParams.append('search', filters.search)
        if (filters.type) queryParams.append('type', filters.type)
        if (filters.category) queryParams.append('category', filters.category)
        if (filters.isActive !== undefined) queryParams.append('isActive', filters.isActive.toString())
      }

      const url = queryParams.toString() 
        ? `${this.baseUrl}?${queryParams.toString()}`
        : this.baseUrl

      const response = await fetch(url)

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        return { success: false, message: 'Unauthorized' }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error fetching templates:', error)
      return { success: false, message: 'Failed to fetch templates' }
    }
  }

  /**
   * Get template by ID
   */
  async getTemplateById(id: string): Promise<{ success: boolean; data?: EmailTemplate; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`)

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        return { success: false, message: 'Unauthorized' }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error fetching template:', error)
      return { success: false, message: 'Failed to fetch template' }
    }
  }

  /**
   * Create template
   */
  async createTemplate(data: CreateTemplateData): Promise<{ success: boolean; data?: EmailTemplate; message?: string }> {
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
      console.error('Error creating template:', error)
      return { success: false, message: 'Failed to create template' }
    }
  }

  /**
   * Update template
   */
  async updateTemplate(id: string, data: UpdateTemplateData): Promise<{ success: boolean; data?: EmailTemplate; message?: string }> {
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
      console.error('Error updating template:', error)
      return { success: false, message: 'Failed to update template' }
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(id: string): Promise<{ success: boolean; message?: string }> {
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
      console.error('Error deleting template:', error)
      return { success: false, message: 'Failed to delete template' }
    }
  }

  /**
   * Toggle active status
   */
  async toggleActive(id: string, isActive: boolean): Promise<{ success: boolean; data?: EmailTemplate; message?: string }> {
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
      console.error('Error toggling template:', error)
      return { success: false, message: 'Failed to toggle template' }
    }
  }

  /**
   * Increment usage count
   */
  async incrementUsage(id: string): Promise<{ success: boolean; data?: EmailTemplate; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'incrementUsage' })
      })

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        return { success: false, message: 'Unauthorized' }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error incrementing usage:', error)
      return { success: false, message: 'Failed to increment usage' }
    }
  }
}

export const emailTemplateService = new EmailTemplateService()

