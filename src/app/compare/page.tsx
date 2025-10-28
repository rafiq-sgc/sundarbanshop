'use client'

import { useCompare } from '@/store/compare-context'
import { useCart } from '@/store/cart-context'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { X, ShoppingCart, Star, Check, Minus } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function ComparePage() {
  const { items, removeFromCompare, clearCompare } = useCompare()
  const { addItem } = useCart()

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container py-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Product Comparison</h1>
            <p className="text-gray-600 mb-8">No products to compare. Add products from the shop to start comparing.</p>
            <Link href="/shop" className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Browse Products
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const features = [
    { label: 'Price', key: 'price' },
    { label: 'Rating', key: 'rating' },
    { label: 'Stock', key: 'stock' },
    { label: 'Category', key: 'category' },
    { label: 'On Sale', key: 'isOnSale' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Compare Products</h1>
            <p className="text-gray-600">Compare up to 4 products side by side</p>
          </div>
          <button
            onClick={clearCompare}
            className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50"
          >
            Clear All
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="p-6 text-left font-semibold text-gray-900 bg-gray-50">Feature</th>
                {items.map((product) => (
                  <th key={product._id} className="p-6 min-w-[250px]">
                    <div className="relative">
                      <button
                        onClick={() => removeFromCompare(product._id)}
                        className="absolute top-0 right-0 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <Image
                        src={product.images[0] || '/images/placeholder-product.jpg'}
                        alt={product.name}
                        width={200}
                        height={200}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                      <Link href={`/products/${product.slug}`} className="font-semibold text-gray-900 hover:text-green-600 block mb-2">
                        {product.name}
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="p-6 font-medium text-gray-700">{feature.label}</td>
                  {items.map((product) => (
                    <td key={product._id} className="p-6">
                      {feature.key === 'price' && (
                        <div>
                          <span className="text-2xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
                          {product.comparePrice && product.comparePrice > product.price && (
                            <span className="ml-2 text-sm text-gray-500 line-through">${product.comparePrice.toFixed(2)}</span>
                          )}
                        </div>
                      )}
                      {feature.key === 'rating' && (
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                          ))}
                          <span className="ml-2 text-sm text-gray-600">({product.reviewCount})</span>
                        </div>
                      )}
                      {feature.key === 'stock' && (
                        <span className={product.stock > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                        </span>
                      )}
                      {feature.key === 'category' && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          {typeof product.category === 'string' ? product.category : product.category.name}
                        </span>
                      )}
                      {feature.key === 'isOnSale' && (
                        product.isOnSale ? (
                          <Check className="w-6 h-6 text-green-600" />
                        ) : (
                          <Minus className="w-6 h-6 text-gray-400" />
                        )
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="p-6 font-medium text-gray-700">Actions</td>
                {items.map((product) => (
                  <td key={product._id} className="p-6">
                    <button
                      onClick={() => {
                        addItem(product, 1)
                        removeFromCompare(product._id)
                      }}
                      disabled={product.stock === 0}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Add to Cart
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </main>
      <Footer />
    </div>
  )
}
