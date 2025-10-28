'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Star, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const products = [
  { id: 1, name: "Men's Trendy Casual Shoes", price: 89.00, originalPrice: 120.00, image: '/images/products/product-7.jpg', rating: 5 },
  { id: 2, name: "Women's Elegant Handbag", price: 59.99, originalPrice: 80.00, image: '/images/products/product-8.jpg', rating: 5 },
  { id: 3, name: 'Wireless Bluetooth Headphones', price: 75.00, originalPrice: 90.00, image: '/images/products/product-9.jpg', rating: 5 },
]

export default function BestSellingProducts() {
  return (
    <section className="py-4 sm:py-6 bg-gray-50">
      <div className="container">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">Our Best Selling Products</h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Products */}
          {products.map((product) => {
            const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
            
            return (
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
                    {discount > 0 && (
                      <Badge className="absolute top-2 left-2 bg-red-600 text-white border-0 text-xs px-1.5 py-0.5 shadow-md">
                        -{discount}%
                      </Badge>
                    )}
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
                    {product.originalPrice > product.price && (
                      <span className="text-xs text-gray-500 line-through">${product.originalPrice}</span>
                    )}
                  </div>

                  {/* Buy Now Button */}
                  <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white h-9">
                    <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                    <span className="text-xs">Buy Now</span>
                  </Button>
                </CardContent>
              </Card>
            )
          })}

          {/* Promotional Banner */}
          <div className="relative rounded-xl overflow-hidden h-[300px] sm:h-[400px] lg:h-auto lg:min-h-[400px] sm:col-span-2 lg:col-span-1">
            <Image
              src="/images/hero/hero-2.jpg"
              alt="Best Sells Discount"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4 sm:p-6 text-white">
              <h3 className="text-xl sm:text-2xl font-bold mb-2">Best Sells Discount And Offer</h3>
              <p className="text-base sm:text-lg mb-4 opacity-90">Get 50% Off on Selected Clothing</p>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white w-fit text-sm sm:text-base">
                Shop Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

