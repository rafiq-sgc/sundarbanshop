/**
 * Dashboard Order Service
 * Handles all order-related operations for user dashboard
 */

export interface DashboardOrderFilters {
  page?: number
  limit?: number
  search?: string
  status?: 'all' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
}

export interface DashboardOrderStats {
  totalOrders: number
  totalSpent: number
  ordersByStatus: {
    pending: number
    confirmed: number
    processing: number
    shipped: number
    delivered: number
    cancelled: number
  }
}

class DashboardOrderService {
  private baseUrl = '/api/dashboard/orders'

  /**
   * Get all orders for the current user
   */
  async getAll(filters: DashboardOrderFilters = {}) {
    const params = new URLSearchParams()
    
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.search) params.append('search', filters.search)
    if (filters.status) params.append('status', filters.status)

    const response = await fetch(`${this.baseUrl}?${params.toString()}`)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch orders')
    }

    return data
  }

  /**
   * Get single order by ID
   */
  async getById(id: string) {
    const response = await fetch(`${this.baseUrl}/${id}`)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch order details')
    }

    return data
  }

  /**
   * Get order statistics for current user
   */
  async getStats(): Promise<{ success: boolean; data: DashboardOrderStats }> {
    const response = await fetch(`${this.baseUrl}/stats`)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch order statistics')
    }

    return data
  }

  /**
   * Download invoice for an order
   */
  async downloadInvoice(orderId: string) {
    const response = await fetch(`${this.baseUrl}/${orderId}/invoice`)
    
    if (!response.ok) {
      throw new Error('Failed to download invoice')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoice-${orderId}.pdf`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  /**
   * Check if user can cancel order
   */
  canCancelOrder(orderStatus: string): boolean {
    return ['pending', 'confirmed'].includes(orderStatus)
  }

  /**
   * Check if order can be reordered
   */
  canReorder(orderStatus: string): boolean {
    return orderStatus === 'delivered'
  }
}

export const dashboardOrderService = new DashboardOrderService()

