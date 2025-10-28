// Frontend Product Service (Public - No authentication required)
import { API_BASE_URL } from '@/lib/constants'

export interface ProductAttribute {
  name: string
  values: string[]
  isRequired: boolean
}

export interface ProductVariant {
  _id?: string
  name: string
  sku: string
  price: number
  comparePrice?: number
  stock: number
  attributes: { [key: string]: string }
  image?: string
  isActive: boolean
}

export interface Product {
  _id: string
  name: string
  slug: string
  price: number
  comparePrice?: number
  currentPrice?: number
  discountPercentage?: number
  salePrice?: number
  images: string[]
  stock: number
  rating?: number
  reviewCount?: number
  description: string
  shortDescription?: string
  category: string
  sku: string
  barcode?: string
  isFeatured: boolean
  isActive: boolean
  isDigital: boolean
  isOnSale: boolean
  trackQuantity: boolean
  allowBackorder: boolean
  tags: string[]
  weight?: number
  attributes?: ProductAttribute[]
  variants?: ProductVariant[]
  metaTitle?: string
  metaDescription?: string
  createdAt: Date
  updatedAt: Date
  id?: string // Some APIs return both _id and id
}

export interface ProductsResponse {
  success: boolean
  message?: string
  data?: Product[]
  count?: number
}

export interface ProductResponse {
  success: boolean
  message?: string
  data?: Product
}

export interface ProductFilters {
  page?: number
  limit?: number
  sort?: string
  category?: string
  featured?: boolean
  search?: string
  minPrice?: number
  maxPrice?: number
  onSale?: boolean
}

export interface PaginatedProductsResponse {
  success: boolean
  message?: string
  data?: Product[]
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

class FrontendProductService {
  private baseUrl = `${API_BASE_URL}/frontend/products`

  /**
   * Get all products (with optional filters)
   */
  async getProducts(filters?: ProductFilters): Promise<ProductsResponse> {
    const queryParams = new URLSearchParams()
    
    if (filters?.page) queryParams.append('page', filters.page.toString())
    if (filters?.limit) queryParams.append('limit', filters.limit.toString())
    if (filters?.sort) queryParams.append('sort', filters.sort)
    if (filters?.category) queryParams.append('category', filters.category)
    if (filters?.featured) queryParams.append('featured', 'true')
    if (filters?.search) queryParams.append('search', filters.search)
    if (filters?.minPrice) queryParams.append('minPrice', filters.minPrice.toString())
    if (filters?.maxPrice) queryParams.append('maxPrice', filters.maxPrice.toString())
    if (filters?.onSale) queryParams.append('onSale', 'true')

    const url = queryParams.toString() ? `${this.baseUrl}?${queryParams}` : this.baseUrl

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch products')
    }

    return response.json()
  }

  /**
   * Get products with pagination
   */
  async getProductsWithPagination(filters?: ProductFilters): Promise<PaginatedProductsResponse> {
    const queryParams = new URLSearchParams()
    
    if (filters?.page) queryParams.append('page', filters.page.toString())
    if (filters?.limit) queryParams.append('limit', filters.limit.toString())
    if (filters?.sort) queryParams.append('sort', filters.sort)
    if (filters?.category) queryParams.append('category', filters.category)
    if (filters?.featured) queryParams.append('featured', 'true')
    if (filters?.search) queryParams.append('search', filters.search)
    if (filters?.minPrice) queryParams.append('minPrice', filters.minPrice.toString())
    if (filters?.maxPrice) queryParams.append('maxPrice', filters.maxPrice.toString())
    if (filters?.onSale) queryParams.append('onSale', 'true')

    const url = queryParams.toString() ? `${this.baseUrl}?${queryParams}` : this.baseUrl

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch products')
    }

    return response.json()
  }

  /**
   * Get single product by ID
   */
  async getProduct(productId: string): Promise<ProductResponse> {
    const response = await fetch(`${this.baseUrl}/${productId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch product')
    }

    return response.json()
  }

  /**
   * Search products
   */
  async searchProducts(searchTerm: string, limit: number = 20): Promise<ProductsResponse> {
    return this.getProducts({ search: searchTerm, limit })
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(category: string, limit: number = 20): Promise<ProductsResponse> {
    return this.getProducts({ category, limit })
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(limit: number = 8): Promise<ProductsResponse> {
    return this.getProducts({ featured: true, limit })
  }
}

// Categories Service
export interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  image?: string
  parent?: string | Category
  isActive: boolean
  sortOrder?: number
  createdAt: Date
  updatedAt: Date
}

export interface CategoriesResponse {
  success: boolean
  message?: string
  data?: Category[]
}

class FrontendCategoryService {
  private baseUrl = `${API_BASE_URL}/frontend/categories`

  /**
   * Get all active categories
   */
  async getCategories(parent?: string): Promise<CategoriesResponse> {
    const queryParams = new URLSearchParams()
    
    if (parent) queryParams.append('parent', parent)

    const url = queryParams.toString() ? `${this.baseUrl}?${queryParams}` : this.baseUrl

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch categories')
    }

    return response.json()
  }
}

export const frontendProductService = new FrontendProductService()
export const frontendCategoryService = new FrontendCategoryService()

