/**
 * Generate PDF invoice for order
 */
export const generateOrderInvoicePDF = async (order: any): Promise<Buffer> => {
  try {
    // For now, we'll return a simple buffer
    // In production, you would use a proper PDF library like puppeteer, jsPDF, or PDFKit
    const invoiceContent = `
      Order Invoice
      Order Number: ${order.orderNumber}
      Date: ${new Date(order.createdAt).toLocaleDateString()}
      Customer: ${order.shippingAddress.name}
      Email: ${order.guestEmail || order.shippingAddress.email || 'N/A'}
      
      Items:
      ${order.items.map((item: any) => 
        `${item.name} - Qty: ${item.quantity} - Price: ৳${item.price} - Total: ৳${item.total}`
      ).join('\n')}
      
      Subtotal: ৳${order.subtotal}
      Tax: ৳${order.tax}
      Shipping: ৳${order.shipping}
      Total: ৳${order.total}
    `
    
    // Return a simple buffer (in production, this would be a proper PDF)
    return Buffer.from(invoiceContent, 'utf-8')
  } catch (error) {
    console.error('Error generating order invoice PDF:', error)
    throw error
  }
}

/**
 * Generate PDF report for chat analytics
 */
export const generatePDFReport = async (data: any, dateRange: string) => {
  try {
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      throw new Error('Unable to open print window')
    }

    // Generate HTML content for PDF
    const htmlContent = generatePDFHTML(data, dateRange)
    
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 1000)
    
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw error
  }
}

/**
 * Generate HTML content for PDF report
 */
const generatePDFHTML = (data: any, dateRange: string): string => {
  const { summary, conversations } = data
  const currentDate = new Date().toLocaleDateString()
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Chat Analytics Report - ${dateRange}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #3b82f6;
          margin: 0;
        }
        .header p {
          color: #666;
          margin: 5px 0;
        }
        .summary {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }
        .summary-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }
        .summary-card h3 {
          margin: 0 0 10px 0;
          color: #3b82f6;
        }
        .summary-card .value {
          font-size: 24px;
          font-weight: bold;
          color: #1e293b;
        }
        .conversations-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        .conversations-table th,
        .conversations-table td {
          border: 1px solid #e2e8f0;
          padding: 12px;
          text-align: left;
        }
        .conversations-table th {
          background: #f1f5f9;
          font-weight: bold;
          color: #475569;
        }
        .conversations-table tr:nth-child(even) {
          background: #f8fafc;
        }
        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }
        .status-active {
          background: #dcfce7;
          color: #166534;
        }
        .status-pending {
          background: #fef3c7;
          color: #92400e;
        }
        .status-resolved {
          background: #dbeafe;
          color: #1e40af;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        @media print {
          body { margin: 0; }
          .header { page-break-after: avoid; }
          .summary { page-break-inside: avoid; }
          .conversations-table { page-break-inside: auto; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Chat Analytics Report</h1>
        <p>Date Range: ${getDateRangeLabel(dateRange)}</p>
        <p>Generated on: ${currentDate}</p>
      </div>
      
      <div class="summary">
        <div class="summary-card">
          <h3>Total Conversations</h3>
          <div class="value">${summary.totalConversations}</div>
        </div>
        <div class="summary-card">
          <h3>Active Chats</h3>
          <div class="value">${summary.activeChats}</div>
        </div>
        <div class="summary-card">
          <h3>Resolved Chats</h3>
          <div class="value">${summary.resolvedChats}</div>
        </div>
        <div class="summary-card">
          <h3>Total Messages</h3>
          <div class="value">${summary.totalMessages}</div>
        </div>
      </div>
      
      <h2>Conversation Details</h2>
      <table class="conversations-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Subject</th>
            <th>Customer</th>
            <th>Status</th>
            <th>Assigned To</th>
            <th>Messages</th>
            <th>Created</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          ${conversations.map((conv: any) => `
            <tr>
              <td>${conv.id}</td>
              <td>${conv.subject}</td>
              <td>${conv.customerName}<br><small>${conv.customerEmail}</small></td>
              <td><span class="status-badge status-${conv.status}">${conv.status.toUpperCase()}</span></td>
              <td>${conv.assignedTo}</td>
              <td>${conv.messageCount}</td>
              <td>${new Date(conv.createdAt).toLocaleDateString()}</td>
              <td>${conv.updatedAt ? new Date(conv.updatedAt).toLocaleDateString() : 'N/A'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        <p>This report was generated automatically by the Chat Analytics System</p>
        <p>For support, contact your system administrator</p>
      </div>
    </body>
    </html>
  `
}

/**
 * Get human-readable date range label
 */
const getDateRangeLabel = (dateRange: string): string => {
  switch (dateRange) {
    case 'today':
      return 'Today'
    case '7days':
      return 'Last 7 Days'
    case '30days':
      return 'Last 30 Days'
    case '90days':
      return 'Last 90 Days'
    default:
      return dateRange
  }
}
