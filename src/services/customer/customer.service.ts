import { API_BASE_URL } from '@/lib/constants'

export interface Customer {
  _id: string
  name: string
  email: string
  phone?: string
  avatar?: string
  address?: Array<{
    name: string
    phone: string
    address: string
    city: string
    state: string
    zipCode: string
    country: string
    isDefault: boolean
  }>
  isActive: boolean
  emailVerified: boolean
  lastLogin?: string
  createdAt: string
  updatedAt: string
}

export interface CustomerStats {
  totalOrders: number
  totalSpent: number
  averageOrderValue: number
  lastOrderDate?: string
}

export interface CustomerWithStats extends Customer {
  stats: CustomerStats
}

export interface CustomerQueryParams {
  limit?: number
  offset?: number
  search?: string
  status?: 'active' | 'inactive' | 'all'
  segment?: 'all' | 'new' | 'vip' | 'loyal' | 'regular' | 'dormant' | 'one-time'
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface GetCustomersResponse {
  customers: CustomerWithStats[]
  total: number
  limit: number
  offset: number
  stats: {
    total: number
    active: number
    inactive: number
    newThisMonth: number
    totalRevenue: number
  }
}

export interface GetCustomerDetailResponse {
  customer: CustomerWithStats
  recentOrders: Array<{
    _id: string
    orderNumber: string
    total: number
    status: string
    createdAt: string
  }>
  stats: CustomerStats
}

export interface CustomerCreateInput {
  name: string
  email: string
  phone?: string
  password?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  isActive?: boolean
  notes?: string
  sendWelcomeEmail?: boolean
}

export interface CustomerUpdateInput {
  name?: string
  email?: string
  phone?: string
  password?: string
  address?: Array<{
    name: string
    phone: string
    address: string
    city: string
    state: string
    zipCode: string
    country: string
    isDefault: boolean
  }>
  isActive?: boolean
  emailVerified?: boolean
}

class CustomerService {
  private baseUrl = `${API_BASE_URL}/admin/customers`

  /**
   * Get all customers with pagination and filters
   */
  async getAll(params?: CustomerQueryParams): Promise<GetCustomersResponse> {
    const query = new URLSearchParams(params as any).toString()
    console.log("query==========", query)
    const response = await fetch(`${this.baseUrl}?${query}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch customers')
    }
    
    return response.json()
  }

  /**
   * Get customer by ID with stats and recent orders
   */
  async getById(id: string): Promise<GetCustomerDetailResponse> {
    const response = await fetch(`${this.baseUrl}/${id}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch customer')
    }
    
    return response.json()
  }

  /**
   * Create new customer
   */
  async create(data: CustomerCreateInput): Promise<{ message: string; customer: Customer }> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create customer')
    }
    
    return response.json()
  }

  /**
   * Update customer
   */
  async update(
    id: string,
    data: CustomerUpdateInput
  ): Promise<{ message: string; customer: Customer }> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update customer')
    }
    
    return response.json()
  }

  /**
   * Delete customer
   */
  async delete(id: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete customer')
    }
    
    return response.json()
  }

  /**
   * Toggle customer status (active/inactive)
   */
  async toggleStatus(id: string): Promise<{ message: string; customer: Customer }> {
    const response = await fetch(`${this.baseUrl}/${id}/toggle-status`, {
      method: 'PATCH',
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to toggle customer status')
    }
    
    return response.json()
  }

  /**
   * Get customer segments/analytics
   */
  async getSegments(): Promise<{
    segments: {
      all: number
      new: number
      vip: number
      loyal: number
      regular: number
      dormant: number
      oneTime: number
    }
  }> {
    const response = await fetch(`${this.baseUrl}/segments`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch customer segments')
    }
    
    return response.json()
  }
}

export const customerService = new CustomerService()

