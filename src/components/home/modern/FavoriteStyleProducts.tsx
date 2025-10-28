'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Star, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const products = [
  { id: 1, name: 'Premium Cotton T-Shirt', price: 29.99, originalPrice: 39.99, image: '/images/products/product-1.jpg', rating: 5, discount: 20 },
  { id: 2, name: 'Classic Denim Jeans', price: 79.99, originalPrice: 99.99, image: '/images/products/product-2.jpg', rating: 5, discount: 20 },
  { id: 3, name: 'Sports Running Shoes', price: 89.99, originalPrice: 109.99, image: '/images/products/product-3.jpg', rating: 5, discount: 20 },
  { id: 4, name: 'Leather Crossbody Bag', price: 129.99, originalPrice: 159.99, image: '/images/products/product-4.jpg', rating: 5, discount: 20 },
]

export default function FavoriteStyleProducts() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.ceil(products.length / 4))
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.ceil(products.length / 4)) % Math.ceil(products.length / 4))
  }

  const visibleProducts = products.slice(currentIndex * 4, (currentIndex + 1) * 4)

  return (
    <section className="py-4 sm:py-6 bg-gray-50">
      <div className="container">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Our Favorite Style Product</h2>
          <div className="flex gap-2">
            <Button
              onClick={prevSlide}
              variant="outline"
              size="icon"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              onClick={nextSlide}
              variant="outline"
              size="icon"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-4">
          {/* Promotional Banner */}
          <div className="lg:col-span-1 relative rounded-xl overflow-hidden h-[300px] sm:h-[400px] lg:h-auto lg:min-h-[400px]">
            <Image
              src="/images/hero/hero-3.jpg"
              alt="Favorite Style"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4 sm:p-6 text-white">
              <h3 className="text-xl sm:text-2xl font-bold mb-2">Make Your Fashion Look More Changing</h3>
              <p className="text-base sm:text-lg mb-4 opacity-90">Get 50% Off on Selected Clothing Items</p>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white w-fit text-sm sm:text-base">
                Shop Now
              </Button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {visibleProducts.map((product) => (
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
      </div>
    </section>
  )
}

