import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface InvoiceData {
  orderNumber: string
  orderDate: string
  customer: {
    name: string
    email?: string
    phone?: string
    address: string
  }
  items: Array<{
    name: string
    sku: string
    quantity: number
    price: number
    total: number
  }>
  subtotal: number
  tax: number
  shipping: number
  discount: number
  total: number
  paymentMethod: string
  paymentStatus: string
  orderStatus: string
}

export async function generateInvoicePDF(invoiceData: InvoiceData): Promise<string> {
  const doc = new jsPDF()

  // Company Logo and Header
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('Sundarban Shop', 20, 20)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Modern E-commerce Platform', 20, 28)
  doc.text('Email: sundarbanshop.com@gmail.com', 20, 34)
  doc.text('Phone: +880 1XXX-XXXXXX', 20, 40)

  // Invoice Title
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('INVOICE', 150, 20)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Invoice #: ${invoiceData.orderNumber}`, 150, 28)
  doc.text(`Date: ${invoiceData.orderDate}`, 150, 34)
  
  // Status badges
  doc.setFontSize(9)
  
  // Payment status badge
  if (invoiceData.paymentStatus === 'paid') {
    doc.setFillColor(34, 197, 94) // Green for paid
  } else {
    doc.setFillColor(239, 68, 68) // Red for unpaid
  }
  doc.rect(150, 38, 40, 6, 'F')
  doc.setTextColor(255, 255, 255)
  doc.text(`Payment: ${invoiceData.paymentStatus.toUpperCase()}`, 152, 42)
  
  // Order status badge
  doc.setTextColor(0, 0, 0)
  doc.setFillColor(59, 130, 246) // Blue
  doc.rect(150, 46, 40, 6, 'F')
  doc.setTextColor(255, 255, 255)
  doc.text(`Status: ${invoiceData.orderStatus.toUpperCase()}`, 152, 50)
  
  doc.setTextColor(0, 0, 0)

  // Line separator
  doc.setDrawColor(200, 200, 200)
  doc.line(20, 55, 190, 55)

  // Bill To section
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Bill To:', 20, 65)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(invoiceData.customer.name, 20, 72)
  if (invoiceData.customer.email) {
    doc.text(`Email: ${invoiceData.customer.email}`, 20, 78)
  }
  if (invoiceData.customer.phone) {
    doc.text(`Phone: ${invoiceData.customer.phone}`, 20, 84)
  }
  doc.text(invoiceData.customer.address, 20, 90)

  // Items Table
  const tableStartY = 105

  autoTable(doc, {
    startY: tableStartY,
    head: [['Item', 'SKU', 'Qty', 'Price', 'Total']],
    body: invoiceData.items.map(item => [
      item.name,
      item.sku,
      item.quantity.toString(),
      `$${item.price.toFixed(2)}`,
      `$${item.total.toFixed(2)}`
    ]),
    theme: 'grid',
    headStyles: {
      fillColor: [34, 197, 94],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 40 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' }
    },
    styles: {
      fontSize: 9,
      cellPadding: 5
    }
  })

  // Get the Y position after the table
  const finalY = (doc as any).lastAutoTable.finalY || tableStartY + 50

  // Summary section
  const summaryX = 120
  let summaryY = finalY + 15

  doc.setFontSize(10)
  doc.text('Subtotal:', summaryX, summaryY)
  doc.text(`$${invoiceData.subtotal.toFixed(2)}`, 180, summaryY, { align: 'right' })
  
  summaryY += 7
  doc.text('Tax:', summaryX, summaryY)
  doc.text(`$${invoiceData.tax.toFixed(2)}`, 180, summaryY, { align: 'right' })
  
  summaryY += 7
  doc.text('Shipping:', summaryX, summaryY)
  doc.text(`$${invoiceData.shipping.toFixed(2)}`, 180, summaryY, { align: 'right' })
  
  if (invoiceData.discount > 0) {
    summaryY += 7
    doc.setTextColor(239, 68, 68)
    doc.text('Discount:', summaryX, summaryY)
    doc.text(`-$${invoiceData.discount.toFixed(2)}`, 180, summaryY, { align: 'right' })
    doc.setTextColor(0, 0, 0)
  }

  summaryY += 10
  doc.setDrawColor(200, 200, 200)
  doc.line(summaryX, summaryY - 3, 180, summaryY - 3)
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL:', summaryX, summaryY)
  doc.text(`$${invoiceData.total.toFixed(2)}`, 180, summaryY, { align: 'right' })

  // Payment Information
  summaryY += 15
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Payment Method: ${invoiceData.paymentMethod}`, 20, summaryY)

  // Footer
  const pageHeight = doc.internal.pageSize.height
  doc.setFontSize(8)
  doc.setTextColor(128, 128, 128)
  doc.text('Thank you for your business!', 105, pageHeight - 30, { align: 'center' })
  doc.text('For questions about this invoice, please contact sundarbanshop.com@gmail.com', 105, pageHeight - 25, { align: 'center' })
  doc.text('© 2025 Sundarban Shop. All rights reserved.', 105, pageHeight - 20, { align: 'center' })

  // Convert to base64
  const pdfBase64 = doc.output('datauristring').split(',')[1]
  return pdfBase64
}

// Generate PDF and return as buffer for backend
export async function generateInvoicePDFBuffer(invoiceData: InvoiceData): Promise<Buffer> {
  const base64 = await generateInvoicePDF(invoiceData)
  return Buffer.from(base64, 'base64')
}

// Download PDF in browser
export function downloadInvoicePDF(invoiceData: InvoiceData) {
  const doc = new jsPDF()
  // ... (same generation code)
  doc.save(`Invoice-${invoiceData.orderNumber}.pdf`)
}

