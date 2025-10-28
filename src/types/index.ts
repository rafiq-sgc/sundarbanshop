export interface User {
  _id: string
  name: string
  email: string
  password?: string
  role: 'user' | 'admin'
  avatar?: string
  phone?: string
  address?: Address[]
  createdAt: Date
  updatedAt: Date
}

export interface Address {
  _id?: string
  name: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  isDefault: boolean
}

export interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  image?: string
  parent?: string
  children?: Category[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Product {
  _id: string
  name: string
  slug: string
  description: string
  shortDescription?: string
  price: number
  comparePrice?: number
  costPrice?: number
  sku: string
  barcode?: string
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  images: string[]
  category: string | Category
  tags: string[]
  stock: number
  trackQuantity: boolean
  allowBackorder: boolean
  isActive: boolean
  isDigital: boolean
  isFeatured: boolean
  isOnSale: boolean
  discountPercentage?: number
  salePrice?: number
  saleStartDate?: Date
  saleEndDate?: Date
  metaTitle?: string
  metaDescription?: string
  variants?: ProductVariant[]
  attributes?: ProductAttribute[]
  reviews?: Review[]
  rating?: number
  reviewCount?: number
  createdAt: Date
  updatedAt: Date
}

export interface ProductVariant {
  _id?: string
  name: string
  sku: string
  price: number
  comparePrice?: number
  stock: number
  attributes: {
    [key: string]: string
  }
  image?: string
  isActive: boolean
}

export interface ProductAttribute {
  name: string
  values: string[]
  isRequired: boolean
}

export interface Review {
  _id: string
  user: string | User
  product: string | Product
  rating: number
  title?: string
  comment: string
  images?: string[]
  isVerified: boolean
  helpful: number
  createdAt: Date
  updatedAt: Date
}

export interface CartItem {
  _id?: string
  product: string | Product
  variant?: string | ProductVariant
  quantity: number
  price: number
}

export interface Cart {
  _id: string
  user: string | User
  items: CartItem[]
  subtotal: number
  tax: number
  shipping: number
  discount: number
  total: number
  currency: string
  createdAt: Date
  updatedAt: Date
}

export interface Order {
  _id: string
  orderNumber: string
  user: string | User
  items: OrderItem[]
  shippingAddress: Address
  billingAddress?: Address
  paymentMethod: string
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  orderStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  subtotal: number
  tax: number
  shipping: number
  discount: number
  total: number
  currency: string
  notes?: string
  trackingNumber?: string
  shippedAt?: Date
  deliveredAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface OrderItem {
  _id?: string
  product: string | Product
  variant?: string | ProductVariant
  name: string
  sku: string
  price: number
  quantity: number
  total: number
}

export interface Coupon {
  _id: string
  code: string
  name: string
  description?: string
  type: 'percentage' | 'fixed'
  value: number
  minimumAmount?: number
  maximumDiscount?: number
  usageLimit?: number
  usedCount: number
  isActive: boolean
  validFrom: Date
  validUntil: Date
  createdAt: Date
  updatedAt: Date
}

export interface Wishlist {
  _id: string
  user: string | User
  products: string[] | Product[]
  createdAt: Date
  updatedAt: Date
}

export interface BlogPost {
  _id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  featuredImage?: string
  author: string | User
  category: string
  tags: string[]
  isPublished: boolean
  publishedAt?: Date
  metaTitle?: string
  metaDescription?: string
  createdAt: Date
  updatedAt: Date
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
    hasNext: boolean
    hasPrev: boolean
  }
}
