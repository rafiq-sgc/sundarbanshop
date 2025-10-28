'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Heart, Star, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const tabs = [
  { id: 'trending', label: 'Trending Now' },
  { id: 'best', label: 'Best Sellers' },
  { id: 'new', label: 'New Arrivals' },
  { id: 'sale', label: 'On Sale' }
]

const products = {
  trending: [
    { id: 1, name: 'Organic Avocado', price: 399, originalPrice: 499, image: '/images/products/avocado.jpg', rating: 4.7, reviews: 89 },
    { id: 2, name: 'Fresh Spinach', price: 120, originalPrice: 150, image: '/images/products/spinach.jpg', rating: 4.5, reviews: 134 },
    { id: 3, name: 'Organic Quinoa', price: 450, originalPrice: 550, image: '/images/products/quinoa.jpg', rating: 4.8, reviews: 92 },
    { id: 4, name: 'Fresh Asparagus', price: 280, originalPrice: 350, image: '/images/products/asparagus.jpg', rating: 4.6, reviews: 67 }
  ],
  best: [
    { id: 5, name: 'Organic Eggs 12pcs', price: 150, originalPrice: 180, image: '/images/products/eggs.jpg', rating: 4.9, reviews: 245 },
    { id: 6, name: 'Fresh Organic Tomatoes', price: 299, originalPrice: 399, image: '/images/products/tomatoes.jpg', rating: 4.8, reviews: 156 },
    { id: 7, name: 'Premium Farm Milk', price: 80, originalPrice: 95, image: '/images/products/milk.jpg', rating: 4.7, reviews: 234 },
    { id: 8, name: 'Fresh Broccoli', price: 180, originalPrice: 220, image: '/images/products/broccoli.jpg', rating: 4.6, reviews: 112 }
  ],
  new: [
    { id: 9, name: 'Organic Blueberries', price: 520, originalPrice: 650, image: '/images/products/blueberries.jpg', rating: 4.8, reviews: 45 },
    { id: 10, name: 'Fresh Kale', price: 140, originalPrice: 170, image: '/images/products/kale.jpg', rating: 4.4, reviews: 28 },
    { id: 11, name: 'Organic Sweet Potatoes', price: 200, originalPrice: 250, image: '/images/products/sweet-potatoes.jpg', rating: 4.7, reviews: 56 },
    { id: 12, name: 'Fresh Bell Peppers', price: 180, originalPrice: 220, image: '/images/products/bell-peppers.jpg', rating: 4.5, reviews: 41 }
  ],
  sale: [
    { id: 13, name: 'Premium Steak', price: 799, originalPrice: 999, image: '/images/products/steak.jpg', rating: 4.9, reviews: 123 },
    { id: 14, name: 'Fresh Salmon', price: 899, originalPrice: 1100, image: '/images/products/salmon.jpg', rating: 4.8, reviews: 89 },
    { id: 15, name: 'Organic Honey', price: 450, originalPrice: 550, image: '/images/products/honey.jpg', rating: 4.9, reviews: 156 },
    { id: 16, name: 'Fresh Mushrooms', price: 220, originalPrice: 280, image: '/images/products/mushrooms.jpg', rating: 4.6, reviews: 73 }
  ]
}

export default function ProductTabsSection() {
  const [activeTab, setActiveTab] = useState('trending')

  const calculateDiscount = (price: number, originalPrice: number) => {
    return Math.round(((originalPrice - price) / originalPrice) * 100)
  }

  return (
    <section className="py-16 bg-white">
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Shop by Collection
          </h2>
          <p className="text-lg text-gray-600">
            Discover our curated product collections
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-gray-100 p-2 rounded-2xl">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
          {products[activeTab as keyof typeof products].map((product) => {
            const discount = calculateDiscount(product.price, product.originalPrice)
            
            return (
              <Card
                key={product.id}
                className="group hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                {/* Product Image */}
                <Link href={`/products/${product.name.toLowerCase().replace(/\s+/g, '-')}`} className="relative block aspect-[4/3] overflow-hidden">
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
                </Link>

                {/* Product Info */}
                <CardContent className="p-3">
                  <Link href={`/products/${product.name.toLowerCase().replace(/\s+/g, '-')}`}>
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
                  >
                    <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                    <span className="text-xs">Add to Cart</span>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* View All Link */}
        <div className="text-center">
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

