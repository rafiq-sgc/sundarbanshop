import { WarehouseFormData } from '@/lib/validations/warehouse'

// Types
export interface Warehouse {
  _id: string
  name: string
  code: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  phone?: string
  email?: string
  manager?: {
    _id: string
    name: string
    email: string
  }
  isActive: boolean
  inventory: Array<{
    product: string | {
      _id: string
      name: string
      sku: string
      images?: string[]
      price: number
    }
    quantity: number
    reserved: number
  }>
  createdAt: string
  updatedAt: string
}

export interface WarehouseStats {
  total: number
  active: number
  inactive: number
}

export interface WarehouseListResponse {
  warehouses: Warehouse[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
  stats: WarehouseStats
}

export interface WarehouseDetailResponse {
  warehouse: Warehouse
  stats: {
    totalItems: number
    totalQuantity: number
    totalReserved: number
    totalAvailable: number
  }
}

export interface WarehouseQueryParams {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

class WarehouseService {
  private baseUrl = '/api/admin/warehouses'

  /**
   * Fetch all warehouses with optional filters
   */
  async getAll(params?: WarehouseQueryParams): Promise<WarehouseListResponse> {
    const queryString = new URLSearchParams()
    
    if (params) {
      if (params.page) queryString.append('page', params.page.toString())
      if (params.limit) queryString.append('limit', params.limit.toString())
      if (params.search) queryString.append('search', params.search)
      if (params.isActive !== undefined) queryString.append('isActive', params.isActive.toString())
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
      throw new Error(error.error || 'Failed to fetch warehouses')
    }
    
    return response.json()
  }

  /**
   * Alias for getAll - for backward compatibility
   */
  async getWarehouses(params?: WarehouseQueryParams): Promise<WarehouseListResponse> {
    return this.getAll(params)
  }

  /**
   * Get warehouse by ID
   */
  async getById(id: string): Promise<WarehouseDetailResponse> {
    const response = await fetch(`${this.baseUrl}/${id}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch warehouse')
    }
    
    return response.json()
  }

  /**
   * Create new warehouse
   */
  async create(data: WarehouseFormData): Promise<{ message: string; warehouse: Warehouse }> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create warehouse')
    }
    
    return response.json()
  }

  /**
   * Update warehouse
   */
  async update(
    id: string,
    data: Partial<WarehouseFormData>
  ): Promise<{ message: string; warehouse: Warehouse }> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update warehouse')
    }
    
    return response.json()
  }

  /**
   * Delete warehouse
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
      throw new Error(error.error || 'Failed to delete warehouse')
    }
    
    return response.json()
  }

  /**
   * Alias for delete - for backward compatibility
   */
  async deleteWarehouse(id: string): Promise<{ message: string }> {
    return this.delete(id)
  }
}

export const warehouseService = new WarehouseService()

