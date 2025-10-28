// Order Email Service
import { IOrder } from '@/models/Order'

export interface OrderEmailData {
  order: IOrder
  customerEmail: string
  customerName: string
}

export interface EmailResponse {
  success: boolean
  message?: string
}

class OrderEmailService {
  private baseUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/email`

  /**
   * Send order confirmation email with PDF invoice
   */
  async sendOrderConfirmation(data: OrderEmailData): Promise<EmailResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/order-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Failed to send order confirmation email'
        }
      }

      return result
    } catch (error) {
      console.error('Order email service error:', error)
      return {
        success: false,
        message: 'Network error. Please try again.'
      }
    }
  }

  /**
   * Send order status update email
   */
  async sendOrderStatusUpdate(data: OrderEmailData): Promise<EmailResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/order-status-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Failed to send order status update email'
        }
      }

      return result
    } catch (error) {
      console.error('Order email service error:', error)
      return {
        success: false,
        message: 'Network error. Please try again.'
      }
    }
  }
}

export const orderEmailService = new OrderEmailService()
export default orderEmailService
