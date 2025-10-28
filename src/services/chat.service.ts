import { API_BASE_URL } from '@/lib/constants'

export interface Message {
  id: string
  conversationId: string
  sender: 'customer' | 'admin'
  senderName: string
  senderAvatar?: string
  message: string
  timestamp: Date
  read: boolean
  attachments?: string[]
}

export interface Conversation {
  id: string
  customerId: string
  customerName: string
  customerEmail: string
  customerAvatar?: string
  status: 'active' | 'pending' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high'
  subject: string
  lastMessage: string
  lastMessageTime: Date
  unreadCount: number
  assignedTo?: string
  messages: Message[]
  tags?: string[]
}

export interface ChatResponse {
  success: boolean
  message?: string
  data?: any
}

class ChatService {
  private baseUrl = `${API_BASE_URL}/chat`

  // Get all conversations
  async getConversations(status?: string): Promise<ChatResponse> {
    try {
      const url = status && status !== 'all' 
        ? `${this.baseUrl}/conversations?status=${status}`
        : `${this.baseUrl}/conversations`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.status === 401) {
        return { success: false, message: 'Unauthorized' }
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch conversations')
      }

      return response.json()
    } catch (error: any) {
      console.error('Error fetching conversations:', error)
      throw error
    }
  }

  // Get single conversation
  async getConversation(conversationId: string): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/conversations/${conversationId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch conversation')
      }

      return response.json()
    } catch (error: any) {
      console.error('Error fetching conversation:', error)
      throw error
    }
  }

  // Create new conversation
  async createConversation(data: {
    subject: string
    message: string
    customerName?: string
    customerEmail?: string
  }): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create conversation')
      }

      return response.json()
    } catch (error: any) {
      console.error('Error creating conversation:', error)
      throw error
    }
  }

  // Send message
  async sendMessage(conversationId: string, message: string, attachments?: string[]): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, attachments })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to send message')
      }

      return response.json()
    } catch (error: any) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  // Mark conversation as read
  async markAsRead(conversationId: string): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to mark as read')
      }

      return response.json()
    } catch (error: any) {
      console.error('Error marking as read:', error)
      throw error
    }
  }

  // Update conversation
  async updateConversation(conversationId: string, updates: {
    status?: string
    priority?: string
    assignedTo?: string
    tags?: string[]
  }): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update conversation')
      }

      return response.json()
    } catch (error: any) {
      console.error('Error updating conversation:', error)
      throw error
    }
  }

  // Delete conversation (admin only)
  async deleteConversation(conversationId: string): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete conversation')
      }

      return response.json()
    } catch (error: any) {
      console.error('Error deleting conversation:', error)
      throw error
    }
  }
}

export const chatService = new ChatService()

