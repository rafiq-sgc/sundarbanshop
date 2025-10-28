export interface BlogPost {
  _id: string
  title: string
  slug: string
  excerpt: string
  content: string
  image?: string
  category: string
  tags: string[]
  author: string
  status: 'draft' | 'published' | 'archived'
  views: number
  featured: boolean
  metaTitle?: string
  metaDescription?: string
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

export interface BlogStats {
  total: number
  published: number
  draft: number
  archived: number
  totalViews: number
}

export interface BlogPostsResponse {
  posts: BlogPost[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  stats: BlogStats
  categories: string[]
}

export interface CreateBlogPostData {
  title: string
  slug?: string
  excerpt: string
  content: string
  image?: string
  category: string
  tags?: string[]
  status?: 'draft' | 'published' | 'archived'
  featured?: boolean
  metaTitle?: string
  metaDescription?: string
}

export interface UpdateBlogPostData extends Partial<CreateBlogPostData> {}

class BlogService {
  private baseUrl = '/api/admin/content/blog'

  /**
   * Get all blog posts
   */
  async getBlogPosts(filters?: {
    search?: string
    status?: string
    category?: string
    page?: number
    limit?: number
  }): Promise<{ success: boolean; data?: BlogPostsResponse; message?: string }> {
    try {
      const queryParams = new URLSearchParams()
      
      if (filters) {
        if (filters.search) queryParams.append('search', filters.search)
        if (filters.status) queryParams.append('status', filters.status)
        if (filters.category) queryParams.append('category', filters.category)
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
      console.error('Error fetching blog posts:', error)
      return { success: false, message: 'Failed to fetch blog posts' }
    }
  }

  /**
   * Get blog post by ID
   */
  async getBlogPostById(id: string): Promise<{ success: boolean; data?: BlogPost; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`)

      if (response.status === 401) {
        window.location.href = '/auth/signin'
        return { success: false, message: 'Unauthorized' }
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error fetching blog post:', error)
      return { success: false, message: 'Failed to fetch blog post' }
    }
  }

  /**
   * Create blog post
   */
  async createBlogPost(data: CreateBlogPostData): Promise<{ success: boolean; data?: BlogPost; message?: string }> {
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
      console.error('Error creating blog post:', error)
      return { success: false, message: 'Failed to create blog post' }
    }
  }

  /**
   * Update blog post
   */
  async updateBlogPost(id: string, data: UpdateBlogPostData): Promise<{ success: boolean; data?: BlogPost; message?: string }> {
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
      console.error('Error updating blog post:', error)
      return { success: false, message: 'Failed to update blog post' }
    }
  }

  /**
   * Delete blog post
   */
  async deleteBlogPost(id: string): Promise<{ success: boolean; message?: string }> {
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
      console.error('Error deleting blog post:', error)
      return { success: false, message: 'Failed to delete blog post' }
    }
  }

  /**
   * Get status color
   */
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'published': 'bg-green-100 text-green-700 border-green-200',
      'draft': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'archived': 'bg-gray-100 text-gray-700 border-gray-200'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  /**
   * Get status icon
   */
  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'published': 'CheckCircle',
      'draft': 'Clock',
      'archived': 'Archive'
    }
    return icons[status] || 'Circle'
  }

  /**
   * Transliterate Bangla to English
   */
  private transliterateBanglaToEnglish(text: string): string {
    const banglaToEnglish: Record<string, string> = {
      // Vowels
      'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u', 'ূ': 'u', 'ৃ': 'r',
      'ে': 'e', 'ৈ': 'ai', 'ো': 'o', 'ৌ': 'ou',
      // Consonants
      'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
      'চ': 'ch', 'ছ': 'chh', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'n',
      'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
      'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
      'প': 'p', 'ফ': 'ph', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
      'য': 'j', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh',
      'স': 's', 'হ': 'h', 'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y',
      'ৎ': 't', 'ং': 'ng', 'ঃ': 'h', 'ঁ': 'n',
      // Independent vowels
      'অ': 'a', 'আ': 'a', 'ই': 'i', 'ঈ': 'i', 'উ': 'u', 'ঊ': 'u',
      'ঋ': 'r', 'এ': 'e', 'ঐ': 'ai', 'ও': 'o', 'ঔ': 'ou',
      // Numbers
      '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
      '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
      // Special characters
      '্': '', // Hasant (virama) - removes it
    }

    let transliterated = ''
    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      transliterated += banglaToEnglish[char] || char
    }
    
    return transliterated
  }

  /**
   * Generate slug from title (supports Bangla)
   */
  generateSlug(title: string): string {
    // First transliterate Bangla to English
    const transliterated = this.transliterateBanglaToEnglish(title)
    
    // Then convert to slug format
    return transliterated
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces, underscores with hyphens
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
  }

  /**
   * Truncate text
   */
  truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  /**
   * Format views count
   */
  formatViews(views: number): string {
    if (views >= 1000000) {
      return (views / 1000000).toFixed(1) + 'M'
    } else if (views >= 1000) {
      return (views / 1000).toFixed(1) + 'K'
    }
    return views.toString()
  }
}

export const blogService = new BlogService()

