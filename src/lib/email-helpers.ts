// Helper functions for email templates

/**
 * Format order items as HTML table rows for email
 */
export function formatOrderItemsHTML(items: Array<{
  name: string
  sku?: string
  quantity: number
  price: number
  total: number
}>): string {
  return items.map(item => `
    <tr>
      <td style="padding: 12px; border: 1px solid #ddd; color: #333;">
        ${item.name}
        ${item.sku ? `<br><span style="font-size: 11px; color: #999;">SKU: ${item.sku}</span>` : ''}
      </td>
      <td style="padding: 12px; border: 1px solid #ddd; text-align: center; color: #666;">
        ${item.quantity}
      </td>
      <td style="padding: 12px; border: 1px solid #ddd; text-align: right; color: #666;">
        $${item.price.toFixed(2)}
      </td>
      <td style="padding: 12px; border: 1px solid #ddd; text-align: right; font-weight: bold; color: #333;">
        $${item.total.toFixed(2)}
      </td>
    </tr>
  `).join('')
}

/**
 * Format shipping address for email
 */
export function formatShippingAddress(address: {
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  phone?: string
}): string {
  return `${address.name}\n${address.address}\n${address.city}, ${address.state} ${address.zipCode}\n${address.country}${address.phone ? `\nPhone: ${address.phone}` : ''}`
}

/**
 * Get email template ID based on order status
 */
export function getOrderStatusTemplateId(status: string): string {
  const statusTemplateMap: Record<string, string> = {
    'confirmed': 'order-status-confirmed',
    'processing': 'order-status-processing',
    'shipped': 'order-status-shipped',
    'delivered': 'order-status-delivered',
    'cancelled': 'order-status-cancelled',
  }
  return statusTemplateMap[status] || 'order-status-confirmed'
}

/**
 * Format order date for display
 */
export function formatOrderDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Calculate expected delivery date (7 days from ship date)
 */
export function getExpectedDelivery(shipDate: Date | string = new Date()): string {
  const d = typeof shipDate === 'string' ? new Date(shipDate) : shipDate
  const expectedDate = new Date(d)
  expectedDate.setDate(expectedDate.getDate() + 7)
  
  return expectedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

import { sendEmail } from './simple-email'

/**
 * Send order confirmation email with PDF invoice
 */
export async function sendOrderConfirmationEmail({
  to,
  customerName,
  order,
  pdfBuffer
}: {
  to: string
  customerName: string
  order: any
  pdfBuffer: Buffer
}): Promise<{ success: boolean; message?: string }> {
  try {
    console.log('Sending order confirmation email to:', to)
    console.log('Order Number:', order.orderNumber)
    console.log('Customer Name:', customerName)
    console.log('Order Total:', order.total)
    
    // Generate HTML email content
    const htmlContent = generateOrderConfirmationHTML(order, customerName)
    
    // Send email with PDF attachment
    const result = await sendEmail({
      to,
      subject: `Order Confirmation - ${order.orderNumber}`,
      html: htmlContent,
      attachments: [
        {
          filename: `invoice-${order.orderNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    })
    
    console.log('Email service result:', result)
    
    return result
  } catch (error) {
    console.error('Error sending order confirmation email:', error)
    return {
      success: false,
      message: 'Failed to send order confirmation email'
    }
  }
}

/**
 * Generate HTML content for order confirmation email
 */
function generateOrderConfirmationHTML(order: any, customerName: string): string {
  const orderItemsHTML = order.items.map((item: any) => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 12px; color: #333;">
        <strong>${item.name}</strong>
        ${item.sku ? `<br><small style="color: #666;">SKU: ${item.sku}</small>` : ''}
      </td>
      <td style="padding: 12px; text-align: center; color: #666;">
        ${item.quantity}
      </td>
      <td style="padding: 12px; text-align: right; color: #666;">
        ৳${item.price.toFixed(2)}
      </td>
      <td style="padding: 12px; text-align: right; font-weight: bold; color: #333;">
        ৳${item.total.toFixed(2)}
      </td>
    </tr>
  `).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation - ${order.orderNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .order-details { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .items-table th { background: #f8f9fa; padding: 12px; text-align: left; border-bottom: 2px solid #ddd; }
        .total-section { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 20px; }
        .total-row { display: flex; justify-content: space-between; margin: 8px 0; }
        .total-final { font-size: 18px; font-weight: bold; color: #2c5aa0; border-top: 2px solid #ddd; padding-top: 12px; }
        .footer { margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; text-align: center; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0; color: #2c5aa0;">Order Confirmation</h1>
        <p style="margin: 10px 0 0 0; color: #666;">Thank you for your order, ${customerName}!</p>
      </div>

      <div class="order-details">
        <h2 style="margin-top: 0; color: #333;">Order Details</h2>
        <p><strong>Order Number:</strong> ${order.orderNumber}</p>
        <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
        <p><strong>Payment Method:</strong> ${order.paymentMethod?.toUpperCase() || 'Cash on Delivery'}</p>
        <p><strong>Status:</strong> ${order.orderStatus || 'Pending'}</p>
      </div>

      <div class="order-details">
        <h3 style="margin-top: 0; color: #333;">Shipping Address</h3>
        <p>
          <strong>${order.shippingAddress.name}</strong><br>
          ${order.shippingAddress.address}<br>
          ${order.shippingAddress.city}${order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ''}${order.shippingAddress.zipCode ? ` ${order.shippingAddress.zipCode}` : ''}<br>
          ${order.shippingAddress.country}<br>
          Phone: ${order.shippingAddress.phone}
        </p>
      </div>

      <div class="order-details">
        <h3 style="margin-top: 0; color: #333;">Order Items</h3>
        <table class="items-table">
          <thead>
            <tr>
              <th>Product</th>
              <th style="text-align: center;">Quantity</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${orderItemsHTML}
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>৳${order.subtotal?.toFixed(2) || '0.00'}</span>
          </div>
          <div class="total-row">
            <span>Tax:</span>
            <span>৳${order.tax?.toFixed(2) || '0.00'}</span>
          </div>
          <div class="total-row">
            <span>Shipping:</span>
            <span>৳${order.shipping?.toFixed(2) || '0.00'}</span>
          </div>
          <div class="total-row total-final">
            <span>Total:</span>
            <span>৳${order.total?.toFixed(2) || '0.00'}</span>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>Thank you for shopping with Ekomart!</p>
        <p>If you have any questions, please contact our customer service.</p>
        <p><small>This email was sent automatically. Please do not reply to this email.</small></p>
      </div>
    </body>
    </html>
  `
}

