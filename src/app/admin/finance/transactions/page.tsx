'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { financeService, type Transaction, type TransactionStats } from '@/services/finance.service'
import {
  DollarSign,
  CreditCard,
  Calendar,
  Loader2,
  RefreshCw,
  Download,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
  TrendingUp,
  TrendingDown,
  ArrowUpDown
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
import { Badge } from '@/components/ui/badge'
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

export default function TransactionsPage() {
  const { isAuthorized, loading: authLoading } = useAdminAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<TransactionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // Filters
  const [page, setPage] = useState(1)
  const [limit] = useState(50)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    if (isAuthorized) {
      fetchTransactions()
    }
  }, [isAuthorized, page, typeFilter, categoryFilter, statusFilter, paymentMethodFilter, startDate, endDate])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (isAuthorized) {
        fetchTransactions()
      }
    }, 500)
    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const result = await financeService.getTransactions({
        page,
        limit,
        type: typeFilter || undefined,
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
        paymentMethod: paymentMethodFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: searchTerm || undefined
      })

      if (result.success && result.data) {
        setTransactions(result.data.transactions)
        setStats(result.data.stats)
        setTotal(result.data.pagination.total)
        setTotalPages(result.data.pagination.pages)
      } else {
        toast.error(result.message || 'Failed to load transactions')
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast.error('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setShowDetailsModal(true)
  }

  const resetFilters = () => {
    setSearchTerm('')
    setTypeFilter('')
    setCategoryFilter('')
    setStatusFilter('')
    setPaymentMethodFilter('')
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
            <p className="text-muted-foreground">Loading transactions...</p>
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
              <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
              <p className="text-muted-foreground mt-2">
                View and manage all financial transactions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={fetchTransactions} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">{financeService.formatCurrency(stats.totalAmount)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Income</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-green-600">
                  +{financeService.formatCurrency(stats.income)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Expense</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-red-600">
                  -{financeService.formatCurrency(stats.expense)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Refunds</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-orange-600">
                  -{financeService.formatCurrency(stats.refund)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Net Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-blue-600">
                  {financeService.formatCurrency(stats.netRevenue)}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by transaction #, description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={typeFilter || 'all'} onValueChange={(value) => setTypeFilter(value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter || 'all'} onValueChange={(value) => setCategoryFilter(value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="order">Order</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                  <SelectItem value="shipping">Shipping</SelectItem>
                  <SelectItem value="tax">Tax</SelectItem>
                  <SelectItem value="commission">Commission</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter || 'all'} onValueChange={(value) => setStatusFilter(value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={resetFilters} variant="outline">
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

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Transactions ({total.toLocaleString()} total)</CardTitle>
                <CardDescription>Showing {transactions.length} of {total} transactions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No transactions found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  {searchTerm || typeFilter || statusFilter
                    ? 'Try adjusting your filters'
                    : 'No transactions have been recorded yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Transaction
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Category
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {transactions.map((transaction) => (
                      <tr key={transaction._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-sm">{transaction.transactionNumber}</p>
                            <p className="text-xs text-gray-500 truncate max-w-xs">
                              {transaction.description}
                            </p>
                            {transaction.order && (
                              <p className="text-xs text-blue-600 mt-1">
                                Order: {transaction.order.orderNumber}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={financeService.getTypeColor(transaction.type)}>
                            {transaction.type === 'income' && <TrendingUp className="w-3 h-3 mr-1" />}
                            {transaction.type === 'expense' && <TrendingDown className="w-3 h-3 mr-1" />}
                            {transaction.type === 'refund' && <ArrowUpDown className="w-3 h-3 mr-1" />}
                            {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">
                            {transaction.category}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className={`font-semibold ${
                            transaction.type === 'income' ? 'text-green-600' :
                            transaction.type === 'expense' ? 'text-red-600' :
                            'text-orange-600'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}
                            {financeService.formatCurrency(transaction.amount)}
                          </p>
                          {transaction.gatewayFee && transaction.gatewayFee > 0 && (
                            <p className="text-xs text-gray-500">
                              Fee: ৳{transaction.gatewayFee.toFixed(2)}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={financeService.getStatusColor(transaction.status)}>
                            {transaction.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm">
                            {format(new Date(transaction.transactionDate), 'MMM dd, yyyy')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(transaction.transactionDate), 'HH:mm')}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(transaction)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

        {/* Transaction Details Modal */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Transaction Details</DialogTitle>
              <DialogDescription>Complete transaction information</DialogDescription>
            </DialogHeader>

            {selectedTransaction && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-sm text-gray-500 mb-2">Transaction Info</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><strong>Number:</strong> {selectedTransaction.transactionNumber}</p>
                    <p><strong>Type:</strong> <Badge className={financeService.getTypeColor(selectedTransaction.type)}>{selectedTransaction.type}</Badge></p>
                    <p><strong>Category:</strong> {selectedTransaction.category}</p>
                    <p><strong>Status:</strong> <Badge className={financeService.getStatusColor(selectedTransaction.status)}>{selectedTransaction.status}</Badge></p>
                    <p><strong>Date:</strong> {format(new Date(selectedTransaction.transactionDate), 'PPpp')}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-gray-500 mb-2">Amount Details</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><strong>Amount:</strong> {financeService.formatCurrency(selectedTransaction.amount)}</p>
                    <p><strong>Currency:</strong> {selectedTransaction.currency}</p>
                    {selectedTransaction.gatewayFee && selectedTransaction.gatewayFee > 0 && (
                      <p><strong>Gateway Fee:</strong> ৳{selectedTransaction.gatewayFee.toFixed(2)}</p>
                    )}
                    {selectedTransaction.netAmount && (
                      <p><strong>Net Amount:</strong> {financeService.formatCurrency(selectedTransaction.netAmount)}</p>
                    )}
                  </div>
                </div>

                {(selectedTransaction.paymentMethod || selectedTransaction.paymentGateway) && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-500 mb-2">Payment Info</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      {selectedTransaction.paymentMethod && (
                        <p><strong>Payment Method:</strong> {selectedTransaction.paymentMethod}</p>
                      )}
                      {selectedTransaction.paymentGateway && (
                        <p><strong>Gateway:</strong> {selectedTransaction.paymentGateway}</p>
                      )}
                      {selectedTransaction.gatewayTransactionId && (
                        <p><strong>Gateway TXN ID:</strong> {selectedTransaction.gatewayTransactionId}</p>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-sm text-gray-500 mb-2">Description</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p>{selectedTransaction.description}</p>
                    {selectedTransaction.notes && (
                      <p className="mt-2 text-sm text-gray-600 italic">Note: {selectedTransaction.notes}</p>
                    )}
                  </div>
                </div>
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
