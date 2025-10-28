import { toast } from 'react-hot-toast'

export interface Template {
  id: string
  title: string
  content: string
  category: string
  shortcut: string
  variables: string[]
  usageCount: number
  isFavorite: boolean
  createdBy?: {
    _id: string
    name: string
    email: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface TemplateStats {
  total: number
  favorites: number
  totalUsage: number
  avgUsage: number
  byCategory: {
    general: number
    greeting: number
    orders: number
    shipping: number
    refunds: number
    technical: number
    closing: number
  }
}

export interface TemplatesResponse {
  templates: Template[]
  stats: TemplateStats
}

export interface CreateTemplateData {
  title: string
  content: string
  category: string
  shortcut?: string
  isFavorite?: boolean
}

export interface UpdateTemplateData extends CreateTemplateData {
  id: string
}

class TemplatesService {
  private baseUrl = '/api/admin/support/templates'

  /**
   * Get all templates with optional filters
   */
  async getTemplates(
    category: string = 'all',
    search: string = '',
    favorites: boolean = false
  ): Promise<{ success: boolean; data?: TemplatesResponse; message?: string }> {
    try {
      const params = new URLSearchParams({
        category,
        search,
        favorites: favorites.toString()
      })

      const response = await fetch(`${this.baseUrl}?${params}`, {
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
      console.error('Error fetching templates:', error)
      return {
        success: false,
        message: 'Failed to fetch templates'
      }
    }
  }

  /**
   * Get a single template by ID
   */
  async getTemplateById(id: string): Promise<{ success: boolean; data?: Template; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
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
      console.error('Error fetching template:', error)
      return {
        success: false,
        message: 'Failed to fetch template'
      }
    }
  }

  /**
   * Create a new template
   */
  async createTemplate(data: CreateTemplateData): Promise<{ success: boolean; data?: Template; message?: string }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
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
      console.error('Error creating template:', error)
      return {
        success: false,
        message: 'Failed to create template'
      }
    }
  }

  /**
   * Update an existing template
   */
  async updateTemplate(id: string, data: Partial<CreateTemplateData>): Promise<{ success: boolean; data?: Template; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
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
      console.error('Error updating template:', error)
      return {
        success: false,
        message: 'Failed to update template'
      }
    }
  }

  /**
   * Delete a template
   */
  async deleteTemplate(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
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
      console.error('Error deleting template:', error)
      return {
        success: false,
        message: 'Failed to delete template'
      }
    }
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(id: string): Promise<{ success: boolean; data?: { isFavorite: boolean }; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'toggleFavorite' })
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
      console.error('Error toggling favorite:', error)
      return {
        success: false,
        message: 'Failed to toggle favorite'
      }
    }
  }

  /**
   * Increment usage count
   */
  async incrementUsage(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'incrementUsage' })
      })

      if (response.status === 401) {
        return {
          success: false,
          message: 'Unauthorized'
        }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error incrementing usage:', error)
      return {
        success: false,
        message: 'Failed to increment usage'
      }
    }
  }
}

export const templatesService = new TemplatesService()

