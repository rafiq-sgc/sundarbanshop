// Dashboard Profile Service
import { API_BASE_URL } from '@/lib/constants'

export interface UserProfile {
  _id: string
  name: string
  email?: string | null
  phone?: string | null
  avatar?: string | null
  role: string
  customerType: string
  emailVerified: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface UpdateProfileData {
  name?: string
  email?: string | null
  phone?: string | null
  currentPassword?: string
  newPassword?: string
  confirmPassword?: string
}

export interface ProfileResponse {
  success: boolean
  message?: string
  data?: UserProfile
}

class ProfileService {
  private baseUrl = `${API_BASE_URL}/dashboard/profile`

  /**
   * Get current user profile
   */
  async getProfile(): Promise<ProfileResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch profile')
    }

    return response.json()
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileData): Promise<ProfileResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to update profile')
    }

    return response.json()
  }

  /**
   * Upload avatar
   */
  async uploadAvatar(file: File): Promise<ProfileResponse> {
    const formData = new FormData()
    formData.append('avatar', file)

    const response = await fetch(`${this.baseUrl}/avatar`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to upload avatar')
    }

    return response.json()
  }
}

export const profileService = new ProfileService()

