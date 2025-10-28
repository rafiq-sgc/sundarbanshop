'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Heart, ShoppingCart, Star, Eye, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { cartService } from '@/services/dashboard'
import { useCartAPI } from '@/store/cart-api-context'

interface ProductCardProps {
  product: {
    _id: string
    name: string
    price: number
    images: string[]
    stock: number
    rating?: number
    description?: string
    category?: string
  }
  showQuickView?: boolean
}

export default function ProductCard({ product, showQuickView = true }: ProductCardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { refreshCart } = useCartAPI()
  const [wishlist, setWishlist] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()

    try {
      setAddingToCart(true)
      
      if (status === 'authenticated') {
        // User is logged in - use database cart
        const result = await cartService.addToCart(product._id, 1)
        if (result.success) {
          toast.success('Added to cart!')
          await refreshCart()
        }
      } else {
        // Guest user - use localStorage cart
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]')
        
        // Check if product already in cart
        const existingIndex = guestCart.findIndex((item: any) => item.productId === product._id)
        
        if (existingIndex > -1) {
          guestCart[existingIndex].quantity += 1
        } else {
          guestCart.push({
            productId: product._id,
            name: product.name,
            price: product.price,
            image: product.images?.[0] || '/placeholder.png',
            quantity: 1,
            stock: product.stock
          })
        }
        
        localStorage.setItem('guestCart', JSON.stringify(guestCart))
        toast.success('Added to cart!')
        await refreshCart() // Update cart count
      }
    } catch (error: any) {
      console.error('Error adding to cart:', error)
      toast.error(error.message || 'Failed to add to cart')
    } finally {
      setAddingToCart(false)
    }
  }

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    setWishlist(!wishlist)
    toast.success(wishlist ? 'Removed from wishlist' : 'Added to wishlist')
  }

  const discount = product.price > 0 ? 0 : 0 // Calculate if you have comparePrice

  return (
    <div className="group bg-white rounded-lg shadow-sm hover:shadow-lg transition-all">
      <div className="relative overflow-hidden rounded-t-lg">
        <Link href={`/products/${product._id}`}>
          <img
            src={product.images?.[0] || '/placeholder.png'}
            alt={product.name}
            className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.png'
            }}
          />
        </Link>
        
        {/* Stock Badge */}
        {product.stock === 0 && (
          <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
            Out of Stock
          </div>
        )}
        {product.stock > 0 && product.stock < 10 && (
          <div className="absolute top-3 left-3 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
            Only {product.stock} left
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={toggleWishlist}
            className={`p-2 rounded-full shadow-md transition-colors ${
              wishlist
                ? 'bg-red-500 text-white'
                : 'bg-white text-gray-600 hover:text-red-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${wishlist ? 'fill-current' : ''}`} />
          </button>
          {showQuickView && (
            <Link
              href={`/products/${product._id}`}
              className="p-2 bg-white text-gray-600 hover:text-green-600 rounded-full shadow-md transition-colors"
            >
              <Eye className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* Rating */}
        {product.rating && (
          <div className="flex items-center space-x-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(product.rating!)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
            <span className="text-sm text-gray-500 ml-1">
              ({product.rating.toFixed(1)})
            </span>
          </div>
        )}

        {/* Product Name */}
        <Link href={`/products/${product._id}`}>
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-green-600 transition-colors cursor-pointer min-h-[3rem]">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-green-600">
              ৳{product.price.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0 || addingToCart}
          className="w-full bg-green-600 text-white py-2.5 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {addingToCart ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Adding...</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />
              <span>{product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

