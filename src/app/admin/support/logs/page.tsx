'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { logsService, type ChatLog, type LogsSummary } from '@/services/admin'
import { generateLogsPDFReport } from '@/lib/logs-pdf-utils'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { toast } from 'react-hot-toast'
import {
  Search,
  Filter,
  Download,
  Calendar,
  User,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  MoreVertical,
  FileText,
  Loader2
} from 'lucide-react'

export default function ChatLogsPage() {
  const { isAuthorized, loading: authLoading } = useAdminAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState('7days')
  const [selectedLog, setSelectedLog] = useState<ChatLog | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [logs, setLogs] = useState<ChatLog[]>([])
  const [summary, setSummary] = useState<LogsSummary | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1,
    totalCount: 0
  })

  // Fetch logs data
  const fetchLogs = async () => {
    if (!isAuthorized) return
    
    try {
      setLoading(true)
      const result = await logsService.getLogs(
        dateFilter,
        statusFilter,
        searchQuery,
        pagination.page,
        pagination.limit
      )
      
      if (result.success && result.data) {
        setLogs(result.data.logs)
        setSummary(result.data.summary)
        setPagination(result.data.pagination)
      } else {
        toast.error(result.message || 'Failed to fetch logs')
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
      toast.error('Failed to fetch logs')
    } finally {
      setLoading(false)
    }
  }

  // Fetch log details
  const fetchLogDetails = async (logId: string) => {
    try {
      const result = await logsService.getLogById(logId)
      
      if (result.success && result.data) {
        setSelectedLog(result.data)
        setShowDetails(true)
      } else {
        toast.error(result.message || 'Failed to fetch log details')
      }
    } catch (error) {
      console.error('Error fetching log details:', error)
      toast.error('Failed to fetch log details')
    }
  }

  // Handle export
  const handleExport = async (format: 'csv' | 'pdf' = 'csv') => {
    try {
      setExporting(true)
      const result = await logsService.exportLogs(dateFilter, format, statusFilter)
      
      if (result.success) {
        if (format === 'csv') {
          // For CSV, create download link
          const blob = new Blob([result.data], { type: 'text/csv' })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `chat-logs-${dateFilter}.csv`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          window.URL.revokeObjectURL(url)
        } else {
          // For PDF, generate PDF using the data
          await generateLogsPDFReport(result.data, dateFilter)
        }
        toast.success('Logs exported successfully')
      } else {
        toast.error(result.message || 'Failed to export logs')
      }
    } catch (error) {
      console.error('Error exporting logs:', error)
      toast.error('Failed to export logs')
    } finally {
      setExporting(false)
    }
  }

  // Load logs on mount and when filters change
  useEffect(() => {
    if (isAuthorized) {
      fetchLogs()
    }
  }, [isAuthorized, dateFilter, statusFilter, pagination.page])

  // Debounced search
  useEffect(() => {
    if (!isAuthorized) return
    
    const timer = setTimeout(() => {
      fetchLogs()
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700'
      case 'abandoned': return 'bg-red-100 text-red-700'
      case 'transferred': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'abandoned': return <XCircle className="w-4 h-4" />
      case 'transferred': return <AlertCircle className="w-4 h-4" />
      default: return null
    }
  }

  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  // Show loading or unauthorized state
  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading logs...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!isAuthorized) {
    return null // Will redirect in useAdminAuth
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Chat Logs</h1>
              <p className="text-gray-600 mt-2">View and analyze all chat conversation history</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleExport('csv')}
                disabled={exporting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50"
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => handleExport('pdf')}
                disabled={exporting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50"
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                <span>Export PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by customer, agent, or issue..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="abandoned">Abandoned</option>
                <option value="transferred">Transferred</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{summary?.totalLogs || 0}</span>
            </div>
            <p className="text-sm text-gray-600">Total Logs</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {summary?.completed || 0}
              </span>
            </div>
            <p className="text-sm text-gray-600">Completed</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {summary?.abandoned || 0}
              </span>
            </div>
            <p className="text-sm text-gray-600">Abandoned</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{summary?.avgDurationFormatted || '0:00'}</span>
            </div>
            <p className="text-sm text-gray-600">Avg Duration</p>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Timestamp</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Customer</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Agent</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Issue</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Status</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Duration</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Messages</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Rating</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{formatTimestamp(log.timestamp)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{log.customerName}</p>
                        <p className="text-xs text-gray-500">{log.customerEmail}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{log.agentName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{log.issue}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          {log.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                        {getStatusIcon(log.status)}
                        <span>{log.status}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{log.duration}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        <span>{log.messages}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {log.satisfaction ? (
                        <div className="flex items-center space-x-1">
                          <span className="text-yellow-400">{'★'.repeat(log.satisfaction)}</span>
                          <span className="text-gray-300">{'★'.repeat(5 - log.satisfaction)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => fetchLogDetails(log.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing <span className="font-medium">{logs.length}</span> of{' '}
                <span className="font-medium">{pagination.totalCount}</span> logs
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  Previous
                </button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    const current = pagination.page
                    return page === 1 || page === pagination.totalPages || 
                           (page >= current - 1 && page <= current + 1)
                  })
                  .map((page, idx, arr) => {
                    if (idx > 0 && page > arr[idx - 1] + 1) {
                      return (
                        <span key={`ellipsis-${page}`} className="px-2 text-gray-500">...</span>
                      )
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => setPagination({ ...pagination, page })}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          pagination.page === page
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Details Modal */}
        {showDetails && selectedLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Chat Log Details</h3>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XCircle className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Customer Info */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Customer Information</h4>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Name</p>
                      <p className="text-sm font-medium text-gray-900">{selectedLog.customerName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Email</p>
                      <p className="text-sm font-medium text-gray-900">{selectedLog.customerEmail}</p>
                    </div>
                  </div>
                </div>

                {/* Chat Info */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Chat Information</h4>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Agent</p>
                      <p className="text-sm font-medium text-gray-900">{selectedLog.agentName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Status</p>
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedLog.status)}`}>
                        {getStatusIcon(selectedLog.status)}
                        <span>{selectedLog.status}</span>
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Duration</p>
                      <p className="text-sm font-medium text-gray-900">{selectedLog.duration}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Messages</p>
                      <p className="text-sm font-medium text-gray-900">{selectedLog.messages} messages</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Timestamp</p>
                      <p className="text-sm font-medium text-gray-900">{formatTimestamp(selectedLog.timestamp)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Satisfaction</p>
                      {selectedLog.satisfaction ? (
                        <div className="flex items-center space-x-1">
                          <span className="text-yellow-400 text-sm">{'★'.repeat(selectedLog.satisfaction)}</span>
                          <span className="text-gray-300 text-sm">{'★'.repeat(5 - selectedLog.satisfaction)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Not rated</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Issue & Tags */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Issue Details</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-900 mb-2">{selectedLog.issue}</p>
                    <div className="flex items-center space-x-2">
                      {selectedLog.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-3">
                  <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>View Full Transcript</span>
                  </button>
                  <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center space-x-2">
                    <Download className="w-4 h-4" />
                    <span>Export Log</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

