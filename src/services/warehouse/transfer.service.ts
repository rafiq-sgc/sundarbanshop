import { StockTransferFormData } from '@/lib/validations/warehouse'

// Types
export interface StockTransfer {
  _id: string
  transferNumber: string
  fromWarehouse: {
    _id: string
    name: string
    code: string
  }
  toWarehouse: {
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
    quantity: number
    notes?: string
  }>
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled'
  requestedBy: {
    _id: string
    name: string
    email: string
  }
  approvedBy?: {
    _id: string
    name: string
    email: string
  }
  completedBy?: {
    _id: string
    name: string
    email: string
  }
  requestedDate: string
  approvedDate?: string
  completedDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface TransferStats {
  total: number
  pending: number
  in_transit: number
  completed: number
  cancelled: number
}

export interface TransferListResponse {
  transfers: StockTransfer[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
  stats: TransferStats
}

export interface TransferQueryParams {
  page?: number
  limit?: number
  status?: string
  warehouseId?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

class StockTransferService {
  private baseUrl = '/api/admin/warehouses/transfers'

  /**
   * Fetch all stock transfers
   */
  async getAll(params?: TransferQueryParams): Promise<TransferListResponse> {
    const queryString = new URLSearchParams()
    
    if (params) {
      if (params.page) queryString.append('page', params.page.toString())
      if (params.limit) queryString.append('limit', params.limit.toString())
      if (params.status) queryString.append('status', params.status)
      if (params.warehouseId) queryString.append('warehouseId', params.warehouseId)
      if (params.sortBy) queryString.append('sortBy', params.sortBy)
      if (params.sortOrder) queryString.append('sortOrder', params.sortOrder)
    }

    const url = queryString.toString() ? `${this.baseUrl}?${queryString}` : this.baseUrl
    const response = await fetch(url)
    
    if (response.status === 401) {
      window.location.href = '/auth/signin'
      throw new Error('Unauthorized')
    }
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch transfers')
    }
    
    return response.json()
  }

  /**
   * Get transfer by ID
   */
  async getById(id: string): Promise<{ transfer: StockTransfer }> {
    const response = await fetch(`${this.baseUrl}/${id}`)
    
    if (response.status === 401) {
      window.location.href = '/auth/signin'
      throw new Error('Unauthorized')
    }
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch transfer')
    }
    
    return response.json()
  }

  /**
   * Create new stock transfer
   */
  async create(data: StockTransferFormData): Promise<{ message: string; transfer: StockTransfer }> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (response.status === 401) {
      window.location.href = '/auth/signin'
      throw new Error('Unauthorized')
    }
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create transfer')
    }
    
    return response.json()
  }

  /**
   * Approve transfer (pending → in_transit)
   */
  async approve(id: string): Promise<{ message: string; transfer: StockTransfer }> {
    return this.updateStatus(id, 'approve')
  }

  /**
   * Complete transfer (in_transit → completed)
   */
  async complete(id: string): Promise<{ message: string; transfer: StockTransfer }> {
    return this.updateStatus(id, 'complete')
  }

  /**
   * Cancel transfer
   */
  async cancel(id: string): Promise<{ message: string; transfer: StockTransfer }> {
    return this.updateStatus(id, 'cancel')
  }

  /**
   * Update transfer status (internal method)
   */
  private async updateStatus(
    id: string,
    action: 'approve' | 'complete' | 'cancel'
  ): Promise<{ message: string; transfer: StockTransfer }> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    
    if (response.status === 401) {
      window.location.href = '/auth/signin'
      throw new Error('Unauthorized')
    }
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to ${action} transfer`)
    }
    
    return response.json()
  }

  /**
   * Delete transfer
   */
  async delete(id: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    })
    
    if (response.status === 401) {
      window.location.href = '/auth/signin'
      throw new Error('Unauthorized')
    }
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete transfer')
    }
    
    return response.json()
  }
}

export const stockTransferService = new StockTransferService()

