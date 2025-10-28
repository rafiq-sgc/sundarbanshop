'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Star, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { frontendProductService, type Product } from '@/services/frontend'
import { useCart } from '@/store/cart-context'
import { useCartAPI } from '@/store/cart-api-context'
import { useSession } from 'next-auth/react'
import { cartService } from '@/services/dashboard'
import toast from 'react-hot-toast'

export default function FlashSellSection() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const firstCardRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [isManualScrolling, setIsManualScrolling] = useState(false)
  const scrollSpeedRef = useRef(0.5) // Scroll speed in pixels per frame
  const animationFrameRef = useRef<number | null>(null)
  const isInitializedRef = useRef(false)

  const { data: session } = useSession()
  const { addItem: addToCartLocal } = useCart()
  const { refreshCart } = useCartAPI()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const result = await frontendProductService.getProducts({ limit: 8, sort: '-createdAt' })
      
      if (result.success && result.data) {
        setProducts(result.data)
      }
    } catch (error) {
      console.error('Error fetching flash sell products:', error)
    } finally {
      setLoading(false)
    }
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

  // Helper function to calculate discount
  const calculateDiscount = (product: Product) => {
    if (product.price && product.comparePrice) {
      return Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    }
    return 0
  }

  // Duplicate products for seamless infinite scroll
  const duplicatedProducts = products.length > 0 ? [...products, ...products, ...products] : []

  useEffect(() => {
    // Set end time (24 hours from now)
    const endTime = Date.now() + 24 * 60 * 60 * 1000

    const timer = setInterval(() => {
      const now = Date.now()
      const difference = endTime - now

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        })
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Only initialize scroll if products are loaded
  useEffect(() => {
    if (products.length > 0 && !isInitializedRef.current) {
      // Initialize scroll position after products load
      setTimeout(() => {
        const scrollContainer = scrollContainerRef.current
        if (scrollContainer) {
          const singleSetWidth = scrollContainer.scrollWidth / 3
          scrollContainer.scrollLeft = singleSetWidth
          isInitializedRef.current = true
        }
      }, 100)
    }
  }, [products])

  // Initialize scroll position smoothly
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer || isInitializedRef.current) return

    const initializeScroll = () => {
      if (scrollContainer.scrollWidth > 0 && scrollContainer.children.length > 0) {
        const singleSetWidth = scrollContainer.scrollWidth / 3
        // Set scroll position to middle set (for infinite scroll)
        // Do this instantly to avoid visual jump
        scrollContainer.scrollLeft = singleSetWidth
        isInitializedRef.current = true
      } else {
        // Retry after a short delay if container isn't ready
        setTimeout(() => requestAnimationFrame(initializeScroll), 50)
      }
    }

    // Wait a bit for DOM to be fully rendered
    setTimeout(() => {
      requestAnimationFrame(initializeScroll)
    }, 100)
  }, [])

  // Auto-scroll animation with seamless loop
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer || !isInitializedRef.current) return

    let lastTime = performance.now()

    const autoScroll = (currentTime: number) => {
      if (!scrollContainer) return

      // Only auto-scroll if not paused and not manually scrolling
      if (!isPaused && !isManualScrolling && isInitializedRef.current) {
        const deltaTime = currentTime - lastTime
        lastTime = currentTime
        
        const scrollSpeed = scrollSpeedRef.current * (deltaTime / 16) // Normalize to 60fps
        scrollContainer.scrollLeft += scrollSpeed
        
        // Reset to seamless position when we scroll past second set
        const singleSetWidth = scrollContainer.scrollWidth / 3
        const maxScroll = singleSetWidth * 2
        if (scrollContainer.scrollLeft >= maxScroll) {
          scrollContainer.scrollLeft = singleSetWidth
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(autoScroll)
    }

    animationFrameRef.current = requestAnimationFrame(autoScroll)
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPaused, isManualScrolling])

  const getCardWidth = () => {
    const scrollContainer = scrollContainerRef.current
    const firstCard = firstCardRef.current
    if (!scrollContainer) return 0

    // Try to get actual card width from DOM
    if (firstCard) {
      const cardRect = firstCard.getBoundingClientRect()
      const containerRect = scrollContainer.getBoundingClientRect()
      const gapSize = 16 // gap-4 = 16px
      return cardRect.width + gapSize
    }

    // Fallback calculation - updated for 5-6 cards per row
    const containerWidth = scrollContainer.offsetWidth
    const gapSize = 16 // gap-4 = 16px
    const cardsVisible = containerWidth >= 1280 ? 6 : containerWidth >= 1024 ? 5 : containerWidth >= 768 ? 4 : containerWidth >= 640 ? 3 : 2
    const totalGaps = cardsVisible - 1
    return (containerWidth - (totalGaps * gapSize)) / cardsVisible + gapSize
  }

  const scrollLeft = () => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer || !isInitializedRef.current) return
    
    setIsManualScrolling(true)
    setIsPaused(true)
    
    const cardWidth = getCardWidth()
    const currentScroll = scrollContainer.scrollLeft
    const singleSetWidth = scrollContainer.scrollWidth / 3
    
    // Calculate target scroll position aligned to card boundaries
    let targetScroll = Math.round((currentScroll - cardWidth) / cardWidth) * cardWidth
    
    // Handle circular scroll - if going before middle set, wrap to end
    if (targetScroll < singleSetWidth) {
      const excess = singleSetWidth - targetScroll
      targetScroll = singleSetWidth * 2 - excess
    }
    
    scrollContainer.scrollTo({ left: targetScroll, behavior: 'smooth' })
    
    // Resume auto-scroll after animation completes
    setTimeout(() => {
      setIsManualScrolling(false)
      setIsPaused(false)
    }, 800)
  }

  const scrollRight = () => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer || !isInitializedRef.current) return
    
    setIsManualScrolling(true)
    setIsPaused(true)
    
    const cardWidth = getCardWidth()
    const currentScroll = scrollContainer.scrollLeft
    const singleSetWidth = scrollContainer.scrollWidth / 3
    
    // Calculate target scroll position aligned to card boundaries
    let targetScroll = Math.round((currentScroll + cardWidth) / cardWidth) * cardWidth
    
    // Handle circular scroll - if going past second set, wrap to start
    if (targetScroll >= singleSetWidth * 2) {
      const excess = targetScroll - singleSetWidth * 2
      targetScroll = singleSetWidth + excess
    }
    
    scrollContainer.scrollTo({ left: targetScroll, behavior: 'smooth' })
    
    // Resume auto-scroll after animation completes
    setTimeout(() => {
      setIsManualScrolling(false)
      setIsPaused(false)
    }, 800)
  }

  return (
    <section className="py-4 sm:py-6 bg-white">
      <div className="container">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Flash Sell</h2>
            <div className="flex items-center gap-1 sm:gap-2 bg-red-100 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg">
              <span className="text-red-600 font-bold text-xs sm:text-sm">Ends in:</span>
              <div className="flex items-center gap-0.5 sm:gap-1">
                <div className="bg-red-600 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm font-bold">
                  {String(timeLeft.days).padStart(2, '0')}
                </div>
                <span className="text-red-600 font-bold text-xs sm:text-sm">:</span>
                <div className="bg-red-600 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm font-bold">
                  {String(timeLeft.hours).padStart(2, '0')}
                </div>
                <span className="text-red-600 font-bold text-xs sm:text-sm">:</span>
                <div className="bg-red-600 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm font-bold">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </div>
                <span className="text-red-600 font-bold text-xs sm:text-sm">:</span>
                <div className="bg-red-600 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm font-bold">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <Link href="/shop?flash=true" className="text-sm sm:text-base text-green-600 font-semibold hover:text-green-700">
              View All
            </Link>
            <div className="flex gap-2 lg:hidden">
              <button
                onClick={scrollLeft}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={scrollRight}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Products Horizontal Scroll Container */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] bg-gray-200 rounded-lg mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? null : (
          <div className="relative w-full overflow-hidden">
            <div
              ref={scrollContainerRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory w-full"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              style={{ scrollBehavior: 'smooth' }}
            >
            {duplicatedProducts.map((product, index) => {
              const discount = calculateDiscount(product)
              return (
                <Card
                  key={`${product._id}-${index}`}
                  ref={index === Math.floor(duplicatedProducts.length / 3) ? firstCardRef : null}
                  className="flex-shrink-0 w-[calc(50%-0.5rem)] sm:w-[calc((100%-2*1rem)/3)] md:w-[calc((100%-3*1rem)/4)] lg:w-[calc((100%-4*1rem)/5)] xl:w-[calc((100%-5*1rem)/6)] snap-start group hover:shadow-lg transition-all duration-300"
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
                      {/* Discount Badge */}
                      {discount > 0 && (
                        <Badge className="absolute top-2 left-2 bg-red-600 text-white border-0 text-xs px-1.5 py-0.5 shadow-md">
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

            {/* Navigation Arrows */}
            {!loading && products.length > 0 && (
              <>
                <Button
                  onClick={scrollLeft}
                  variant="outline"
                  size="icon"
                  className="absolute left-0 top-1/2 -translate-y-1/2 bg-white shadow-lg hover:bg-gray-50 z-10 hidden lg:flex"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  onClick={scrollRight}
                  variant="outline"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 bg-white shadow-lg hover:bg-gray-50 z-10 hidden lg:flex"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

