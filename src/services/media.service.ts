export interface MediaUsage {
  type: 'product' | 'blog' | 'banner' | 'category'
  entityId: string
}

export interface MediaAsset {
  _id: string
  name: string
  filename: string
  url: string
  thumbnailUrl?: string
  mimeType: string
  size: number
  width?: number
  height?: number
  folder?: string
  tags: string[]
  altText?: string
  uploadedBy: string
  usedIn: MediaUsage[]
  createdAt: string
  updatedAt: string
}

export interface MediaStats {
  total: number
  images: number
  videos: number
  documents: number
  totalSize: number
}

export interface MediaAssetsResponse {
  assets: MediaAsset[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  stats: MediaStats
  folders: string[]
}

export interface UploadMediaData {
  name: string
  filename: string
  url: string
  thumbnailUrl?: string
  mimeType: string
  size: number
  width?: number
  height?: number
  folder?: string
  tags?: string[]
  altText?: string
}

export interface UpdateMediaData {
  name?: string
  folder?: string
  tags?: string[]
  altText?: string
}

class MediaService {
  private baseUrl = '/api/admin/content/media'

  /**
   * Get all media assets
   */
  async getMediaAssets(filters?: {
    search?: string
    folder?: string
    type?: string
    page?: number
    limit?: number
  }): Promise<{ success: boolean; data?: MediaAssetsResponse; message?: string }> {
    try {
      const queryParams = new URLSearchParams()
      
      if (filters) {
        if (filters.search) queryParams.append('search', filters.search)
        if (filters.folder) queryParams.append('folder', filters.folder)
        if (filters.type) queryParams.append('type', filters.type)
        if (filters.page) queryParams.append('page', filters.page.toString())
        if (filters.limit) queryParams.append('limit', filters.limit.toString())
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
      console.error('Error fetching media assets:', error)
      return { success: false, message: 'Failed to fetch media assets' }
    }
  }

  /**
   * Get media asset by ID
   */
  async getMediaAssetById(id: string): Promise<{ success: boolean; data?: MediaAsset; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`)

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        return { success: false, message: 'Unauthorized' }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error fetching media asset:', error)
      return { success: false, message: 'Failed to fetch media asset' }
    }
  }

  /**
   * Upload media asset
   */
  async uploadMediaAsset(data: UploadMediaData): Promise<{ success: boolean; data?: MediaAsset; message?: string }> {
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
      console.error('Error uploading media asset:', error)
      return { success: false, message: 'Failed to upload media asset' }
    }
  }

  /**
   * Update media asset
   */
  async updateMediaAsset(id: string, data: UpdateMediaData): Promise<{ success: boolean; data?: MediaAsset; message?: string }> {
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
      console.error('Error updating media asset:', error)
      return { success: false, message: 'Failed to update media asset' }
    }
  }

  /**
   * Delete media asset
   */
  async deleteMediaAsset(id: string): Promise<{ success: boolean; message?: string }> {
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
      console.error('Error deleting media asset:', error)
      return { success: false, message: 'Failed to delete media asset' }
    }
  }

  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  /**
   * Get file type icon
   */
  getFileTypeIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'Image'
    if (mimeType.startsWith('video/')) return 'Video'
    if (mimeType.startsWith('application/pdf')) return 'FileText'
    return 'File'
  }

  /**
   * Get file type color
   */
  getFileTypeColor(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'bg-blue-100 text-blue-700'
    if (mimeType.startsWith('video/')) return 'bg-purple-100 text-purple-700'
    if (mimeType.startsWith('application/pdf')) return 'bg-red-100 text-red-700'
    return 'bg-gray-100 text-gray-700'
  }

  /**
   * Validate image file
   */
  validateImageFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'File must be an image' }
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return { valid: false, error: 'Image size must be less than 10MB' }
    }

    return { valid: true }
  }

  /**
   * Get image dimensions
   */
  getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          resolve({ width: img.width, height: img.height })
        }
        img.onerror = reject
        img.src = e.target?.result as string
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /**
   * Convert file to base64
   */
  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        resolve(reader.result as string)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /**
   * Copy URL to clipboard
   */
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      return false
    }
  }
}

export const mediaService = new MediaService()

