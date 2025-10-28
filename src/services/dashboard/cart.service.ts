// Dashboard Cart Service
import { API_BASE_URL } from '@/lib/constants'

export interface CartItemVariant {
  variantId?: string
  name?: string
  attributes?: {
    [key: string]: string
  }
  sku?: string
}

export interface CartItem {
  _id?: string
  product: {
    _id: string
    name: string
    price: number
    images: string[]
    stock: number
    sku?: string
  }
  quantity: number
  price: number
  variant?: CartItemVariant
}

export interface Cart {
  _id?: string
  userId: string
  items: CartItem[]
  subtotal: number
  total: number
}

export interface CartResponse {
  success: boolean
  message?: string
  data?: Cart
}

class CartService {
  private baseUrl = `${API_BASE_URL}/dashboard/cart`

  /**
   * Get user's cart
   */
  async getCart(): Promise<CartResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch cart')
    }

    return response.json()
  }

  /**
   * Add item to cart with optional variant
   */
  async addToCart(
    productId: string, 
    quantity: number = 1, 
    variant?: CartItemVariant
  ): Promise<CartResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity, variant }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to add to cart')
    }

    return response.json()
  }

  /**
   * Update cart item quantity
   */
  async updateQuantity(productId: string, quantity: number): Promise<CartResponse> {
    const response = await fetch(`${this.baseUrl}/item/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to update quantity')
    }

    return response.json()
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(productId: string): Promise<CartResponse> {
    const response = await fetch(`${this.baseUrl}/item/${productId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to remove from cart')
    }

    return response.json()
  }

  /**
   * Clear entire cart
   */
  async clearCart(): Promise<CartResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to clear cart')
    }

    return response.json()
  }
}

export const cartService = new CartService()

