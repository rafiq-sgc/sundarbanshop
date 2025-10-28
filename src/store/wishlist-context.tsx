'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Product } from '@/types'
import toast from 'react-hot-toast'

interface WishlistContextType {
  items: Product[]
  isLoading: boolean
  addToWishlist: (product: Product) => void
  removeFromWishlist: (productId: string) => void
  isInWishlist: (productId: string) => boolean
  clearWishlist: () => void
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load wishlist from localStorage
    const savedWishlist = localStorage.getItem('wishlist')
    if (savedWishlist) {
      setItems(JSON.parse(savedWishlist))
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    // Save wishlist to localStorage whenever it changes
    if (!isLoading) {
      localStorage.setItem('wishlist', JSON.stringify(items))
    }
  }, [items, isLoading])

  const addToWishlist = (product: Product) => {
    if (!isInWishlist(product._id)) {
      setItems([...items, product])
      toast.success('Added to wishlist!')
    } else {
      toast.error('Already in wishlist')
    }
  }

  const removeFromWishlist = (productId: string) => {
    setItems(items.filter(item => item._id !== productId))
    toast.success('Removed from wishlist')
  }

  const isInWishlist = (productId: string): boolean => {
    return items.some(item => item._id === productId)
  }

  const clearWishlist = () => {
    setItems([])
    toast.success('Wishlist cleared')
  }

  return (
    <WishlistContext.Provider
      value={{
        items,
        isLoading,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        clearWishlist
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}
