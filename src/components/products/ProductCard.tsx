'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingCart, Star, Eye } from 'lucide-react'
import { useCart } from '@/store/cart-context'
import { Product } from '@/types'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart()
  const [wishlist, setWishlist] = useState<string[]>([])

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addItem(product, 1)
  }

  const isInWishlist = wishlist.includes(product._id)

  return (
    <div className="group bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
      <div className="relative overflow-hidden rounded-t-xl">
        <Link href={`/products/${product.slug}`}>
          <Image
            src={product.images[0] || '/images/placeholder-product.jpg'}
            alt={product.name}
            width={300}
            height={300}
            className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>
        
        {/* Sale Badge */}
        {product.isOnSale && (
          <div className="absolute top-3 left-3 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
            {product.discountPercentage || 25}% Off
          </div>
        )}

        {/* Featured Badge */}
        {product.isFeatured && (
          <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            Featured
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => toggleWishlist(product._id)}
            className={`p-2 rounded-full shadow-md transition-colors ${
              isInWishlist
                ? 'bg-red-500 text-white'
                : 'bg-white text-gray-600 hover:text-red-500'
            }`}
          >
            <Heart className="w-4 h-4" />
          </button>
          <Link
            href={`/products/${product.slug}`}
            className="p-2 bg-white text-gray-600 hover:text-primary-600 rounded-full shadow-md transition-colors"
          >
            <Eye className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-2">
          <div className="flex items-center space-x-1 mb-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(product.rating || 0)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
            <span className="text-sm text-gray-500 ml-1">
              ({product.reviewCount || 0})
            </span>
          </div>
        </div>

        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-primary-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-sm text-gray-500 line-through">
                ${product.comparePrice.toFixed(2)}
              </span>
            )}
          </div>
          <span className="text-sm text-gray-500">500g Pack</span>
        </div>

        <button
          onClick={handleAddToCart}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-xl hover:bg-green-700 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  )
}
