'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { cartService, type Cart } from '@/services/dashboard'

interface CartContextType {
  cart: Cart | null
  cartCount: number
  isLoading: boolean
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [cart, setCart] = useState<Cart | null>(null)
  const [cartCount, setCartCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch cart based on authentication status
  useEffect(() => {
    if (status === 'authenticated') {
      fetchCart()
    } else if (status === 'unauthenticated') {
      // Load guest cart from localStorage
      loadGuestCart()
    }
  }, [status])

  // Listen for changes in localStorage for guest users
  useEffect(() => {
    if (status === 'unauthenticated') {
      const handleCartUpdate = (event: CustomEvent) => {
        setCartCount(event.detail.cartCount)
      }

      const handleStorageChange = () => {
        loadGuestCart()
      }

      // Listen for custom cart update event
      window.addEventListener('cartUpdated', handleCartUpdate as EventListener)
      
      // Listen for storage changes (for cross-tab updates)
      window.addEventListener('storage', handleStorageChange)

      return () => {
        window.removeEventListener('cartUpdated', handleCartUpdate as EventListener)
        window.removeEventListener('storage', handleStorageChange)
      }
    }
  }, [status])

  const fetchCart = async () => {
    try {
      setIsLoading(true)
      const result = await cartService.getCart()
      
      if (result.success && result.data) {
        setCart(result.data)
        
        // Calculate total item count
        const count = result.data.items.reduce((total: number, item: any) => {
          return total + item.quantity
        }, 0)
        setCartCount(count)
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
      setCart(null)
      setCartCount(0)
    } finally {
      setIsLoading(false)
    }
  }

  const loadGuestCart = () => {
    try {
      const guestCart = JSON.parse(localStorage.getItem('ekomart-cart') || '{"items": []}')
      const count = guestCart.items ? guestCart.items.reduce((total: number, item: any) => total + item.quantity, 0) : 0
      setCartCount(count)
      setCart(null) // Guest cart doesn't use Cart model
    } catch (error) {
      console.error('Error loading guest cart:', error)
      setCartCount(0)
    }
  }

  const refreshCart = async () => {
    if (status === 'authenticated') {
      await fetchCart()
    } else {
      loadGuestCart()
    }
  }

  const value: CartContextType = {
    cart,
    cartCount,
    isLoading,
    refreshCart
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCartAPI() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCartAPI must be used within a CartProvider')
  }
  return context
}

