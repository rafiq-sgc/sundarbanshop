export interface AdminUser {
  _id: string
  name: string
  email: string
  phone?: string
  role: 'admin'
  isActive: boolean
  emailVerified: boolean
  lastLogin?: string
  notes?: string
  createdBy?: string
  createdAt: string
  updatedAt: string
}

export interface AdminUserStats {
  total: number
  active: number
  inactive: number
}

export interface AdminUsersResponse {
  users: AdminUser[]
  stats: AdminUserStats
}

export interface CreateAdminUserData {
  name: string
  email: string
  password: string
  phone?: string
  isActive?: boolean
  notes?: string
}

export interface UpdateAdminUserData {
  name?: string
  email?: string
  password?: string
  phone?: string
  isActive?: boolean
  notes?: string
}

class AdminUserService {
  private baseUrl = '/api/admin/settings/users'

  /**
   * Get all admin users
   */
  async getUsers(filters?: {
    search?: string
    isActive?: boolean
  }): Promise<{ success: boolean; data?: AdminUsersResponse; message?: string }> {
    try {
      const queryParams = new URLSearchParams()
      
      if (filters) {
        if (filters.search) queryParams.append('search', filters.search)
        if (filters.isActive !== undefined) queryParams.append('isActive', filters.isActive.toString())
      }

      const url = queryParams.toString() 
        ? `${this.baseUrl}?${queryParams.toString()}`
        : this.baseUrl

      const response = await fetch(url, { cache: 'no-store' })

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        return { success: false, message: 'Unauthorized' }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error fetching admin users:', error)
      return { success: false, message: 'Failed to fetch users' }
    }
  }

  /**
   * Get admin user by ID
   */
  async getUserById(id: string): Promise<{ success: boolean; data?: AdminUser; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`)

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        return { success: false, message: 'Unauthorized' }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error fetching admin user:', error)
      return { success: false, message: 'Failed to fetch user' }
    }
  }

  /**
   * Create admin user
   */
  async createUser(data: CreateAdminUserData): Promise<{ success: boolean; data?: AdminUser; message?: string }> {
    try {
      const response = await fetch(this.baseUrl, {
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
      console.error('Error creating admin user:', error)
      return { success: false, message: 'Failed to create user' }
    }
  }

  /**
   * Update admin user
   */
  async updateUser(id: string, data: UpdateAdminUserData): Promise<{ success: boolean; data?: AdminUser; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
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
      console.error('Error updating admin user:', error)
      return { success: false, message: 'Failed to update user' }
    }
  }

  /**
   * Delete admin user
   */
  async deleteUser(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
      })

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        return { success: false, message: 'Unauthorized' }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error deleting admin user:', error)
      return { success: false, message: 'Failed to delete user' }
    }
  }

  /**
   * Toggle user active status
   */
  async toggleActive(id: string, isActive: boolean): Promise<{ success: boolean; data?: AdminUser; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'toggleActive', isActive })
      })

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        return { success: false, message: 'Unauthorized' }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error toggling user status:', error)
      return { success: false, message: 'Failed to toggle user status' }
    }
  }
}

export const adminUserService = new AdminUserService()

