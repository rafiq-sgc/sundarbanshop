'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { Product } from '@/types'

export default function RecentlyViewed() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentlyViewed()
  }, [])

  const fetchRecentlyViewed = async () => {
    const slugs = JSON.parse(localStorage.getItem('recentlyViewed') || '[]')
    
    if (slugs.length === 0) {
      setLoading(false)
      return
    }

    try {
      // Fetch products by slugs
      const productPromises = slugs.slice(0, 8).map((slug: string) =>
        fetch(`/api/products/slug/${slug}`).then(res => res.json())
      )
      
      const results = await Promise.all(productPromises)
      const validProducts = results
        .filter(r => r.success)
        .map(r => r.data)
      
      setProducts(validProducts)
    } catch (error) {
      console.error('Error fetching recently viewed:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearHistory = () => {
    localStorage.removeItem('recentlyViewed')
    setProducts([])
  }

  if (loading || products.length === 0) {
    return null
  }

  return (
    <section className="py-16 bg-white">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Eye className="w-8 h-8 text-blue-600" />
              Recently Viewed
            </h2>
            <p className="text-gray-600 mt-2">Products you've recently looked at</p>
          </div>
          <button
            onClick={clearHistory}
            className="text-sm text-gray-600 hover:text-red-600 transition-colors"
          >
            Clear History
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {products.map((product) => (
            <Link
              key={product._id}
              href={`/products/${product.slug}`}
              className="group bg-white rounded-lg shadow-sm hover:shadow-lg transition-all border border-gray-200"
            >
              <div className="relative h-40 overflow-hidden rounded-t-lg">
                <Image
                  src={product.images[0] || '/images/placeholder-product.jpg'}
                  alt={product.name}
                  width={200}
                  height={200}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2 group-hover:text-green-600 transition-colors">
                  {product.name}
                </h3>
                <p className="text-lg font-bold text-gray-900">
                  ${product.price.toFixed(2)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
