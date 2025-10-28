'use client'

import React, { createContext, useContext, useReducer, useEffect, useState } from 'react'
import { Product, CartItem } from '@/types'
import toast from 'react-hot-toast'

interface CartState {
  items: CartItem[]
  subtotal: number
  tax: number
  shipping: number
  discount: number
  total: number
  isLoading: boolean
}

interface CartContextType extends CartState {
  addItem: (product: Product, quantity?: number, variant?: any) => void
  removeItem: (productId: string, variant?: string) => void
  updateQuantity: (productId: string, quantity: number, variant?: string) => void
  clearCart: () => void
  getItemQuantity: (productId: string, variant?: string) => number
  getCartItemCount: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CART'; payload: Partial<CartState> }
  | { type: 'ADD_ITEM'; payload: { product: Product; quantity: number; variant?: any } }
  | { type: 'REMOVE_ITEM'; payload: { productId: string; variant?: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number; variant?: string } }
  | { type: 'CLEAR_CART' }

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'SET_CART':
      return { ...state, ...action.payload }
    
    case 'ADD_ITEM': {
      const { product, quantity, variant } = action.payload
      const existingItemIndex = state.items.findIndex(
        item => (typeof item.product === 'object' ? item.product._id : item.product) === (typeof product === 'object' ? product._id : product) && 
        (!variant || (typeof item.variant === 'object' ? item.variant?.name : item.variant) === (typeof variant === 'object' ? variant.name : variant))
      )
      
      let newItems = [...state.items]
      
      if (existingItemIndex > -1) {
        newItems[existingItemIndex].quantity += quantity
      } else {
        newItems.push({
          product,
          variant,
          quantity,
          price: variant?.price || product.price
        })
      }
      
      return {
        ...state,
        items: newItems,
        subtotal: calculateSubtotal(newItems),
        total: calculateTotal(newItems, state.tax, state.shipping, state.discount)
      }
    }
    
    case 'REMOVE_ITEM': {
      const { productId, variant } = action.payload
      const newItems = state.items.filter(
        item => !((typeof item.product === 'object' ? item.product._id : item.product) === productId && 
        (!variant || (typeof item.variant === 'object' ? item.variant?.name : item.variant) === variant))
      )
      
      return {
        ...state,
        items: newItems,
        subtotal: calculateSubtotal(newItems),
        total: calculateTotal(newItems, state.tax, state.shipping, state.discount)
      }
    }
    
    case 'UPDATE_QUANTITY': {
      const { productId, quantity, variant } = action.payload
      const newItems = state.items.map(item => {
        if ((typeof item.product === 'object' ? item.product._id : item.product) === productId && 
            (!variant || (typeof item.variant === 'object' ? item.variant?.name : item.variant) === variant)) {
          return { ...item, quantity: Math.max(0, quantity) }
        }
        return item
      }).filter(item => item.quantity > 0)
      
      return {
        ...state,
        items: newItems,
        subtotal: calculateSubtotal(newItems),
        total: calculateTotal(newItems, state.tax, state.shipping, state.discount)
      }
    }
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        subtotal: 0,
        total: 0
      }
    
    default:
      return state
  }
}

const calculateSubtotal = (items: CartItem[]): number => {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
}

const calculateTotal = (items: CartItem[], tax: number, shipping: number, discount: number): number => {
  const subtotal = calculateSubtotal(items)
  return subtotal + tax + shipping - discount
}

const initialState: CartState = {
  items: [],
  subtotal: 0,
  tax: 0,
  shipping: 0,
  discount: 0,
  total: 0,
  isLoading: false
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)


  // Save cart to localStorage whenever it changes (but not on initial load)
  const [isInitialized, setIsInitialized] = useState(false)
  
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('ekomart-cart', JSON.stringify(state))
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('cartUpdated', { 
        detail: { cartCount: state.items.reduce((total, item) => total + item.quantity, 0) }
      }))
    }
  }, [state, isInitialized])

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('ekomart-cart')
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart)
        dispatch({ type: 'SET_CART', payload: cartData })
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
      }
    }
    setIsInitialized(true)
  }, [])

  const addItem = (product: Product, quantity: number = 1, variant?: any) => {
    dispatch({ type: 'ADD_ITEM', payload: { product, quantity, variant } })
    // Toast is handled by the calling component
  }

  const removeItem = (productId: string, variant?: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { productId, variant } })
    toast.success('Item removed from cart')
  }

  const updateQuantity = (productId: string, quantity: number, variant?: string) => {
    if (quantity <= 0) {
      removeItem(productId, variant)
    } else {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity, variant } })
    }
  }

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
    toast.success('Cart cleared')
  }

  const getItemQuantity = (productId: string, variant?: string): number => {
    const item = state.items.find(
      item => (typeof item.product === 'object' ? item.product._id : item.product) === productId && 
      (!variant || (typeof item.variant === 'object' ? item.variant?.name : item.variant) === variant)
    )
    return item?.quantity || 0
  }

  const getCartItemCount = (): number => {
    return state.items.reduce((total, item) => total + item.quantity, 0)
  }

  const value: CartContextType = {
    ...state,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItemQuantity,
    getCartItemCount
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
