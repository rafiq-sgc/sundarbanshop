import { NextRequest, NextResponse } from 'next/server'
import { sendOrderConfirmationEmail } from '@/lib/email-helpers'
import { generateOrderInvoicePDF } from '@/lib/pdf-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { order, customerEmail, customerName } = body

    if (!order || !customerEmail) {
      return NextResponse.json(
        { success: false, message: 'Order and customer email are required' },
        { status: 400 }
      )
    }

    // Generate PDF invoice
    const pdfBuffer = await generateOrderInvoicePDF(order)

    // Send email with PDF attachment
    const emailResult = await sendOrderConfirmationEmail({
      to: customerEmail,
      customerName: customerName || order.shippingAddress.name,
      order: order,
      pdfBuffer: pdfBuffer
    })

    if (emailResult.success) {
      return NextResponse.json({
        success: true,
        message: 'Order confirmation email sent successfully'
      })
    } else {
      return NextResponse.json(
        { success: false, message: emailResult.message || 'Failed to send email' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Order confirmation email error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to send order confirmation email' },
      { status: 500 }
    )
  }
}
