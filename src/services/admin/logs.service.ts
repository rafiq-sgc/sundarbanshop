import { toast } from 'react-hot-toast'

export interface ChatLog {
  id: string
  conversationId: string
  timestamp: Date
  customerName: string
  customerEmail: string
  customerId: string | null
  agentName: string
  agentId: string | null
  agentEmail?: string | null
  status: 'completed' | 'abandoned' | 'transferred'
  duration: string
  durationSeconds: number
  messages: number
  satisfaction: number | null
  tags: string[]
  issue: string
  priority?: string
  transcript?: Array<{
    sender: string
    senderName: string
    message: string
    timestamp: Date
    read: boolean
  }>
}

export interface LogsSummary {
  totalLogs: number
  completed: number
  abandoned: number
  transferred: number
  avgDuration: number
  avgDurationFormatted: string
  totalMessages: number
}

export interface LogsResponse {
  logs: ChatLog[]
  summary: LogsSummary
  pagination: {
    page: number
    limit: number
    totalPages: number
    totalCount: number
  }
}

class LogsService {
  private baseUrl = '/api/admin/support/logs'

  /**
   * Get chat logs with filters
   */
  async getLogs(
    dateRange: string = '7days',
    status: string = 'all',
    search: string = '',
    page: number = 1,
    limit: number = 20
  ): Promise<{ success: boolean; data?: LogsResponse; message?: string }> {
    try {
      const params = new URLSearchParams({
        dateRange,
        status,
        search,
        page: page.toString(),
        limit: limit.toString()
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
      console.error('Error fetching logs:', error)
      return {
        success: false,
        message: 'Failed to fetch logs'
      }
    }
  }

  /**
   * Get a single log by ID
   */
  async getLogById(id: string): Promise<{ success: boolean; data?: ChatLog; message?: string }> {
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
      console.error('Error fetching log:', error)
      return {
        success: false,
        message: 'Failed to fetch log'
      }
    }
  }

  /**
   * Export logs as CSV or PDF
   */
  async exportLogs(
    dateRange: string = '7days',
    format: 'csv' | 'pdf' = 'csv',
    status: string = 'all'
  ): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const params = new URLSearchParams({
        dateRange,
        format,
        status
      })

      const response = await fetch(`${this.baseUrl}/export?${params}`, {
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

      if (format === 'csv') {
        // For CSV, get text content
        const csvContent = await response.text()
        return {
          success: true,
          data: csvContent
        }
      } else {
        // For PDF, get JSON data
        const result = await response.json()
        return result
      }
    } catch (error) {
      console.error('Error exporting logs:', error)
      return {
        success: false,
        message: 'Failed to export logs'
      }
    }
  }
}

export const logsService = new LogsService()

