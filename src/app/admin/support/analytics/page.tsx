'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { analyticsService, type ChatAnalytics } from '@/services/admin'
import { generatePDFReport } from '@/lib/pdf-utils'
import { useAdminAuth, useAuthFetch } from '@/hooks/useAdminAuth'
import {
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Clock,
  CheckCircle,
  Users,
  Star,
  Activity,
  Calendar,
  Download,
  Filter,
  Loader2
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import toast from 'react-hot-toast'

export default function ChatAnalyticsPage() {
  const { isAuthorized, loading: authLoading } = useAdminAuth()
  const { fetchWithAuth } = useAuthFetch()
  const [dateRange, setDateRange] = useState('7days')
  const [analytics, setAnalytics] = useState<ChatAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  // Fetch analytics data
  const fetchAnalytics = async (range: string) => {
    try {
      setLoading(true)
      const result = await analyticsService.getChatAnalytics(range)
      
      if (result.success && result.data) {
        setAnalytics(result.data)
      } else {
        toast.error(result.message || 'Failed to fetch analytics')
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error('Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }

  // Handle date range change
  const handleDateRangeChange = (range: string) => {
    setDateRange(range)
    fetchAnalytics(range)
  }

  // Handle export
  const handleExport = async (format: 'csv' | 'pdf' = 'csv') => {
    try {
      setExporting(true)
      const result = await analyticsService.exportReport(dateRange, format)
      
      if (result.success) {
        if (format === 'csv') {
          // For CSV, create download link
          const blob = new Blob([result.data], { type: 'text/csv' })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `chat-analytics-${dateRange}.csv`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          window.URL.revokeObjectURL(url)
        } else {
          // For PDF, generate PDF using the data
          await generatePDFReport(result.data, dateRange)
        }
        toast.success('Report exported successfully')
      } else {
        toast.error(result.message || 'Failed to export report')
      }
    } catch (error) {
      console.error('Error exporting report:', error)
      toast.error('Failed to export report')
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    if (isAuthorized) {
      fetchAnalytics(dateRange)
    }
  }, [isAuthorized])

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">Loading analytics...</span>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!analytics) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Data Available</h2>
            <p className="text-gray-600">Unable to load analytics data</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const { stats, trends, distribution, performance } = analytics

  // Transform data for charts
  const conversationsData = trends.conversations
  const responseTimeData = trends.responseTime
  const hourlyVolume = trends.hourlyVolume
  
  const statusDistribution = [
    { name: 'Resolved', value: distribution.status.resolved, color: '#10b981' },
    { name: 'Active', value: distribution.status.active, color: '#3b82f6' },
    { name: 'Pending', value: distribution.status.pending, color: '#f59e0b' }
  ]

  const agentPerformance = performance.agents
  const topIssues = performance.topIssues

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Chat Analytics</h1>
              <p className="text-gray-600 mt-2">Monitor chat performance and customer satisfaction metrics</p>
            </div>
            <div className="flex items-center space-x-3">
              <Select value={dateRange} onValueChange={handleDateRangeChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={() => handleExport('csv')}
                disabled={exporting}
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Export CSV
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleExport('pdf')}
                disabled={exporting}
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Export PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
              <div className="flex items-center space-x-1 text-green-600 text-sm font-medium">
                <TrendingUp className="w-4 h-4" />
                <span>+12%</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalConversations}</div>
              <MessageSquare className="w-4 h-4 text-muted-foreground mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
              <div className="flex items-center space-x-1 text-blue-600 text-sm font-medium">
                <Activity className="w-4 h-4" />
                <span>Live</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeChats}</div>
              <Activity className="w-4 h-4 text-muted-foreground mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <div className="flex items-center space-x-1 text-blue-600 text-sm font-medium">
                <Clock className="w-4 h-4" />
                <span>Avg</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgResponseTime}</div>
              <Clock className="w-4 h-4 text-muted-foreground mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customer Satisfaction</CardTitle>
              <div className="flex items-center space-x-1 text-green-600 text-sm font-medium">
                <Star className="w-4 h-4" />
                <span>/5</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.customerSatisfaction}</div>
              <Star className="w-4 h-4 text-muted-foreground mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-sm p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 opacity-80" />
            </div>
            <h3 className="text-3xl font-bold mb-1">{stats.resolvedToday}</h3>
            <p className="text-green-100 text-sm">Resolved Today</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 opacity-80" />
            </div>
            <h3 className="text-3xl font-bold mb-1">{stats.firstResponseTime}</h3>
            <p className="text-blue-100 text-sm">First Response Time</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 opacity-80" />
            </div>
            <h3 className="text-3xl font-bold mb-1">{stats.avgResolutionTime}</h3>
            <p className="text-purple-100 text-sm">Avg Resolution Time</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-sm p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 opacity-80" />
            </div>
            <h3 className="text-3xl font-bold mb-1">{stats.chatAbandonment}</h3>
            <p className="text-orange-100 text-sm">Abandonment Rate</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Conversations Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Conversation Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={conversationsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="conversations" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="resolved" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Response Time Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Response Time by Hour</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={responseTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="avgTime" stroke="#8b5cf6" strokeWidth={2} name="Avg Time (min)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Hourly Volume */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Chat Volume by Hour</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={hourlyVolume}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="volume" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Agent Performance */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Agent Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Agent</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Conversations</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Avg Rating</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Avg Response (min)</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {agentPerformance.map((agent, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">{agent.agent}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{agent.conversations}</td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="font-medium text-gray-900">{agent.avgRating}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">{agent.avgResponse}</td>
                      <td className="py-3 px-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${(agent.avgRating / 5) * 100}%` }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Top Issues */}
        <Card>
          <CardHeader>
            <CardTitle>Top Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topIssues.map((issue, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{issue.issue}</span>
                    <span className="text-sm text-gray-600">{issue.count} ({issue.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${issue.percentage * 3}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}

