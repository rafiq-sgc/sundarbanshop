'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Product } from '@/types'
import toast from 'react-hot-toast'

interface CompareContextType {
  items: Product[]
  addToCompare: (product: Product) => void
  removeFromCompare: (productId: string) => void
  isInCompare: (productId: string) => boolean
  clearCompare: () => void
}

const CompareContext = createContext<CompareContextType | undefined>(undefined)

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Product[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('compare')
    if (saved) {
      setItems(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('compare', JSON.stringify(items))
  }, [items])

  const addToCompare = (product: Product) => {
    if (items.length >= 4) {
      toast.error('You can compare up to 4 products only')
      return
    }
    if (!isInCompare(product._id)) {
      setItems([...items, product])
      toast.success('Added to compare!')
    }
  }

  const removeFromCompare = (productId: string) => {
    setItems(items.filter(item => item._id !== productId))
    toast.success('Removed from compare')
  }

  const isInCompare = (productId: string) => {
    return items.some(item => item._id === productId)
  }

  const clearCompare = () => {
    setItems([])
    toast.success('Comparison cleared')
  }

  return (
    <CompareContext.Provider value={{ items, addToCompare, removeFromCompare, isInCompare, clearCompare }}>
      {children}
    </CompareContext.Provider>
  )
}

export function useCompare() {
  const context = useContext(CompareContext)
  if (!context) throw new Error('useCompare must be used within CompareProvider')
  return context
}
