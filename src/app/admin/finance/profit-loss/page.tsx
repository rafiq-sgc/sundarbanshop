'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { financeService, type ProfitLossData } from '@/services/finance.service'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
  Loader2,
  RefreshCw,
  Download,
  ArrowUp,
  ArrowDown,
  MinusCircle,
  PlusCircle,
  CreditCard
} from 'lucide-react'
import { 
  BarChart, 
  Bar,
  LineChart,
  Line,
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
import { Progress } from '@/components/ui/progress'

export default function ProfitLossPage() {
  const { isAuthorized, loading: authLoading } = useAdminAuth()
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30days')
  const [data, setData] = useState<ProfitLossData | null>(null)

  useEffect(() => {
    if (isAuthorized) {
      fetchProfitLoss()
    }
  }, [isAuthorized, period])

  const fetchProfitLoss = async () => {
    try {
      setLoading(true)
      const result = await financeService.getProfitLoss(period)

      if (result.success && result.data) {
        setData(result.data)
      } else {
        toast.error(result.message || 'Failed to load profit/loss data')
      }
    } catch (error) {
      console.error('Error fetching profit/loss:', error)
      toast.error('Failed to load profit/loss data')
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
            <p className="text-muted-foreground">Loading profit & loss data...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!isAuthorized || !data) {
    return null
  }

  const { summary } = data

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Profit & Loss</h1>
              <p className="text-muted-foreground mt-2">
                Comprehensive profit and loss statement
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
              <Button onClick={fetchProfitLoss} variant="outline" size="icon">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
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
                {financeService.formatCurrency(summary.revenue)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Cost of Goods Sold
                </CardTitle>
                <div className="p-2 bg-red-100 rounded-lg">
                  <MinusCircle className="w-4 h-4 text-red-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {financeService.formatCurrency(summary.cogs)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Gross Profit
                </CardTitle>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <PlusCircle className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {financeService.formatCurrency(summary.grossProfit)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Margin: {summary.grossProfitMargin.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Net Profit
                </CardTitle>
                <div className={`p-2 rounded-lg ${summary.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  {summary.netProfit >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {financeService.formatCurrency(summary.netProfit)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Margin: {summary.netProfitMargin.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Profit & Loss Statement */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Profit & Loss Statement</CardTitle>
            <CardDescription>Detailed breakdown of income and expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Revenue */}
              <div className="border-b pb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">Revenue</h3>
                  <p className="text-xl font-bold text-green-600">
                    {financeService.formatCurrency(summary.revenue)}
                  </p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between pl-4">
                    <span className="text-gray-600">Shipping Revenue</span>
                    <span className="font-medium">
                      {financeService.formatCurrency(summary.shippingRevenue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pl-4">
                    <span className="text-gray-600">Tax Collected</span>
                    <span className="font-medium">
                      {financeService.formatCurrency(summary.taxCollected)}
                    </span>
                  </div>
                </div>
              </div>

              {/* COGS */}
              <div className="border-b pb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">Cost of Goods Sold (COGS)</h3>
                  <p className="text-xl font-bold text-red-600">
                    -{financeService.formatCurrency(summary.cogs)}
                  </p>
                </div>
              </div>

              {/* Gross Profit */}
              <div className="border-b pb-4 bg-blue-50 -mx-4 px-4 py-4 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">Gross Profit</h3>
                    <p className="text-sm text-gray-600">
                      Gross Profit Margin: {summary.grossProfitMargin.toFixed(1)}%
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {financeService.formatCurrency(summary.grossProfit)}
                  </p>
                </div>
                <Progress 
                  value={summary.grossProfitMargin} 
                  className="mt-2 h-2"
                />
              </div>

              {/* Expenses */}
              <div className="border-b pb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">Expenses</h3>
                  <p className="text-xl font-bold text-red-600">
                    -{financeService.formatCurrency(summary.expenses.total)}
                  </p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between pl-4">
                    <span className="text-gray-600">Discounts Given</span>
                    <span className="font-medium text-red-600">
                      -{financeService.formatCurrency(summary.expenses.discounts)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pl-4">
                    <span className="text-gray-600">Refunds Issued</span>
                    <span className="font-medium text-red-600">
                      -{financeService.formatCurrency(summary.expenses.refunds)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pl-4">
                    <span className="text-gray-600">Payment Gateway Fees</span>
                    <span className="font-medium text-red-600">
                      -{financeService.formatCurrency(summary.expenses.gatewayFees)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Profit */}
              <div className={`-mx-4 px-4 py-4 rounded ${summary.netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-xl">Net Profit</h3>
                    <p className="text-sm text-gray-600">
                      Net Profit Margin: {summary.netProfitMargin.toFixed(1)}%
                    </p>
                  </div>
                  <p className={`text-3xl font-bold ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {financeService.formatCurrency(summary.netProfit)}
                  </p>
                </div>
                <Progress 
                  value={Math.abs(summary.netProfitMargin)} 
                  className="mt-3 h-3"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue Trend</CardTitle>
            <CardDescription>Revenue and order count over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={data.monthlyData}>
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
                  strokeWidth={3}
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

        {/* Expense Breakdown */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
            <CardDescription>Detailed view of all expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded">
                    <MinusCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium">Discounts Given</p>
                    <p className="text-sm text-gray-500">Customer promotions and coupons</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">
                    -{financeService.formatCurrency(summary.expenses.discounts)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {summary.revenue > 0 ? ((summary.expenses.discounts / summary.revenue) * 100).toFixed(1) : 0}% of revenue
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded">
                    <ArrowDown className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium">Refunds Issued</p>
                    <p className="text-sm text-gray-500">Customer refunds and returns</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-orange-600">
                    -{financeService.formatCurrency(summary.expenses.refunds)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {summary.revenue > 0 ? ((summary.expenses.refunds / summary.revenue) * 100).toFixed(1) : 0}% of revenue
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Payment Gateway Fees</p>
                    <p className="text-sm text-gray-500">bKash, Nagad, SSLCommerz fees</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-purple-600">
                    -{financeService.formatCurrency(summary.expenses.gatewayFees)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {summary.revenue > 0 ? ((summary.expenses.gatewayFees / summary.revenue) * 100).toFixed(1) : 0}% of revenue
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gross Profit Margin</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-4xl font-bold text-blue-600 mb-2">
                  {summary.grossProfitMargin.toFixed(1)}%
                </p>
                <Progress value={summary.grossProfitMargin} className="h-3" />
                <p className="text-sm text-gray-500 mt-2">
                  Revenue minus COGS
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Net Profit Margin</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className={`text-4xl font-bold mb-2 ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {summary.netProfitMargin.toFixed(1)}%
                </p>
                <Progress value={Math.abs(summary.netProfitMargin)} className="h-3" />
                <p className="text-sm text-gray-500 mt-2">
                  Final profit after all expenses
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Expense Ratio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-4xl font-bold text-red-600 mb-2">
                  {summary.revenue > 0 ? ((summary.expenses.total / summary.revenue) * 100).toFixed(1) : 0}%
                </p>
                <Progress 
                  value={summary.revenue > 0 ? (summary.expenses.total / summary.revenue) * 100 : 0} 
                  className="h-3"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Total expenses vs revenue
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
