'use client'

import { useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  Receipt,
  Plus,
  Edit,
  Trash2,
  Globe,
  Percent,
  Download,
  FileText,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'

interface TaxRate {
  _id: string
  name: string
  country: string
  state?: string
  rate: number
  type: 'VAT' | 'GST' | 'Sales Tax'
  isActive: boolean
  appliesTo: 'all' | 'physical' | 'digital'
}

export default function TaxSettingsPage() {
  const [taxRates, setTaxRates] = useState<TaxRate[]>([
    {
      _id: '1',
      name: 'US Sales Tax - California',
      country: 'United States',
      state: 'California',
      rate: 7.25,
      type: 'Sales Tax',
      isActive: true,
      appliesTo: 'all'
    },
    {
      _id: '2',
      name: 'US Sales Tax - New York',
      country: 'United States',
      state: 'New York',
      rate: 8.88,
      type: 'Sales Tax',
      isActive: true,
      appliesTo: 'all'
    },
    {
      _id: '3',
      name: 'UK VAT',
      country: 'United Kingdom',
      rate: 20.0,
      type: 'VAT',
      isActive: true,
      appliesTo: 'all'
    },
    {
      _id: '4',
      name: 'EU VAT - Germany',
      country: 'Germany',
      rate: 19.0,
      type: 'VAT',
      isActive: true,
      appliesTo: 'all'
    },
    {
      _id: '5',
      name: 'India GST',
      country: 'India',
      rate: 18.0,
      type: 'GST',
      isActive: true,
      appliesTo: 'all'
    }
  ])
  const [showAddModal, setShowAddModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'rates' | 'reports'>('rates')

  // Mock tax report data
  const taxReport = {
    period: 'January 2024',
    totalSales: 45678.90,
    taxableAmount: 42350.75,
    taxCollected: 3328.15,
    taxRemitted: 3100.00,
    taxBalance: 228.15
  }

  const taxBreakdown = [
    { region: 'California', sales: 15234.50, tax: 1104.50, rate: 7.25 },
    { region: 'New York', sales: 12890.25, tax: 1144.65, rate: 8.88 },
    { region: 'Texas', sales: 8765.00, tax: 569.73, rate: 6.5 },
    { region: 'Florida', sales: 5461.00, tax: 327.66, rate: 6.0 }
  ]

  const handleDeleteTaxRate = (id: string) => {
    if (confirm('Are you sure you want to delete this tax rate?')) {
      setTaxRates(taxRates.filter(r => r._id !== id))
      toast.success('Tax rate deleted successfully')
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tax Configuration & Reports</h1>
            <p className="text-gray-600 mt-1">
              Manage tax rates and generate compliance reports
            </p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Tax Rate
          </Button>
        </div>

        {/* Tabs */}
        <Card>
          <CardContent className="p-0">
            <nav className="flex border-b">
              <Button
                variant="ghost"
                onClick={() => setActiveTab('rates')}
                className={`rounded-none border-b-2 ${
                  activeTab === 'rates'
                    ? 'border-primary text-primary'
                    : 'border-transparent'
                }`}
              >
                <Percent className="w-4 h-4 mr-2" />
                Tax Rates
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveTab('reports')}
                className={`rounded-none border-b-2 ${
                  activeTab === 'reports'
                    ? 'border-primary text-primary'
                    : 'border-transparent'
                }`}
              >
                <FileText className="w-4 h-4 mr-2" />
                Tax Reports
              </Button>
            </nav>
          </CardContent>
        </Card>

        {/* Tax Rates Tab */}
        {activeTab === 'rates' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tax Rates</CardTitle>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{taxRates.length}</div>
                  <p className="text-xs text-green-600 mt-2">
                    {taxRates.filter(r => r.isActive).length} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Countries Covered</CardTitle>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Array.from(new Set(taxRates.map(r => r.country))).length}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Multiple jurisdictions</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Tax Rate</CardTitle>
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(taxRates.reduce((sum, r) => sum + r.rate, 0) / taxRates.length).toFixed(2)}%
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Across all regions</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tax Collected (MTD)</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">$3,328</div>
                  <p className="text-xs text-gray-500 mt-2">This month</p>
                </CardContent>
              </Card>
            </div>

            {/* Tax Rates Table */}
            <Card>
              <CardHeader>
                <CardTitle>Tax Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Tax Name
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Country/State
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Rate
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Applies To
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {taxRates.map((taxRate) => (
                        <tr key={taxRate._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-medium text-gray-900">{taxRate.name}</span>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="secondary">{taxRate.type}</Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm text-gray-900">{taxRate.country}</p>
                              {taxRate.state && (
                                <p className="text-xs text-gray-500">{taxRate.state}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-gray-900">{taxRate.rate}%</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-700 capitalize">
                              {taxRate.appliesTo}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={taxRate.isActive ? 'default' : 'secondary'}>
                              {taxRate.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteTaxRate(taxRate._id)}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tax Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Report Summary */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Tax Report Summary</CardTitle>
                    <p className="text-gray-600 mt-1">{taxReport.period}</p>
                  </div>
                  <Button>
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-gray-600 mb-1">Total Sales</p>
                      <p className="text-xl font-bold text-gray-900">
                        ${taxReport.totalSales.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-gray-600 mb-1">Taxable Amount</p>
                      <p className="text-xl font-bold text-gray-900">
                        ${taxReport.taxableAmount.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-gray-600 mb-1">Tax Collected</p>
                      <p className="text-xl font-bold text-green-600">
                        ${taxReport.taxCollected.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-gray-600 mb-1">Tax Remitted</p>
                      <p className="text-xl font-bold text-blue-600">
                        ${taxReport.taxRemitted.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-gray-600 mb-1">Balance Due</p>
                      <p className="text-xl font-bold text-orange-600">
                        ${taxReport.taxBalance.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Tax Breakdown by Region */}
            <Card>
              <CardHeader>
                <CardTitle>Tax Collection by Region</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Region
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                          Sales
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                          Tax Rate
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                          Tax Collected
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {taxBreakdown.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {item.region}
                          </td>
                          <td className="px-6 py-4 text-sm text-right text-gray-900">
                            ${item.sales.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-right text-gray-900">
                            {item.rate}%
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-green-600">
                            ${item.tax.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-semibold">
                      <tr>
                        <td className="px-6 py-4 text-sm text-gray-900">Total</td>
                        <td className="px-6 py-4 text-sm text-right text-gray-900">
                          ${taxBreakdown.reduce((sum, item) => sum + item.sales, 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4"></td>
                        <td className="px-6 py-4 text-sm text-right text-green-600">
                          ${taxBreakdown.reduce((sum, item) => sum + item.tax, 0).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
