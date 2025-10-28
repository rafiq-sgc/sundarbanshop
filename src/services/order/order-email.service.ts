import { getTemplateById, replaceTemplateVariables } from '@/lib/email-templates'
import { generateInvoicePDF } from '@/lib/pdf-generator'
import { 
  formatOrderItemsHTML, 
  formatShippingAddress, 
  formatOrderDate,
  getOrderStatusTemplateId,
  getExpectedDelivery
} from '@/lib/email-helpers'
import nodemailer from 'nodemailer'

// Create nodemailer transporter (server-side only)
function getTransporter() {
  const emailServiceType = process.env.EMAIL_SERVICE
  const emailHost = process.env.EMAIL_HOST
  const emailPort = parseInt(process.env.EMAIL_PORT || '587')
  const emailUser = process.env.EMAIL_USER
  const emailPassword = process.env.EMAIL_PASSWORD

  if (emailServiceType === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    })
  }

  // Default SMTP configuration
  return nodemailer.createTransport({
    host: emailHost || 'smtp.gmail.com',
    port: emailPort,
    secure: emailPort === 465,
    auth: emailUser && emailPassword ? {
      user: emailUser,
      pass: emailPassword,
    } : undefined,
  })
}

export interface OrderEmailData {
  orderNumber: string
  orderDate: string | Date
  customer: {
    name: string
    email: string
    phone?: string
  }
  items: Array<{
    name: string
    sku?: string
    quantity: number
    price: number
    total: number
  }>
  shippingAddress: {
    name: string
    address: string
    city: string
    state: string
    zipCode: string
    country: string
    phone?: string
  }
  subtotal: number
  tax: number
  shipping: number
  discount: number
  total: number
  paymentMethod: string
  paymentStatus: string
  orderStatus: string
  trackingNumber?: string
  orderUrl?: string
  trackingUrl?: string
}

class OrderEmailService {
  /**
   * Send order confirmation email with invoice PDF
   */
  async sendOrderConfirmationWithInvoice(orderData: OrderEmailData): Promise<void> {
    try {
      console.log(`Sending order confirmation email for order ${orderData.orderNumber}`)

      // Generate PDF invoice
      const pdfBase64 = await generateInvoicePDF({
        orderNumber: orderData.orderNumber,
        orderDate: formatOrderDate(orderData.orderDate),
        customer: {
          name: orderData.customer.name,
          email: orderData.customer.email,
          phone: orderData.customer.phone,
          address: formatShippingAddress(orderData.shippingAddress)
        },
        items: orderData.items.map(item => ({
          ...item,
          sku: item.sku || 'N/A'
        })),
        subtotal: orderData.subtotal,
        tax: orderData.tax,
        shipping: orderData.shipping,
        discount: orderData.discount,
        total: orderData.total,
        paymentMethod: orderData.paymentMethod,
        paymentStatus: orderData.paymentStatus,
        orderStatus: orderData.orderStatus
      })

      // Get invoice template
      const template = getTemplateById('order-invoice')
      if (!template) throw new Error('Order invoice template not found')

      // Format order items as HTML
      const orderItemsHTML = formatOrderItemsHTML(orderData.items)

      // Prepare template variables
      const variables = {
        orderNumber: orderData.orderNumber,
        customerName: orderData.customer.name,
        orderItems: orderItemsHTML,
        subtotal: orderData.subtotal.toFixed(2),
        tax: orderData.tax.toFixed(2),
        shipping: orderData.shipping.toFixed(2),
        discount: orderData.discount.toFixed(2),
        total: orderData.total.toFixed(2),
        paymentMethod: orderData.paymentMethod,
        shippingAddress: formatShippingAddress(orderData.shippingAddress).replace(/\n/g, '<br>'),
        orderUrl: orderData.orderUrl || `${process.env.NEXTAUTH_URL}/orders/${orderData.orderNumber}`,
        trackingUrl: orderData.trackingUrl || `${process.env.NEXTAUTH_URL}/track-order?order=${orderData.orderNumber}&email=${encodeURIComponent(orderData.customer.email)}`,
      }

      // Generate email content
      const subject = replaceTemplateVariables(template.subject, variables)
      const body = replaceTemplateVariables(template.body, variables)

      // Send email with PDF attachment using nodemailer directly
      const transporter = getTransporter()
      const fromEmail = process.env.EMAIL_FROM || 'noreply@ekomart.com'
      const fromName = process.env.EMAIL_FROM_NAME || 'EkoMart'

      const mailOptions = {
        from: `${fromName} <${fromEmail}>`,
        to: `${orderData.customer.name} <${orderData.customer.email}>`,
        subject,
        html: body,
        attachments: [{
          filename: `Invoice-${orderData.orderNumber}.pdf`,
          content: pdfBase64,
          encoding: 'base64' as const,
          contentType: 'application/pdf'
        }],
        priority: 'high' as 'high' | 'normal' | 'low'
      }

      await transporter.sendMail(mailOptions)

      console.log(`Order confirmation email sent successfully to ${orderData.customer.email}`)
    } catch (error) {
      console.error('Failed to send order confirmation email:', error)
      throw error
    }
  }

  /**
   * Send order status update email (without PDF)
   */
  async sendOrderStatusUpdate(
    orderData: OrderEmailData,
    additionalData?: {
      trackingNumber?: string
      expectedDelivery?: string
      cancellationReason?: string
    }
  ): Promise<void> {
    try {
      console.log(`Sending order status update (${orderData.orderStatus}) for order ${orderData.orderNumber}`)

      // Get appropriate template based on status
      const templateId = getOrderStatusTemplateId(orderData.orderStatus)
      const template = getTemplateById(templateId)
      
      if (!template) {
        console.warn(`Template ${templateId} not found, using default`)
        return
      }

      // Prepare template variables
      const variables: Record<string, string> = {
        customerName: orderData.customer.name,
        orderNumber: orderData.orderNumber,
        orderDate: formatOrderDate(orderData.orderDate),
        total: orderData.total.toFixed(2),
        itemCount: orderData.items.length.toString(),
        orderUrl: orderData.orderUrl || `${process.env.NEXTAUTH_URL}/orders/${orderData.orderNumber}`,
        storeName: 'EkoMart',
      }

      // Add status-specific variables
      if (orderData.orderStatus === 'shipped') {
        variables.trackingNumber = additionalData?.trackingNumber || orderData.trackingNumber || 'N/A'
        variables.expectedDelivery = additionalData?.expectedDelivery || getExpectedDelivery()
        variables.trackingUrl = `https://track.example.com/${variables.trackingNumber}`
      }

      if (orderData.orderStatus === 'cancelled') {
        variables.cancellationReason = additionalData?.cancellationReason || 'Customer request'
        variables.shopUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      }

      if (orderData.orderStatus === 'delivered') {
        variables.reviewUrl = `${process.env.NEXTAUTH_URL}/orders/${orderData.orderNumber}/review`
      }

      // Generate email content
      const subject = replaceTemplateVariables(template.subject, variables)
      const body = replaceTemplateVariables(template.body, variables)

      // Send email using nodemailer directly
      const transporter = getTransporter()
      const fromEmail = process.env.EMAIL_FROM || 'noreply@ekomart.com'
      const fromName = process.env.EMAIL_FROM_NAME || 'EkoMart'

      const emailPriority: 'high' | 'normal' | 'low' = orderData.orderStatus === 'shipped' ? 'high' : 'normal'
      
      const mailOptions = {
        from: `${fromName} <${fromEmail}>`,
        to: `${orderData.customer.name} <${orderData.customer.email}>`,
        subject,
        html: body,
        priority: emailPriority
      }

      await transporter.sendMail(mailOptions)

      console.log(`Order status update email sent successfully to ${orderData.customer.email}`)
    } catch (error) {
      console.error('Failed to send order status update email:', error)
      throw error
    }
  }
}

export const orderEmailService = new OrderEmailService()

