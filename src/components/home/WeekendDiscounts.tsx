'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ProductCard from '@/components/shared/ProductCard'
import { Calendar } from 'lucide-react'
import { frontendProductService, type Product } from '@/services/frontend'

export default function WeekendDiscounts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const result = await frontendProductService.getProducts({ limit: 12 })
      
      if (result.success && result.data) {
        // Get different set of products
        setProducts(result.data.slice(4, 8))
      }
    } catch (error) {
      console.error('Error fetching weekend products:', error)
    } finally {
      setLoading(false)
    }
  }

  if (products.length === 0 && !loading) {
    return null
  }

  return (
    <section className="py-16 bg-gradient-to-br from-purple-50 to-white">
      <div className="container">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Calendar className="w-8 h-8 text-purple-600" />
            <h2 className="text-3xl font-bold text-gray-900">Weekend Special</h2>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Exclusive weekend deals just for you
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
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

        <div className="text-center mt-12">
          <Link
            href="/products"
            className="inline-flex items-center px-8 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Shop Weekend Deals
          </Link>
        </div>
      </div>
    </section>
  )
}
