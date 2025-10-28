'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Heart, Star, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Mock product data - Replace with actual API call
const featuredProducts = [
  {
    id: 1,
    name: 'Fresh Organic Tomatoes',
    slug: 'fresh-organic-tomatoes',
    price: 299,
    originalPrice: 399,
    image: '/images/products/tomatoes.jpg',
    rating: 4.5,
    reviews: 120,
    inStock: true,
    category: 'Fruits & Vegetables'
  },
  {
    id: 2,
    name: 'Premium Farm Eggs',
    slug: 'premium-farm-eggs',
    price: 150,
    originalPrice: 180,
    image: '/images/products/eggs.jpg',
    rating: 4.8,
    reviews: 89,
    inStock: true,
    category: 'Breakfast & Dairy'
  },
  {
    id: 3,
    name: 'Fresh Broccoli',
    slug: 'fresh-broccoli',
    price: 180,
    originalPrice: 220,
    image: '/images/products/broccoli.jpg',
    rating: 4.3,
    reviews: 67,
    inStock: true,
    category: 'Fruits & Vegetables'
  },
  {
    id: 4,
    name: 'Organic Honey',
    slug: 'organic-honey',
    price: 450,
    originalPrice: 550,
    image: '/images/products/honey.jpg',
    rating: 4.9,
    reviews: 156,
    inStock: true,
    category: 'Breakfast & Dairy'
  },
  {
    id: 5,
    name: 'Fresh Salmon Fillet',
    slug: 'fresh-salmon-fillet',
    price: 899,
    originalPrice: 1100,
    image: '/images/products/salmon.jpg',
    rating: 4.7,
    reviews: 92,
    inStock: true,
    category: 'Meat & Seafood'
  },
  {
    id: 6,
    name: 'Organic Strawberries',
    slug: 'organic-strawberries',
    price: 350,
    originalPrice: 420,
    image: '/images/products/strawberries.jpg',
    rating: 4.6,
    reviews: 134,
    inStock: true,
    category: 'Fruits & Vegetables'
  },
  {
    id: 7,
    name: 'Fresh Milk 1L',
    slug: 'fresh-milk-1l',
    price: 80,
    originalPrice: 95,
    image: '/images/products/milk.jpg',
    rating: 4.4,
    reviews: 245,
    inStock: true,
    category: 'Breakfast & Dairy'
  },
  {
    id: 8,
    name: 'Fresh Carrots',
    slug: 'fresh-carrots',
    price: 120,
    originalPrice: 150,
    image: '/images/products/carrots.jpg',
    rating: 4.5,
    reviews: 98,
    inStock: true,
    category: 'Fruits & Vegetables'
  }
]

export default function FeaturedProductsGrid() {
  const calculateDiscount = (price: number, originalPrice: number) => {
    return Math.round(((originalPrice - price) / originalPrice) * 100)
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Featured Products
            </h2>
            <p className="text-lg text-gray-600">
              Hand-picked premium quality products
            </p>
          </div>
          <Link
            href="/shop"
            className="hidden md:flex items-center gap-2 text-green-600 font-semibold hover:text-green-700 transition-colors"
          >
            View All
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {featuredProducts.map((product) => {
            const discount = calculateDiscount(product.price, product.originalPrice)
            
            return (
              <Card
                key={product.id}
                className="group hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                {/* Product Image */}
                <Link href={`/products/${product.slug}`} className="relative block aspect-[4/3] overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  
                  {/* Discount Badge */}
                  {discount > 0 && (
                    <Badge className="absolute top-2 left-2 bg-red-500 text-white border-0 text-xs px-1.5 py-0.5 shadow-md">
                      -{discount}%
                    </Badge>
                  )}

                  {/* Quick Actions */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button variant="outline" size="icon" className="h-7 w-7 bg-white rounded-full shadow-md">
                      <Heart className="w-3 h-3 text-gray-600" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-7 w-7 bg-white rounded-full shadow-md">
                      <ShoppingCart className="w-3 h-3 text-gray-600" />
                    </Button>
                  </div>

                  {/* Stock Indicator */}
                  {!product.inStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Badge className="bg-white text-gray-900 border-0 px-2 py-1 text-xs">
                        Out of Stock
                      </Badge>
                    </div>
                  )}
                </Link>

                {/* Product Info */}
                <CardContent className="p-3">
                  <Link href={`/products/${product.slug}`}>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1.5 line-clamp-2 min-h-[2.5rem] group-hover:text-green-600 transition-colors">
                      {product.name}
                    </h3>
                  </Link>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < Math.floor(product.rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-600">
                      ({product.reviews})
                    </span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-lg font-bold text-gray-900">
                      ৳{product.price}
                    </span>
                    {product.originalPrice > product.price && (
                      <span className="text-xs text-gray-500 line-through">
                        ৳{product.originalPrice}
                      </span>
                    )}
                  </div>

                  {/* Add to Cart Button */}
                  <Button
                    size="sm"
                    className="w-full bg-green-600 hover:bg-green-700 text-white h-9"
                    disabled={!product.inStock}
                  >
                    <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                    <span className="text-xs">Add to Cart</span>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* View All Link - Mobile */}
        <div className="text-center mt-8 md:hidden">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-8 py-3 border-2 border-green-600 text-green-600 font-semibold rounded-xl hover:bg-green-600 hover:text-white transition-all duration-300"
          >
            View All Products
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}

