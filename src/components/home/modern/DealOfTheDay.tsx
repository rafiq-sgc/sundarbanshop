'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Clock, ShoppingCart, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

export default function DealOfTheDay() {
  const deal = {
    title: 'Premium Organic Chicken 1KG',
    originalPrice: 599,
    dealPrice: 399,
    image: '/images/products/product-1.jpg',
    rating: 4.8,
    reviews: 156,
    timeLeft: '02:45:32',
    description: 'Free-range, hormone-free, fresh organic chicken'
  }

  const discount = Math.round(((deal.originalPrice - deal.dealPrice) / deal.originalPrice) * 100)

  return (
    <section className="py-16 bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container">
        <Card className="rounded-3xl shadow-xl overflow-hidden border-0">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Side - Image */}
            <div className="relative h-[400px] md:h-auto">
              <Image
                src={deal.image}
                alt={deal.title}
                fill
                className="object-cover rounded-l-3xl"
              />
              
              {/* Discount Badge */}
              <Badge className="absolute top-6 left-6 bg-red-600 text-white border-0 px-6 py-3 text-3xl font-bold shadow-lg">
                -{discount}% OFF
              </Badge>

              {/* Stock Badge */}
              <Badge className="absolute top-6 right-6 bg-green-600 text-white border-0 px-4 py-2 shadow-lg flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold">In Stock</span>
              </Badge>
            </div>

            {/* Right Side - Content */}
            <CardContent className="flex flex-col justify-center p-8 md:p-12">
              {/* Section Label */}
              <Badge className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 border-0 px-4 py-2 mb-6 w-fit">
                <Clock className="w-4 h-4" />
                Deal of the Day
              </Badge>

              {/* Title */}
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {deal.title}
              </h2>

              {/* Description */}
              <p className="text-gray-600 mb-6 text-lg">
                {deal.description}
              </p>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(deal.rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-gray-600 font-semibold">
                  {deal.rating}
                </span>
                <span className="text-gray-500">
                  ({deal.reviews} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-4 mb-6">
                <span className="text-4xl md:text-5xl font-bold text-green-600">
                  ৳{deal.dealPrice}
                </span>
                <span className="text-2xl text-gray-400 line-through">
                  ৳{deal.originalPrice}
                </span>
              </div>

              {/* Timer */}
              <div className="bg-gray-50 rounded-2xl p-6 mb-8">
                <p className="text-sm text-gray-600 mb-4 font-semibold">
                  Hurry up! Offer ends in:
                </p>
                <div className="flex items-center gap-4">
                  {deal.timeLeft.split(':').map((time, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div className="bg-green-600 text-white px-4 py-3 rounded-xl font-bold text-2xl min-w-[60px] text-center">
                        {time}
                      </div>
                      <span className="text-xs text-gray-600 mt-1 font-semibold">
                        {index === 0 ? 'Hours' : index === 1 ? 'Minutes' : 'Seconds'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-lg py-6"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1 border-2 border-green-600 text-green-600 hover:bg-green-50 text-lg py-6"
                  asChild
                >
                  <Link href={`/products/${deal.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    View Details
                  </Link>
                </Button>
              </div>

              {/* Progress Bar */}
              <div className="mt-8">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span className="font-semibold">Already Sold: 45/100</span>
                  <span className="font-semibold">45%</span>
                </div>
                <Progress value={45} className="h-3 bg-gray-200" />
              </div>
            </CardContent>
          </div>
        </Card>
      </div>
    </section>
  )
}

