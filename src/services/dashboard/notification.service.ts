// Dashboard Notification Service
import { API_BASE_URL } from '@/lib/constants'

export interface Notification {
  _id: string
  userId: string
  type: 'order' | 'payment' | 'account' | 'promotion' | 'system'
  title: string
  message: string
  read: boolean
  link?: string
  createdAt: string
}

export interface NotificationResponse {
  success: boolean
  message?: string
  data?: Notification[]
  notification?: Notification
  unreadCount?: number
}

class NotificationService {
  private baseUrl = `${API_BASE_URL}/dashboard/notifications`

  /**
   * Get all notifications for current user
   */
  async getNotifications(limit?: number): Promise<NotificationResponse> {
    const url = limit ? `${this.baseUrl}?limit=${limit}` : this.baseUrl
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch notifications')
    }

    return response.json()
  }

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<NotificationResponse> {
    const response = await fetch(`${this.baseUrl}/unread-count`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch unread count')
    }

    return response.json()
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<NotificationResponse> {
    const response = await fetch(`${this.baseUrl}/${notificationId}/read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to mark as read')
    }

    return response.json()
  }

  /**
   * Mark all as read
   */
  async markAllAsRead(): Promise<NotificationResponse> {
    const response = await fetch(`${this.baseUrl}/mark-all-read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to mark all as read')
    }

    return response.json()
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<NotificationResponse> {
    const response = await fetch(`${this.baseUrl}/${notificationId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to delete notification')
    }

    return response.json()
  }

  /**
   * Delete all notifications
   */
  async deleteAllNotifications(): Promise<NotificationResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to delete all notifications')
    }

    return response.json()
  }
}

export const notificationService = new NotificationService()

