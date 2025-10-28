'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { financeService, type RevenueData } from '@/services/finance.service'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  CreditCard,
  ArrowUp,
  ArrowDown,
  Calendar,
  Loader2,
  RefreshCw,
  Download
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
  ResponsiveContainer 
} from 'recharts'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function RevenuePage() {
  const { isAuthorized, loading: authLoading } = useAdminAuth()
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30days')
  const [data, setData] = useState<RevenueData | null>(null)

  useEffect(() => {
    if (isAuthorized) {
      fetchRevenue()
    }
  }, [isAuthorized, period])

  const fetchRevenue = async () => {
    try {
      setLoading(true)
      const result = await financeService.getRevenue(period)

      if (result.success && result.data) {
        setData(result.data)
      } else {
        toast.error(result.message || 'Failed to load revenue data')
      }
    } catch (error) {
      console.error('Error fetching revenue:', error)
      toast.error('Failed to load revenue data')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading revenue data...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!isAuthorized || !data) {
    return null
  }

  const COLORS = ['#16a34a', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16']

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Revenue Analytics</h1>
              <p className="text-muted-foreground mt-2">
                Track your sales and revenue performance
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                  <SelectItem value="1year">Last Year</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={fetchRevenue} variant="outline" size="icon">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </CardTitle>
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {financeService.formatCurrency(data.overview.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                {data.overview.revenueChange >= 0 ? (
                  <>
                    <ArrowUp className="w-3 h-3 text-green-600" />
                    <span className="text-green-600">
                      +{data.overview.revenueChange.toFixed(1)}%
                    </span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="w-3 h-3 text-red-600" />
                    <span className="text-red-600">
                      {data.overview.revenueChange.toFixed(1)}%
                    </span>
                  </>
                )}
                <span className="ml-1">vs previous period</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Paid Revenue
                </CardTitle>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {financeService.formatCurrency(data.overview.paidRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {data.overview.paidOrders} paid orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Order Value
                </CardTitle>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <ShoppingCart className="w-4 h-4 text-purple-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {financeService.formatCurrency(data.overview.avgOrderValue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {data.overview.totalOrders} total orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Revenue
                </CardTitle>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="w-4 h-4 text-orange-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {financeService.formatCurrency(data.overview.pendingRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {data.overview.pendingOrders} pending orders
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Trend Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Daily revenue and order count</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={data.revenueByDate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === 'revenue') {
                      return [financeService.formatCurrency(value), 'Revenue']
                    }
                    return [value, 'Orders']
                  }}
                />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#16a34a" 
                  strokeWidth={2}
                  name="Revenue"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Orders"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Category</CardTitle>
              <CardDescription>Top performing categories</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.revenueByCategory as any}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => `${entry.name}: ৳${(entry.revenue as number).toLocaleString()}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {data.revenueByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => financeService.formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue by Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Payment Method</CardTitle>
              <CardDescription>Payment method breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.revenueByPayment}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => financeService.formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#16a34a" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Refunds Summary */}
        {data.overview.totalRefunded > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Refunds Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Refunded</p>
                  <p className="text-2xl font-bold text-red-600">
                    {financeService.formatCurrency(data.overview.totalRefunded)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Refund Count</p>
                  <p className="text-2xl font-bold">{data.overview.refundCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Refund Rate</p>
                  <p className="text-2xl font-bold">
                    {data.overview.totalOrders > 0 
                      ? ((data.overview.refundCount / data.overview.totalOrders) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
