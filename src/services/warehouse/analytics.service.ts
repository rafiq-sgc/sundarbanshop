// Types
export interface LowStockItem {
  warehouse: {
    _id: string
    name: string
    code: string
  }
  product: {
    _id: string
    name: string
    sku: string
    images?: string[]
    price: number
  }
  quantity: number
  reserved: number
  available: number
  threshold: number
  criticalThreshold: number
  isCritical: boolean
  isOutOfStock: boolean
  percentageRemaining: number
}

export interface LowStockResponse {
  lowStockItems: LowStockItem[]
  outOfStockItems: LowStockItem[]
  allAlerts: LowStockItem[]
  stats: {
    lowStock: number
    critical: number
    outOfStock: number
    totalAlerts: number
  }
}

export interface InventoryStatsResponse {
  overview: {
    totalWarehouses: number
    totalProducts: number
    totalQuantity: number
    totalReserved: number
    totalAvailable: number
    totalValue: number
    lowStockCount: number
    outOfStockCount: number
  }
  transfers: {
    pending: number
    inTransit: number
    total: number
  }
  adjustments: {
    pending: number
  }
  topProducts: Array<{
    productId: string
    quantity: number
    reserved: number
    available: number
    value: number
  }>
  warehouses: Array<{
    _id: string
    name: string
    code: string
    itemCount: number
    totalQuantity: number
    totalReserved: number
    totalAvailable: number
  }>
}

export interface LowStockQueryParams {
  warehouseId?: string
  critical?: boolean
  outOfStock?: boolean
}

class WarehouseAnalyticsService {
  private lowStockUrl = '/api/admin/inventory/low-stock'
  private statsUrl = '/api/admin/inventory/stats'

  /**
   * Get low stock alerts across warehouses
   */
  async getLowStockAlerts(params?: LowStockQueryParams): Promise<LowStockResponse> {
    const queryString = new URLSearchParams()
    
    if (params) {
      if (params.warehouseId) queryString.append('warehouseId', params.warehouseId)
      if (params.critical) queryString.append('critical', 'true')
      if (params.outOfStock) queryString.append('outOfStock', 'true')
    }

    const url = queryString.toString() ? `${this.lowStockUrl}?${queryString}` : this.lowStockUrl
    const response = await fetch(url)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch low stock alerts')
    }
    
    return response.json()
  }

  /**
   * Get comprehensive inventory statistics
   */
  async getStats(): Promise<InventoryStatsResponse> {
    const response = await fetch(this.statsUrl)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch inventory stats')
    }
    
    return response.json()
  }
}

export const warehouseAnalyticsService = new WarehouseAnalyticsService()

