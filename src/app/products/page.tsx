'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  ShoppingCart,
  Search,
  Star,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { cartService } from '@/services/dashboard'
import { frontendProductService, type Product } from '@/services/frontend'
import { useCartAPI } from '@/store/cart-api-context'

export default function ProductsPage() {
  const { data: session, status } = useSession()
  const { refreshCart } = useCartAPI()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [addingToCart, setAddingToCart] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const result = await frontendProductService.getProducts({ limit: 100 })
      
      if (result.success && result.data) {
        setProducts(result.data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async (productId: string) => {
    try {
      setAddingToCart(productId)
      
      if (status === 'authenticated') {
        // User is logged in - use database cart
        const result = await cartService.addToCart(productId, 1)
        if (result.success) {
          toast.success('Added to cart!')
          await refreshCart()
        }
      } else {
        // Guest user - use localStorage cart
        const product = products.find(p => p._id === productId)
        if (!product) return

        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]')
        const existingIndex = guestCart.findIndex((item: any) => item.productId === productId)
        
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
        await refreshCart()
      }
    } catch (error: any) {
      console.error('Error adding to cart:', error)
      toast.error(error.message || 'Failed to add to cart')
    } finally {
      setAddingToCart(null)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">All Products</h1>
          
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 aspect-square rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-gray-600">No products found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product._id} className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  {/* Product Image */}
                  <Link href={`/products/${product._id}`}>
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4 relative">
                      <img
                        src={product.images?.[0] || '/placeholder.png'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.png'
                        }}
                      />
                      {product.stock < 10 && product.stock > 0 && (
                        <div className="absolute top-2 right-2 px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded">
                          Only {product.stock} left
                        </div>
                      )}
                      {product.stock === 0 && (
                        <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                          Out of Stock
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Product Info */}
                  <Link href={`/products/${product._id}`}>
                    <h3 className="font-semibold text-gray-900 mb-1 hover:text-green-600 line-clamp-2">
                      {product.name}
                    </h3>
                  </Link>

                  {/* Rating */}
                  {product.rating && (
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-gray-600">{product.rating.toFixed(1)}</span>
                    </div>
                  )}

                  {/* Price and Add to Cart */}
                  <div className="flex items-center justify-between">
                    <div className="text-xl font-bold text-green-600">
                      ৳{product.price.toFixed(2)}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddToCart(product._id)}
                      disabled={product.stock === 0 || addingToCart === product._id}
                      className="gap-1"
                    >
                      {addingToCart === product._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

