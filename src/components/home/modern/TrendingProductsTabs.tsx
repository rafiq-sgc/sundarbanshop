'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Star, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

const tabs = [
  { id: 'fashion', label: 'Fashion' },
  { id: 'home', label: 'Home & Kitchen' },
  { id: 'sports', label: 'Sports & Outdoors' }
]

const products = {
  fashion: [
    { id: 1, name: 'Premium Cotton T-Shirt', price: 29.99, originalPrice: 39.99, image: '/images/products/product-1.jpg', rating: 5, discount: 19 },
    { id: 2, name: 'Classic Denim Jeans', price: 79.99, originalPrice: 99.99, image: '/images/products/product-2.jpg', rating: 5, discount: 19 },
    { id: 3, name: 'Sports Running Shoes', price: 89.99, originalPrice: 109.99, image: '/images/products/product-3.jpg', rating: 5, discount: 19 },
    { id: 4, name: 'Leather Crossbody Bag', price: 129.99, originalPrice: 159.99, image: '/images/products/product-4.jpg', rating: 5, discount: 19 },
  ],
  home: [
    { id: 5, name: 'Modern Coffee Maker', price: 89.99, originalPrice: 119.99, image: '/images/products/product-5.jpg', rating: 5, discount: 25 },
    { id: 6, name: 'Kitchen Knife Set', price: 149.99, originalPrice: 199.99, image: '/images/products/product-6.jpg', rating: 5, discount: 25 },
    { id: 7, name: 'Stainless Steel Cookware', price: 199.99, originalPrice: 249.99, image: '/images/products/product-7.jpg', rating: 5, discount: 20 },
    { id: 8, name: 'Smart Blender', price: 129.99, originalPrice: 159.99, image: '/images/products/product-8.jpg', rating: 5, discount: 19 },
  ],
  sports: [
    { id: 9, name: 'Yoga Mat Premium', price: 39.99, originalPrice: 59.99, image: '/images/products/product-9.jpg', rating: 5, discount: 33 },
    { id: 10, name: 'Running Shoes Pro', price: 119.99, originalPrice: 149.99, image: '/images/products/product-10.jpg', rating: 5, discount: 20 },
    { id: 11, name: 'Dumbbell Set', price: 89.99, originalPrice: 119.99, image: '/images/products/product-11.jpg', rating: 5, discount: 25 },
    { id: 12, name: 'Sports Water Bottle', price: 19.99, originalPrice: 29.99, image: '/images/products/product-12.jpg', rating: 5, discount: 33 },
  ]
}

export default function TrendingProductsTabs() {
  const [activeTab, setActiveTab] = useState('fashion')

  return (
    <section className="py-4 sm:py-6 bg-white">
      <div className="container">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">Our Trending Products</h2>
        
        {/* Tabs */}
        <div className="flex justify-center mb-4 sm:mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-gray-100 p-1 sm:p-2 rounded-xl overflow-x-auto">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="data-[state=active]:bg-green-600 data-[state=active]:text-white whitespace-nowrap"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {products[activeTab as keyof typeof products].map((product) => (
            <Card
              key={product.id}
              className="group hover:shadow-lg transition-all duration-300"
            >
              {/* Product Image */}
              <Link href={`/products/${product.id}`} className="block">
                <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Discount Badge */}
                  <Badge className="absolute top-2 left-2 bg-red-600 text-white border-0 text-xs px-1.5 py-0.5 shadow-md">
                    -{product.discount}%
                  </Badge>
                </div>
              </Link>

              {/* Product Info */}
              <CardContent className="p-3">
                <Link href={`/products/${product.id}`}>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1.5 line-clamp-2 min-h-[2.5rem] hover:text-green-600 transition-colors">{product.name}</h3>
                </Link>
                
                {/* Rating */}
                <div className="flex items-center gap-0.5 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < product.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>

                {/* Price */}
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-lg font-bold text-gray-900">${product.price}</span>
                  <span className="text-xs text-gray-500 line-through">${product.originalPrice}</span>
                </div>

                {/* Add to Cart */}
                <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white h-9">
                  <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                  <span className="text-xs">Add to Cart</span>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

