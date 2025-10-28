'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useWishlist } from '@/store/wishlist-context'
import { useCart } from '@/store/cart-context'
import {
  Heart,
  ShoppingCart,
  Trash2,
  Star,
  Tag
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function WishlistPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { items, removeFromWishlist, clearWishlist } = useWishlist()
  const { addItem } = useCart()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/dashboard/wishlist')
    }
  }, [status, router])

  const handleAddToCart = (product: any) => {
    addItem(product, 1)
    removeFromWishlist(product._id)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container py-8">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-600">
          <ol className="flex items-center space-x-2">
            <li><Link href="/" className="hover:text-green-600">Home</Link></li>
            <li>/</li>
            <li><Link href="/dashboard" className="hover:text-green-600">Dashboard</Link></li>
            <li>/</li>
            <li className="text-gray-900">Wishlist</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Heart className="w-8 h-8 text-red-500 fill-current" />
              My Wishlist
            </h1>
            <p className="text-gray-600 mt-2">{items.length} {items.length === 1 ? 'item' : 'items'} saved</p>
          </div>
          {items.length > 0 && (
            <button
              onClick={clearWishlist}
              className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Clear All
            </button>
          )}
        </div>

        {/* Wishlist Items */}
        {items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((product) => (
              <div key={product._id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 group">
                {/* Product Image */}
                <Link href={`/products/${product.slug}`} className="block relative">
                  <div className="relative h-64 overflow-hidden">
                    <Image
                      src={product.images[0] || '/images/placeholder-product.jpg'}
                      alt={product.name}
                      width={400}
                      height={400}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {product.isOnSale && product.discountPercentage && (
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                          -{product.discountPercentage}% OFF
                        </span>
                      )}
                      {product.isFeatured && (
                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                          Featured
                        </span>
                      )}
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        removeFromWishlist(product._id)
                      }}
                      className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Heart className="w-5 h-5 fill-current" />
                    </button>
                  </div>
                </Link>

                {/* Product Info */}
                <div className="p-4">
                  <Link href={`/products/${product.slug}`}>
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-green-600 transition-colors">
                      {product.name}
                    </h3>
                  </Link>

                  {/* Rating */}
                  {product.rating && (
                    <div className="flex items-center gap-1 mb-3">
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
                      <span className="text-sm text-gray-600 ml-1">({product.reviewCount || 0})</span>
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl font-bold text-gray-900">
                      ${product.price.toFixed(2)}
                    </span>
                    {product.comparePrice && product.comparePrice > product.price && (
                      <span className="text-sm text-gray-500 line-through">
                        ${product.comparePrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Stock Status */}
                  <div className="mb-4">
                    {product.stock > 0 ? (
                      <span className="text-sm text-green-600 flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        In Stock ({product.stock} available)
                      </span>
                    ) : (
                      <span className="text-sm text-red-600 flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                        Out of Stock
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors font-medium"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Add to Cart
                    </button>
                    <button
                      onClick={() => removeFromWishlist(product._id)}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-red-50 hover:border-red-300 text-red-600 transition-colors"
                      title="Remove from Wishlist"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm">
            <Heart className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Wishlist is Empty</h2>
            <p className="text-gray-600 mb-6">
              Start adding products you love to your wishlist!
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
