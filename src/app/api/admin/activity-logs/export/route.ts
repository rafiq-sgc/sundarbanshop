import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import ActivityLog from '@/models/ActivityLog'

// GET - Export activity logs as CSV
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    
    // Filters
    const action = searchParams.get('action') || ''
    const entity = searchParams.get('entity') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''

    // Build query
    const query: any = {}

    if (action) query.action = action
    if (entity) query.entity = entity

    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate)
      if (endDate) query.createdAt.$lte = new Date(endDate)
    }

    // Get logs
    const logs = await ActivityLog.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(10000) // Limit to 10k records
      .lean()

    // Generate CSV
    const csv = generateCSV(logs)

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="activity-logs-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error: any) {
    console.error('Error exporting activity logs:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to export activity logs' },
      { status: 500 }
    )
  }
}

function generateCSV(logs: any[]): string {
  const headers = [
    'Date & Time',
    'User Name',
    'User Email',
    'User Role',
    'Action',
    'Entity',
    'Entity ID',
    'Description',
    'IP Address',
    'User Agent'
  ]

  const rows = logs.map(log => [
    new Date(log.createdAt).toLocaleString(),
    log.user?.name || 'Unknown',
    log.user?.email || 'Unknown',
    log.user?.role || 'Unknown',
    log.action,
    log.entity,
    log.entityId || 'N/A',
    `"${(log.description || '').replace(/"/g, '""')}"`,
    log.ipAddress || 'N/A',
    `"${(log.userAgent || 'N/A').replace(/"/g, '""')}"`
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  return csvContent
}

