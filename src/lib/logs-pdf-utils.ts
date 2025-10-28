/**
 * Generate PDF report for chat logs
 */
export const generateLogsPDFReport = async (data: any, dateRange: string) => {
  try {
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      throw new Error('Unable to open print window')
    }

    // Generate HTML content for PDF
    const htmlContent = generateLogsPDFHTML(data, dateRange)
    
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
const generateLogsPDFHTML = (data: any, dateRange: string): string => {
  const { summary, logs } = data
  const currentDate = new Date().toLocaleDateString()
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Chat Logs Report - ${dateRange}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #10b981;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #10b981;
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
          color: #10b981;
        }
        .summary-card .value {
          font-size: 24px;
          font-weight: bold;
          color: #1e293b;
        }
        .logs-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          font-size: 11px;
        }
        .logs-table th,
        .logs-table td {
          border: 1px solid #e2e8f0;
          padding: 8px;
          text-align: left;
        }
        .logs-table th {
          background: #f1f5f9;
          font-weight: bold;
          color: #475569;
        }
        .logs-table tr:nth-child(even) {
          background: #f8fafc;
        }
        .status-badge {
          padding: 3px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
          display: inline-block;
        }
        .status-completed {
          background: #dcfce7;
          color: #166534;
        }
        .status-abandoned {
          background: #fee2e2;
          color: #991b1b;
        }
        .status-transferred {
          background: #dbeafe;
          color: #1e40af;
        }
        .priority-high {
          color: #dc2626;
          font-weight: bold;
        }
        .priority-medium {
          color: #f59e0b;
        }
        .priority-low {
          color: #10b981;
        }
        .tags {
          font-size: 9px;
          color: #6b7280;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #666;
          font-size: 12px;
          page-break-before: avoid;
        }
        @media print {
          body { margin: 0; }
          .header { page-break-after: avoid; }
          .summary { page-break-inside: avoid; }
          .logs-table { page-break-inside: auto; }
          .logs-table tr { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Chat Logs Report</h1>
        <p>Date Range: ${getDateRangeLabel(dateRange)}</p>
        <p>Generated on: ${currentDate}</p>
      </div>
      
      <div class="summary">
        <div class="summary-card">
          <h3>Total Logs</h3>
          <div class="value">${summary.totalLogs}</div>
        </div>
        <div class="summary-card">
          <h3>Completed</h3>
          <div class="value">${summary.completed}</div>
        </div>
        <div class="summary-card">
          <h3>Abandoned</h3>
          <div class="value">${summary.abandoned}</div>
        </div>
        <div class="summary-card">
          <h3>Transferred</h3>
          <div class="value">${summary.transferred}</div>
        </div>
      </div>
      
      <h2>Log Details</h2>
      <table class="logs-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Customer</th>
            <th>Agent</th>
            <th>Issue</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Duration</th>
            <th>Msgs</th>
            <th>Rating</th>
            <th>Tags</th>
          </tr>
        </thead>
        <tbody>
          ${logs.map((log: any) => `
            <tr>
              <td>${new Date(log.timestamp).toLocaleString()}</td>
              <td>
                <strong>${log.customerName}</strong><br>
                <small>${log.customerEmail}</small>
              </td>
              <td>${log.agentName}</td>
              <td>${log.issue}</td>
              <td><span class="status-badge status-${log.status}">${log.status.toUpperCase()}</span></td>
              <td class="priority-${log.priority || 'medium'}">${(log.priority || 'medium').toUpperCase()}</td>
              <td>${log.duration}</td>
              <td>${log.messages}</td>
              <td>${log.satisfaction ? '★'.repeat(log.satisfaction) : 'N/A'}</td>
              <td class="tags">${(log.tags || []).join(', ')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        <p>This report was generated automatically by the Chat Logs System</p>
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

