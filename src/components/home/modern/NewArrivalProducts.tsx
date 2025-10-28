'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Star, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { frontendProductService, type Product } from '@/services/frontend'
import { useCart } from '@/store/cart-context'
import { useCartAPI } from '@/store/cart-api-context'
import { useSession } from 'next-auth/react'
import { cartService } from '@/services/dashboard'
import toast from 'react-hot-toast'

export default function NewArrivalProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)

  const { data: session } = useSession()
  const { addItem: addToCartLocal } = useCart()
  const { refreshCart } = useCartAPI()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const result = await frontendProductService.getProducts({ limit: 5, sort: '-createdAt' })
      
      if (result.success && result.data) {
        setProducts(result.data)
      }
    } catch (error) {
      console.error('Error fetching new arrival products:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateDiscount = (product: Product) => {
    if (product.price && product.comparePrice) {
      return Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    }
    return 0
  }

  const handleAddToCart = async (product: Product, quantity: number = 1) => {
    if (addingToCart === product._id) return
    
    setAddingToCart(product._id)
    
    try {
      if (session) {
        // User is authenticated - use API
        await cartService.addToCart(product._id, quantity)
        // Refresh cart to update count
        await refreshCart()
        toast.success(`${product.name} added to cart!`)
      } else {
        // Guest user - use local cart
        addToCartLocal(product, quantity)
        toast.success(`${product.name} added to cart!`)
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Failed to add item to cart. Please try again.')
    } finally {
      setAddingToCart(null)
    }
  }

  if (loading) {
    return (
      <section className="py-4 sm:py-6 bg-white">
        <div className="container">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">Our New Arrival Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] bg-gray-200 rounded-lg mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <section className="py-4 sm:py-6 bg-white">
      <div className="container">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">Our New Arrival Products</h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {products.map((product) => {
            const discount = calculateDiscount(product)
            return (
              <Card
                key={product._id}
                className="group hover:shadow-lg transition-all duration-300"
              >
                {/* Product Image */}
                <Link href={`/products/${product._id}`} className="block">
                  <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                    <Image
                      src={product.images?.[0] || '/placeholder.png'}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* New Badge */}
                    <Badge className="absolute top-2 left-2 bg-green-600 text-white border-0 text-xs px-1.5 py-0.5 shadow-md">
                      NEW
                    </Badge>
                    {/* Discount Badge */}
                    {discount > 0 && (
                      <Badge className="absolute top-2 right-2 bg-red-600 text-white border-0 text-xs px-1.5 py-0.5 shadow-md">
                        -{discount}%
                      </Badge>
                    )}
                  </div>
                </Link>

                {/* Product Info */}
                <CardContent className="p-3">
                  <Link href={`/products/${product._id}`}>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1.5 line-clamp-2 min-h-[2.5rem] hover:text-green-600 transition-colors">{product.name}</h3>
                  </Link>
                  
                  {/* Rating */}
                  {product.rating && (
                    <div className="flex items-center gap-0.5 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < Math.floor(product.rating || 0)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'fill-gray-200 text-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-baseline gap-2 mb-2.5">
                    <span className="text-lg font-bold text-green-600">৳{product.price.toFixed(2)}</span>
                    {product.comparePrice && (
                      <span className="text-xs text-gray-400 line-through">৳{product.comparePrice.toFixed(2)}</span>
                    )}
                  </div>

                  {/* Add to Cart */}
                  <Button 
                    size="sm" 
                    className="w-full bg-green-600 hover:bg-green-700 text-white h-9"
                    onClick={() => handleAddToCart(product)}
                    disabled={addingToCart === product._id || product.stock === 0}
                  >
                    {addingToCart === product._id ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                        <span className="text-xs">Add to Cart</span>
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
