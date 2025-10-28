'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { activityLogService, type ActivityLog, type ActivityLogStats } from '@/services/activity-log.service'
import {
  Activity,
  User,
  Calendar,
  Download,
  Search,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Eye,
  RefreshCw,
  BarChart3
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default function ActivityLogsPage() {
  const { isAuthorized, loading: authLoading } = useAdminAuth()
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [stats, setStats] = useState<ActivityLogStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // Filters
  const [page, setPage] = useState(1)
  const [limit] = useState(50)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [entityFilter, setEntityFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    if (isAuthorized) {
      fetchLogs()
    }
  }, [isAuthorized, page, actionFilter, entityFilter, startDate, endDate])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (isAuthorized) {
        fetchLogs()
      }
    }, 500)
    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const result = await activityLogService.getLogs({
        page,
        limit,
        action: actionFilter || undefined,
        entity: entityFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: searchTerm || undefined
      })

      if (result.success && result.data) {
        setLogs(result.data.logs)
        setStats(result.data.stats)
        setTotal(result.data.pagination.total)
        setTotalPages(result.data.pagination.pages)
      } else {
        toast.error(result.message || 'Failed to load activity logs')
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
      toast.error('Failed to load activity logs')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      toast.loading('Exporting activity logs...')
      await activityLogService.exportLogs({
        action: actionFilter || undefined,
        entity: entityFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      })
      toast.dismiss()
      toast.success('Export started! Download will begin shortly.')
    } catch (error) {
      console.error('Error exporting logs:', error)
      toast.error('Failed to export logs')
    }
  }

  const handleDeleteOldLogs = async (days: number) => {
    try {
      const result = await activityLogService.deleteOldLogs(days)
      if (result.success) {
        toast.success(result.message)
        fetchLogs()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Error deleting logs:', error)
      toast.error('Failed to delete logs')
    }
  }

  const handleViewDetails = (log: ActivityLog) => {
    setSelectedLog(log)
    setShowDetailsModal(true)
  }

  const resetFilters = () => {
    setSearchTerm('')
    setActionFilter('')
    setEntityFilter('')
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading activity logs...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
              <p className="text-muted-foreground mt-2">
                Monitor system activities and user actions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={fetchLogs} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleExport} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clean Up
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Old Logs</AlertDialogTitle>
                    <AlertDialogDescription>
                      Choose how many days of logs to keep. Older logs will be permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-2 py-4">
                    <Button onClick={() => handleDeleteOldLogs(30)} variant="outline" className="w-full">
                      Keep last 30 days
                    </Button>
                    <Button onClick={() => handleDeleteOldLogs(60)} variant="outline" className="w-full">
                      Keep last 60 days
                    </Button>
                    <Button onClick={() => handleDeleteOldLogs(90)} variant="outline" className="w-full">
                      Keep last 90 days
                    </Button>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Today</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">{stats.today.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{stats.thisWeek.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-purple-600">{stats.thisMonth.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by description or IP..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={actionFilter || 'all'} onValueChange={(value) => setActionFilter(value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="LOGOUT">Logout</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="VIEW">View</SelectItem>
                  <SelectItem value="APPROVE">Approve</SelectItem>
                  <SelectItem value="REJECT">Reject</SelectItem>
                </SelectContent>
              </Select>

              <Select value={entityFilter || 'all'} onValueChange={(value) => setEntityFilter(value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="Product">Product</SelectItem>
                  <SelectItem value="Category">Category</SelectItem>
                  <SelectItem value="Order">Order</SelectItem>
                  <SelectItem value="Review">Review</SelectItem>
                  <SelectItem value="Settings">Settings</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={resetFilters} variant="outline" className="w-full">
                Reset Filters
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Logs Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Activity Logs ({total.toLocaleString()} total)</CardTitle>
                <CardDescription>Showing {logs.length} of {total} logs</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No activity logs found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  {searchTerm || actionFilter || entityFilter
                    ? 'Try adjusting your filters'
                    : 'No activities have been logged yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log._id}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleViewDetails(log)}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {log.user?.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-gray-900">{log.user?.name || 'Unknown User'}</p>
                          <p className="text-sm text-gray-500">{log.user?.email || 'No email'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={activityLogService.getActionColor(log.action)}>
                            {activityLogService.getActionIcon(log.action)} {log.action}
                          </Badge>
                          <Badge variant="outline">
                            {activityLogService.getEntityIcon(log.entity)} {log.entity}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 mt-2">{log.description}</p>

                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                        </span>
                        {log.ipAddress && (
                          <span>IP: {log.ipAddress}</span>
                        )}
                        {log.entityId && (
                          <span>ID: {log.entityId.toString().substring(0, 8)}...</span>
                        )}
                      </div>
                    </div>

                    <Button size="sm" variant="ghost" onClick={(e) => {
                      e.stopPropagation()
                      handleViewDetails(log)
                    }}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        {stats && (stats.byAction.length > 0 || stats.byEntity.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* By Action */}
            {stats.byAction.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Actions</CardTitle>
                  <CardDescription>Most common activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.byAction.slice(0, 8).map((item) => (
                      <div key={item._id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={activityLogService.getActionColor(item._id)}>
                            {activityLogService.getActionIcon(item._id)} {item._id}
                          </Badge>
                        </div>
                        <span className="font-semibold text-gray-900">{item.count.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* By Entity */}
            {stats.byEntity.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Entities</CardTitle>
                  <CardDescription>Most affected resources</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.byEntity.map((item) => (
                      <div key={item._id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{activityLogService.getEntityIcon(item._id)}</span>
                          <span className="text-sm font-medium">{item._id}</span>
                        </div>
                        <span className="font-semibold text-gray-900">{item.count.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Details Modal */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Activity Log Details</DialogTitle>
              <DialogDescription>Complete information about this activity</DialogDescription>
            </DialogHeader>

            {selectedLog && (
              <div className="space-y-6">
                {/* User Info */}
                <div>
                  <h3 className="font-semibold text-sm text-gray-500 mb-2">User Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><strong>Name:</strong> {selectedLog.user?.name || 'Unknown'}</p>
                    <p><strong>Email:</strong> {selectedLog.user?.email || 'N/A'}</p>
                    <p><strong>Role:</strong> <Badge>{selectedLog.user?.role || 'N/A'}</Badge></p>
                  </div>
                </div>

                {/* Activity Info */}
                <div>
                  <h3 className="font-semibold text-sm text-gray-500 mb-2">Activity Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><strong>Action:</strong> <Badge className={activityLogService.getActionColor(selectedLog.action)}>{selectedLog.action}</Badge></p>
                    <p><strong>Entity:</strong> <Badge variant="outline">{selectedLog.entity}</Badge></p>
                    {selectedLog.entityId && <p><strong>Entity ID:</strong> {selectedLog.entityId}</p>}
                    <p><strong>Description:</strong> {selectedLog.description}</p>
                    <p><strong>Timestamp:</strong> {format(new Date(selectedLog.createdAt), 'PPpp')}</p>
                  </div>
                </div>

                {/* Technical Info */}
                <div>
                  <h3 className="font-semibold text-sm text-gray-500 mb-2">Technical Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    {selectedLog.ipAddress && <p><strong>IP Address:</strong> {selectedLog.ipAddress}</p>}
                    {selectedLog.userAgent && (
                      <div>
                        <strong>User Agent:</strong>
                        <p className="text-xs text-gray-600 mt-1 break-all">{selectedLog.userAgent}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Changes */}
                {selectedLog.changes && (selectedLog.changes.before || selectedLog.changes.after) && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-500 mb-2">Changes</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                      {selectedLog.changes.before && (
                        <div>
                          <p className="font-medium text-sm mb-2">Before:</p>
                          <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                            {JSON.stringify(selectedLog.changes.before, null, 2)}
                          </pre>
                        </div>
                      )}
                      {selectedLog.changes.after && (
                        <div>
                          <p className="font-medium text-sm mb-2">After:</p>
                          <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                            {JSON.stringify(selectedLog.changes.after, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-500 mb-2">Additional Metadata</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={() => setShowDetailsModal(false)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
