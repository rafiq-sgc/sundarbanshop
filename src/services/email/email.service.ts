import { API_BASE_URL } from '@/lib/constants'

export interface EmailRecipient {
  email: string
  name?: string
}

export interface EmailAttachment {
  filename: string
  content: string // Base64 encoded
  contentType: string
}

export interface SendEmailRequest {
  to: EmailRecipient | EmailRecipient[]
  subject: string
  body: string
  cc?: EmailRecipient[]
  bcc?: EmailRecipient[]
  attachments?: EmailAttachment[]
  templateId?: string
  templateVariables?: Record<string, string>
  priority?: 'high' | 'normal' | 'low'
  replyTo?: string
}

export interface SendEmailResponse {
  success: boolean
  message: string
  messageId?: string
}

export interface EmailLog {
  _id: string
  to: string[]
  subject: string
  status: 'sent' | 'failed' | 'pending' | 'bounced'
  sentAt?: string
  failureReason?: string
  templateId?: string
  sentBy: string
  createdAt: string
}

class EmailService {
  private baseUrl = `${API_BASE_URL}/admin/emails`

  /**
   * Send email using template or custom content
   */
  async send(data: SendEmailRequest): Promise<SendEmailResponse> {
    const response = await fetch(`${this.baseUrl}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to send email')
    }
    
    return response.json()
  }

  /**
   * Get email logs/history
   */
  async getLogs(params?: {
    limit?: number
    offset?: number
    status?: string
  }): Promise<{
    logs: EmailLog[]
    total: number
  }> {
    const query = new URLSearchParams(params as any).toString()
    const response = await fetch(`${this.baseUrl}/logs?${query}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch email logs')
    }
    
    return response.json()
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/test`, {
      method: 'POST',
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to test email connection')
    }
    
    return response.json()
  }
}

export const emailService = new EmailService()

