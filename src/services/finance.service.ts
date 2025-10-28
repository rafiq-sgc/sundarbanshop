// Revenue Types
export interface RevenueOverview {
  totalRevenue: number
  paidRevenue: number
  pendingRevenue: number
  avgOrderValue: number
  totalOrders: number
  paidOrders: number
  pendingOrders: number
  revenueChange: number
  totalRefunded: number
  refundCount: number
}

export interface RevenueByDate {
  _id: string
  revenue: number
  orders: number
}

export interface RevenueByCategory {
  name: string
  revenue: number
  orderCount: number
}

export interface RevenueByPayment {
  _id: string
  revenue: number
  count: number
}

export interface RevenueData {
  overview: RevenueOverview
  revenueByDate: RevenueByDate[]
  revenueByCategory: RevenueByCategory[]
  revenueByPayment: RevenueByPayment[]
  period: {
    start: string
    end: string
  }
}

// Transaction Types
export interface Transaction {
  _id: string
  transactionNumber: string
  type: 'income' | 'expense' | 'refund'
  category: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  paymentMethod?: string
  paymentGateway?: string
  gatewayTransactionId?: string
  gatewayFee?: number
  netAmount?: number
  description: string
  notes?: string
  transactionDate: string
  user?: {
    name: string
    email: string
  }
  order?: {
    orderNumber: string
  }
  createdAt: string
}

export interface TransactionStats {
  totalAmount: number
  income: number
  expense: number
  refund: number
  netRevenue: number
  byType: Array<{ _id: string; amount: number; count: number }>
  byStatus: Array<{ _id: string; amount: number; count: number }>
}

export interface TransactionsResponse {
  transactions: Transaction[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  stats: TransactionStats
}

// Profit & Loss Types
export interface ProfitLossSummary {
  revenue: number
  cogs: number
  grossProfit: number
  grossProfitMargin: number
  expenses: {
    discounts: number
    refunds: number
    gatewayFees: number
    shipping: number
    total: number
  }
  netProfit: number
  netProfitMargin: number
  taxCollected: number
  shippingRevenue: number
}

export interface MonthlyData {
  _id: string
  revenue: number
  orders: number
}

export interface ProfitLossData {
  summary: ProfitLossSummary
  monthlyData: MonthlyData[]
  period: {
    start: string
    end: string
  }
}

class FinanceService {
  /**
   * Get revenue analytics
   */
  async getRevenue(period: string = '30days'): Promise<{ success: boolean; data?: RevenueData; message?: string }> {
    try {
      const response = await fetch(`/api/admin/finance/revenue?period=${period}`, {
        cache: 'no-store'
      })

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        return { success: false, message: 'Unauthorized' }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error fetching revenue data:', error)
      return { success: false, message: 'Failed to fetch revenue data' }
    }
  }

  /**
   * Get transactions
   */
  async getTransactions(filters?: {
    page?: number
    limit?: number
    type?: string
    category?: string
    status?: string
    paymentMethod?: string
    startDate?: string
    endDate?: string
    search?: string
  }): Promise<{ success: boolean; data?: TransactionsResponse; message?: string }> {
    try {
      const queryParams = new URLSearchParams()
      
      if (filters) {
        if (filters.page) queryParams.append('page', filters.page.toString())
        if (filters.limit) queryParams.append('limit', filters.limit.toString())
        if (filters.type) queryParams.append('type', filters.type)
        if (filters.category) queryParams.append('category', filters.category)
        if (filters.status) queryParams.append('status', filters.status)
        if (filters.paymentMethod) queryParams.append('paymentMethod', filters.paymentMethod)
        if (filters.startDate) queryParams.append('startDate', filters.startDate)
        if (filters.endDate) queryParams.append('endDate', filters.endDate)
        if (filters.search) queryParams.append('search', filters.search)
      }

      const url = queryParams.toString() 
        ? `/api/admin/finance/transactions?${queryParams.toString()}`
        : '/api/admin/finance/transactions'

      const response = await fetch(url, { cache: 'no-store' })

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        return { success: false, message: 'Unauthorized' }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error fetching transactions:', error)
      return { success: false, message: 'Failed to fetch transactions' }
    }
  }

  /**
   * Get profit & loss report
   */
  async getProfitLoss(period: string = '30days'): Promise<{ success: boolean; data?: ProfitLossData; message?: string }> {
    try {
      const response = await fetch(`/api/admin/finance/profit-loss?period=${period}`, {
        cache: 'no-store'
      })

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        return { success: false, message: 'Unauthorized' }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error fetching profit/loss data:', error)
      return { success: false, message: 'Failed to fetch profit/loss data' }
    }
  }

  /**
   * Create manual transaction
   */
  async createTransaction(data: {
    type: 'income' | 'expense' | 'refund'
    category: string
    amount: number
    description: string
    paymentMethod?: string
    notes?: string
    transactionDate?: Date
  }): Promise<{ success: boolean; data?: Transaction; message?: string }> {
    try {
      const response = await fetch('/api/admin/finance/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        return { success: false, message: 'Unauthorized' }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error creating transaction:', error)
      return { success: false, message: 'Failed to create transaction' }
    }
  }

  /**
   * Format currency (BDT)
   */
  formatCurrency(amount: number): string {
    return `৳${amount.toLocaleString('en-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }

  /**
   * Get transaction type badge color
   */
  getTypeColor(type: string): string {
    const colors: Record<string, string> = {
      'income': 'bg-green-100 text-green-700',
      'expense': 'bg-red-100 text-red-700',
      'refund': 'bg-orange-100 text-orange-700'
    }
    return colors[type] || 'bg-gray-100 text-gray-700'
  }

  /**
   * Get status badge color
   */
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'completed': 'bg-green-100 text-green-700',
      'pending': 'bg-yellow-100 text-yellow-700',
      'failed': 'bg-red-100 text-red-700',
      'cancelled': 'bg-gray-100 text-gray-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }
}

export const financeService = new FinanceService()

