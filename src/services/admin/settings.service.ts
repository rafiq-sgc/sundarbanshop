import { toast } from 'react-hot-toast'

export interface ChatSettings {
  // General Settings
  chatEnabled: boolean
  autoAssign: boolean
  maxChatsPerAgent: number
  workingHours: {
    enabled: boolean
    start: string
    end: string
    timezone?: string
    days?: string[]
  }
  
  // Notification Settings
  emailNotifications: boolean
  pushNotifications: boolean
  soundAlerts: boolean
  desktopNotifications: boolean
  notificationEmail?: string
  
  // Auto Response
  autoGreeting: boolean
  greetingMessage: string
  autoAwayMessage: boolean
  awayMessage: string
  autoCloseMessage?: boolean
  closeMessage?: string
  responseDelay?: number
  
  // Customer Experience
  showAgentTyping: boolean
  showAgentAvatar: boolean
  allowFileUploads: boolean
  maxFileSize: number
  requestFeedback: boolean
  feedbackOptions?: string[]
  chatWidgetPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  chatWidgetColor?: string
  
  // Routing
  routingMethod: 'round-robin' | 'least-active' | 'random' | 'manual'
  priorityRouting: boolean
  skillBasedRouting: boolean
  transferEnabled?: boolean
  maxWaitTime?: number
  
  // Security
  requireEmail: boolean
  requireName?: boolean
  blockAnonymous: boolean
  rateLimit: number
  spamProtection: boolean
  allowedDomains?: string[]
  blockedIPs?: string[]
  
  // Advanced
  offlineMode?: 'hide' | 'show-message' | 'email-form'
  sessionTimeout?: number
  inactivityTimeout?: number
  maxMessageLength?: number
  enableTypingIndicator?: boolean
  enableReadReceipts?: boolean
  
  // Metadata
  _id?: string
  updatedBy?: any
  updatedAt?: Date
  createdAt?: Date
}

class SettingsService {
  private baseUrl = '/api/admin/support/settings'

  /**
   * Get current chat settings
   */
  async getSettings(): Promise<{ success: boolean; data?: ChatSettings; message?: string }> {
    try {
      const response = await fetch(this.baseUrl, {
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
      console.error('Error fetching settings:', error)
      return {
        success: false,
        message: 'Failed to fetch settings'
      }
    }
  }

  /**
   * Update chat settings
   */
  async updateSettings(settings: Partial<ChatSettings>): Promise<{ success: boolean; data?: ChatSettings; message?: string }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
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
      console.error('Error updating settings:', error)
      return {
        success: false,
        message: 'Failed to update settings'
      }
    }
  }

  /**
   * Reset settings to default
   */
  async resetSettings(): Promise<{ success: boolean; data?: ChatSettings; message?: string }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
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
      console.error('Error resetting settings:', error)
      return {
        success: false,
        message: 'Failed to reset settings'
      }
    }
  }
}

export const settingsService = new SettingsService()

