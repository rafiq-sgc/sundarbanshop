interface AnalyticsStats {
  totalConversations: number
  activeChats: number
  avgResponseTime: string
  avgResolutionTime: string
  customerSatisfaction: number
  resolvedToday: number
  firstResponseTime: string
  chatAbandonment: string
}

interface ConversationTrend {
  date: string
  conversations: number
  resolved: number
  active: number
}

interface ResponseTimeData {
  hour: string
  avgTime: number
}

interface HourlyVolume {
  hour: string
  volume: number
}

interface StatusDistribution {
  resolved: number
  active: number
  pending: number
}

interface AgentPerformance {
  agent: string
  conversations: number
  avgRating: number
  avgResponse: number
}

interface TopIssue {
  issue: string
  count: number
  percentage: number
}

interface ChatAnalytics {
  stats: AnalyticsStats
  trends: {
    conversations: ConversationTrend[]
    responseTime: ResponseTimeData[]
    hourlyVolume: HourlyVolume[]
  }
  distribution: {
    status: StatusDistribution
  }
  performance: {
    agents: AgentPerformance[]
    topIssues: TopIssue[]
  }
}

class AnalyticsService {
  private baseUrl = '/api/admin/analytics'

  async getChatAnalytics(dateRange: string = '7days'): Promise<{ success: boolean; data?: ChatAnalytics; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/chat?dateRange=${dateRange}`, {
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
      console.error('Error fetching chat analytics:', error)
      return {
        success: false,
        message: 'Failed to fetch analytics'
      }
    }
  }

  async exportReport(dateRange: string = '7days', format: 'csv' | 'pdf' = 'csv'): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/export?dateRange=${dateRange}&format=${format}`, {
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
      console.error('Error exporting report:', error)
      return {
        success: false,
        message: 'Failed to export report'
      }
    }
  }
}

export const analyticsService = new AnalyticsService()
export type { ChatAnalytics, AnalyticsStats, ConversationTrend, ResponseTimeData, HourlyVolume, StatusDistribution, AgentPerformance, TopIssue }
