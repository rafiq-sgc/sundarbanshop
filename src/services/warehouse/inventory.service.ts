// Types
export interface InventoryItem {
  product: {
    _id: string
    name: string
    sku: string
    images?: string[]
    price: number
    lowStockThreshold?: number
  }
  quantity: number
  reserved: number
  available: number
  lowStockThreshold: number
  isLowStock: boolean
}

export interface InventoryResponse {
  inventory: InventoryItem[]
  stats: {
    totalItems: number
    totalQuantity: number
    totalReserved: number
    totalAvailable: number
    lowStockCount: number
  }
}

export interface InventoryQueryParams {
  search?: string
  lowStock?: boolean
}

export interface InventoryUpdateData {
  productId: string
  quantity: number
  operation: 'add' | 'set'
}

class WarehouseInventoryService {
  private baseUrl = '/api/admin/warehouses'

  /**
   * Get warehouse inventory
   */
  async getInventory(
    warehouseId: string,
    params?: InventoryQueryParams
  ): Promise<InventoryResponse> {
    const queryString = new URLSearchParams()
    
    if (params) {
      if (params.search) queryString.append('search', params.search)
      if (params.lowStock) queryString.append('lowStock', 'true')
    }

    const url = queryString.toString()
      ? `${this.baseUrl}/${warehouseId}/inventory?${queryString}`
      : `${this.baseUrl}/${warehouseId}/inventory`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch inventory')
    }
    
    return response.json()
  }

  /**
   * Update warehouse inventory
   */
  async updateInventory(
    warehouseId: string,
    data: InventoryUpdateData
  ): Promise<{ message: string; warehouse: any }> {
    const response = await fetch(`${this.baseUrl}/${warehouseId}/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update inventory')
    }
    
    return response.json()
  }
}

export const warehouseInventoryService = new WarehouseInventoryService()

