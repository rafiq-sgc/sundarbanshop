'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ProductCard from '@/components/shared/ProductCard'
import { Flame } from 'lucide-react'
import { frontendProductService, type Product } from '@/services/frontend'

export default function TrendingProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const result = await frontendProductService.getProducts({ limit: 16 })
      
      if (result.success && result.data) {
        // Get different products (skip first 8)
        setProducts(result.data.slice(8, 16))
      }
    } catch (error) {
      console.error('Error fetching trending products:', error)
    } finally {
      setLoading(false)
    }
  }

  if (products.length === 0 && !loading) {
    return null
  }

  return (
    <section className="py-16 bg-white">
      <div className="container">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Flame className="w-8 h-8 text-orange-500" />
            <h2 className="text-3xl font-bold text-gray-900">Trending Now</h2>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Hot picks that everyone's talking about
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-64 rounded-t-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
