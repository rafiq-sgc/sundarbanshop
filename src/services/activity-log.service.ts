export interface ActivityLog {
  _id: string
  user: {
    _id: string
    name: string
    email: string
    role: string
    avatar?: string
  }
  action: string
  entity: string
  entityId?: string
  description: string
  ipAddress?: string
  userAgent?: string
  changes?: {
    before?: any
    after?: any
  }
  metadata?: any
  createdAt: string
  updatedAt?: string
}

export interface ActivityLogStats {
  total: number
  today: number
  thisWeek: number
  thisMonth: number
  byAction: Array<{ _id: string; count: number }>
  byEntity: Array<{ _id: string; count: number }>
}

export interface ActivityLogFilters {
  page?: number
  limit?: number
  action?: string
  entity?: string
  userId?: string
  startDate?: string
  endDate?: string
  search?: string
}

export interface ActivityLogsResponse {
  logs: ActivityLog[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  stats: ActivityLogStats
}

class ActivityLogService {
  private baseUrl = '/api/admin/activity-logs'

  /**
   * Get activity logs with filters and pagination
   */
  async getLogs(filters?: ActivityLogFilters): Promise<{ success: boolean; data?: ActivityLogsResponse; message?: string }> {
    try {
      const queryParams = new URLSearchParams()
      
      if (filters) {
        if (filters.page) queryParams.append('page', filters.page.toString())
        if (filters.limit) queryParams.append('limit', filters.limit.toString())
        if (filters.action) queryParams.append('action', filters.action)
        if (filters.entity) queryParams.append('entity', filters.entity)
        if (filters.userId) queryParams.append('userId', filters.userId)
        if (filters.startDate) queryParams.append('startDate', filters.startDate)
        if (filters.endDate) queryParams.append('endDate', filters.endDate)
        if (filters.search) queryParams.append('search', filters.search)
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
      console.error('Error fetching activity logs:', error)
      return { success: false, message: 'Failed to fetch activity logs' }
    }
  }

  /**
   * Get single activity log by ID
   */
  async getLogById(id: string): Promise<{ success: boolean; data?: ActivityLog; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`)

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        return { success: false, message: 'Unauthorized' }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error fetching activity log:', error)
      return { success: false, message: 'Failed to fetch activity log' }
    }
  }

  /**
   * Create activity log (manual logging)
   */
  async createLog(data: {
    action: string
    entity: string
    entityId?: string
    description: string
    metadata?: any
  }): Promise<{ success: boolean; data?: ActivityLog; message?: string }> {
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
      console.error('Error creating activity log:', error)
      return { success: false, message: 'Failed to create activity log' }
    }
  }

  /**
   * Delete old logs
   */
  async deleteOldLogs(days: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}?days=${days}`, {
        method: 'DELETE'
      })

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        return { success: false, message: 'Unauthorized' }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error deleting activity logs:', error)
      return { success: false, message: 'Failed to delete activity logs' }
    }
  }

  /**
   * Export logs as CSV
   */
  async exportLogs(filters?: Omit<ActivityLogFilters, 'page' | 'limit'>): Promise<void> {
    try {
      const queryParams = new URLSearchParams()
      
      if (filters) {
        if (filters.action) queryParams.append('action', filters.action)
        if (filters.entity) queryParams.append('entity', filters.entity)
        if (filters.startDate) queryParams.append('startDate', filters.startDate)
        if (filters.endDate) queryParams.append('endDate', filters.endDate)
      }

      const url = queryParams.toString() 
        ? `${this.baseUrl}/export?${queryParams.toString()}`
        : `${this.baseUrl}/export`

      window.location.href = url
    } catch (error) {
      console.error('Error exporting activity logs:', error)
      throw error
    }
  }

  /**
   * Get action icon
   */
  getActionIcon(action: string): string {
    const icons: Record<string, string> = {
      'LOGIN': '🔑',
      'LOGOUT': '🚪',
      'CREATE': '➕',
      'UPDATE': '✏️',
      'DELETE': '🗑️',
      'VIEW': '👁️',
      'APPROVE': '✅',
      'REJECT': '❌',
      'ASSIGN': '👤',
      'UPLOAD': '📤',
      'DOWNLOAD': '📥',
      'EXPORT': '📊',
      'SEND': '📧',
      'RECEIVE': '📨',
      'ENABLE': '🟢',
      'DISABLE': '🔴'
    }
    return icons[action] || '📝'
  }

  /**
   * Get action color
   */
  getActionColor(action: string): string {
    const colors: Record<string, string> = {
      'LOGIN': 'text-green-600 bg-green-50',
      'LOGOUT': 'text-gray-600 bg-gray-50',
      'CREATE': 'text-blue-600 bg-blue-50',
      'UPDATE': 'text-yellow-600 bg-yellow-50',
      'DELETE': 'text-red-600 bg-red-50',
      'VIEW': 'text-purple-600 bg-purple-50',
      'APPROVE': 'text-green-600 bg-green-50',
      'REJECT': 'text-red-600 bg-red-50',
      'ASSIGN': 'text-indigo-600 bg-indigo-50',
      'UPLOAD': 'text-blue-600 bg-blue-50',
      'DOWNLOAD': 'text-blue-600 bg-blue-50',
      'EXPORT': 'text-teal-600 bg-teal-50',
      'SEND': 'text-green-600 bg-green-50',
      'RECEIVE': 'text-green-600 bg-green-50',
      'ENABLE': 'text-green-600 bg-green-50',
      'DISABLE': 'text-red-600 bg-red-50'
    }
    return colors[action] || 'text-gray-600 bg-gray-50'
  }

  /**
   * Get entity icon
   */
  getEntityIcon(entity: string): string {
    const icons: Record<string, string> = {
      'User': '👤',
      'Product': '📦',
      'Category': '📁',
      'Order': '🛒',
      'Review': '⭐',
      'Coupon': '🎟️',
      'Refund': '💰',
      'BlogPost': '📝',
      'Banner': '🖼️',
      'Collection': '📚',
      'GiftCard': '🎁',
      'Warehouse': '🏪',
      'StockTransfer': '🚚',
      'EmailCampaign': '📧',
      'SupportTicket': '🎫',
      'ChatConversation': '💬',
      'Transaction': '💳',
      'Settings': '⚙️',
      'Notification': '🔔'
    }
    return icons[entity] || '📄'
  }
}

export const activityLogService = new ActivityLogService()

