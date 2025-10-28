// Inventory Service Types
export interface InventoryItem {
  _id: string
  productName: string
  sku: string
  image: string
  currentStock: number
  minStock: number
  maxStock: number
  reorderLevel: number
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
  lastRestocked: string
  category?: string
  price?: number
  stockValue?: number
}

export interface InventoryStats {
  totalItems: number
  inStock: number
  lowStock: number
  outOfStock: number
  totalValue?: number
}

export interface InventoryResponse {
  inventory: InventoryItem[]
  stats: InventoryStats
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface InventoryFilter {
  search?: string
  status?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
  warehouse?: string
  page?: number
  limit?: number
}

export interface StockAdjustment {
  productId: string
  operation: 'add' | 'subtract' | 'set'
  quantity: number
  reason?: string
}

export interface BulkOperationRequest {
  action: 'adjust_stock' | 'reorder'
  items: any[]
}

export interface LowStockAlert {
  _id: string
  productName: string
  sku: string
  image: string
  currentStock: number
  minStock: number
  reorderLevel: number
  warehouse: string
  category: string
  lastSold: string
  daysOutOfStock: number
  urgency: 'critical' | 'high' | 'medium'
  notified: boolean
}

export interface AlertsResponse {
  alerts: LowStockAlert[]
  stats: {
    total: number
    critical: number
    high: number
    medium: number
  }
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

class InventoryService {
  private baseUrl = '/api/admin/inventory'

  /**
   * Get all inventory items
   */
  async getInventory(filters?: InventoryFilter): Promise<InventoryResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      if (filters) {
        if (filters.search) queryParams.append('search', filters.search)
        if (filters.status) queryParams.append('status', filters.status)
        if (filters.warehouse) queryParams.append('warehouse', filters.warehouse)
        if (filters.page) queryParams.append('page', filters.page.toString())
        if (filters.limit) queryParams.append('limit', filters.limit.toString())
      }

      const url = queryParams.toString() 
        ? `${this.baseUrl}?${queryParams.toString()}`
        : this.baseUrl

      const response = await fetch(url)

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        throw new Error('Unauthorized')
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch inventory')
      }

      const result = await response.json()
      return result.data
    } catch (error: any) {
      console.error('Error fetching inventory:', error)
      throw error
    }
  }

  /**
   * Get single inventory item
   */
  async getInventoryItem(id: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`)

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        throw new Error('Unauthorized')
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch inventory item')
      }

      const result = await response.json()
      return result.data
    } catch (error: any) {
      console.error('Error fetching inventory item:', error)
      throw error
    }
  }

  /**
   * Update inventory item
   */
  async updateInventory(
    id: string,
    data: {
      stock?: number
      lowStockThreshold?: number
      reorderLevel?: number
      maxStock?: number
      reason?: string
    }
  ): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        throw new Error('Unauthorized')
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update inventory')
      }

      return await response.json()
    } catch (error: any) {
      console.error('Error updating inventory:', error)
      throw error
    }
  }

  /**
   * Adjust stock for a product
   */
  async adjustStock(id: string, adjustment: StockAdjustment): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(adjustment)
      })

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        throw new Error('Unauthorized')
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to adjust stock')
      }

      return await response.json()
    } catch (error: any) {
      console.error('Error adjusting stock:', error)
      throw error
    }
  }

  /**
   * Bulk operations
   */
  async bulkOperation(request: BulkOperationRequest): Promise<any> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        throw new Error('Unauthorized')
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to perform bulk operation')
      }

      return await response.json()
    } catch (error: any) {
      console.error('Error in bulk operation:', error)
      throw error
    }
  }

  /**
   * Get low stock alerts
   */
  async getAlerts(urgency?: string, page?: number, limit?: number): Promise<AlertsResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      if (urgency && urgency !== 'all') queryParams.append('urgency', urgency)
      if (page) queryParams.append('page', page.toString())
      if (limit) queryParams.append('limit', limit.toString())

      const url = queryParams.toString()
        ? `${this.baseUrl}/alerts?${queryParams.toString()}`
        : `${this.baseUrl}/alerts`

      const response = await fetch(url)

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        throw new Error('Unauthorized')
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch alerts')
      }

      const result = await response.json()
      return result.data
    } catch (error: any) {
      console.error('Error fetching alerts:', error)
      throw error
    }
  }

  /**
   * Send notifications for low stock items
   */
  async sendNotifications(productIds: string[], method?: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/alerts/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productIds, method })
      })

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        throw new Error('Unauthorized')
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to send notifications')
      }

      return await response.json()
    } catch (error: any) {
      console.error('Error sending notifications:', error)
      throw error
    }
  }

  /**
   * Export inventory
   */
  async exportInventory(format: 'csv' | 'pdf', status?: string): Promise<any> {
    try {
      const queryParams = new URLSearchParams()
      queryParams.append('format', format)
      if (status) queryParams.append('status', status)

      const url = `${this.baseUrl}/export?${queryParams.toString()}`
      const response = await fetch(url)

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        throw new Error('Unauthorized')
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to export inventory')
      }

      if (format === 'csv') {
        // Return blob for CSV download
        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(downloadUrl)
        return { success: true, message: 'CSV downloaded' }
      } else {
        // Return data for PDF generation
        return await response.json()
      }
    } catch (error: any) {
      console.error('Error exporting inventory:', error)
      throw error
    }
  }
}

export const inventoryService = new InventoryService()
export default inventoryService

