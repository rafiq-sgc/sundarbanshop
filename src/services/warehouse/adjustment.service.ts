import { InventoryAdjustmentFormData } from '@/lib/validations/warehouse'

// Types
export interface InventoryAdjustment {
  _id: string
  adjustmentNumber: string
  warehouse: {
    _id: string
    name: string
    code: string
  }
  items: Array<{
    product: {
      _id: string
      name: string
      sku: string
      images?: string[]
    }
    previousQuantity: number
    newQuantity: number
    difference: number
  }>
  type: 'stock_count' | 'damaged' | 'lost' | 'found' | 'correction' | 'other'
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  adjustedBy: {
    _id: string
    name: string
    email: string
  }
  approvedBy?: {
    _id: string
    name: string
    email: string
  }
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface AdjustmentStats {
  total: number
  pending: number
  approved: number
  rejected: number
}

export interface AdjustmentListResponse {
  adjustments: InventoryAdjustment[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
  stats: AdjustmentStats
}

export interface AdjustmentQueryParams {
  page?: number
  limit?: number
  status?: string
  warehouseId?: string
  type?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

class InventoryAdjustmentService {
  private baseUrl = '/api/admin/inventory/adjustments'

  /**
   * Fetch all inventory adjustments
   */
  async getAll(params?: AdjustmentQueryParams): Promise<AdjustmentListResponse> {
    const queryString = new URLSearchParams()
    
    if (params) {
      if (params.page) queryString.append('page', params.page.toString())
      if (params.limit) queryString.append('limit', params.limit.toString())
      if (params.status) queryString.append('status', params.status)
      if (params.warehouseId) queryString.append('warehouseId', params.warehouseId)
      if (params.type) queryString.append('type', params.type)
      if (params.sortBy) queryString.append('sortBy', params.sortBy)
      if (params.sortOrder) queryString.append('sortOrder', params.sortOrder)
    }

    const url = queryString.toString() ? `${this.baseUrl}?${queryString}` : this.baseUrl
    const response = await fetch(url)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch adjustments')
    }
    
    return response.json()
  }

  /**
   * Get adjustment by ID
   */
  async getById(id: string): Promise<{ adjustment: InventoryAdjustment }> {
    const response = await fetch(`${this.baseUrl}/${id}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch adjustment')
    }
    
    return response.json()
  }

  /**
   * Create new inventory adjustment
   */
  async create(
    data: InventoryAdjustmentFormData
  ): Promise<{ message: string; adjustment: InventoryAdjustment }> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create adjustment')
    }
    
    return response.json()
  }

  /**
   * Approve adjustment
   */
  async approve(id: string): Promise<{ message: string; adjustment: InventoryAdjustment }> {
    return this.updateStatus(id, 'approve')
  }

  /**
   * Reject adjustment
   */
  async reject(id: string): Promise<{ message: string; adjustment: InventoryAdjustment }> {
    return this.updateStatus(id, 'reject')
  }

  /**
   * Update adjustment status (internal method)
   */
  private async updateStatus(
    id: string,
    action: 'approve' | 'reject'
  ): Promise<{ message: string; adjustment: InventoryAdjustment }> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to ${action} adjustment`)
    }
    
    return response.json()
  }

  /**
   * Delete adjustment
   */
  async delete(id: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete adjustment')
    }
    
    return response.json()
  }
}

export const inventoryAdjustmentService = new InventoryAdjustmentService()

